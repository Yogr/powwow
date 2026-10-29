"""Coordinate Powwow's local model calls across API and worker processes."""
import time
from contextlib import contextmanager

import httpx
from sqlalchemy import text

from .config import settings
from .db import engine


def media_is_busy() -> bool:
    """A timed-out HTTP caller can leave a GPU generation running on 8188."""
    cfg = settings()
    if not cfg.media_url or cfg.app_env == "test":
        return False
    try:
        response = httpx.get(cfg.media_url + "/health", timeout=3)
        response.raise_for_status()
        return bool(response.json().get("busy"))
    except (httpx.HTTPError, ValueError, AttributeError):
        # If the configured shared runtime cannot confirm it is idle, avoid
        # loading a second model into potentially occupied GPU memory.
        return True


@contextmanager
def local_gpu(wait_seconds: float = 0):
    # Session advisory locks release automatically if a process disconnects.
    # Hold a dedicated connection, never the account/budget transaction.
    if engine.dialect.name != "postgresql":
        yield True
        return
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
        acquired = False
        deadline = time.monotonic() + wait_seconds
        try:
            while True:
                acquired = bool(connection.scalar(text("SELECT pg_try_advisory_lock(7349021102)")))
                if acquired or time.monotonic() >= deadline:
                    break
                time.sleep(.1)
            yield acquired
        finally:
            if acquired:
                connection.execute(text("SELECT pg_advisory_unlock(7349021102)"))
