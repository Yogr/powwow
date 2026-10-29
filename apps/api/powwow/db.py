from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


def now() -> datetime:
    return datetime.now(timezone.utc)


def uid() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


engine = create_engine(settings().database_url, pool_pre_ping=True, connect_args={"check_same_thread": False} if settings().database_url.startswith("sqlite") else {})
if settings().database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _sqlite_fk(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db():
    with SessionLocal() as session:
        yield session


def init_db():
    from . import models  # noqa: F401
    if engine.dialect.name == "postgresql":
        # API and worker may start together on a fresh database.
        with engine.connect() as connection:
            connection.execute(text("SELECT pg_advisory_lock(7349021101)"))
            try:
                Base.metadata.create_all(connection)
                from .migrations import postgres_nullable_projects, project_storage_choice
                postgres_nullable_projects(connection)
                project_storage_choice(connection)
                from .migrations import collaboration_projects
                collaboration_projects(connection)
                from .migrations import component_chat_sessions
                component_chat_sessions(connection)
                if settings().app_env == "production" or (settings().storage_backend == "supabase" and not settings().local_auth):
                    # Supabase exposes public schema tables through its Data API.
                    # Our service enforces ownership; browsers must never bypass it.
                    roles = set(connection.scalars(text("SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')")))
                    for table in Base.metadata.sorted_tables:
                        name = connection.dialect.identifier_preparer.quote(table.name)
                        connection.execute(text(f"ALTER TABLE {name} ENABLE ROW LEVEL SECURITY"))
                        connection.execute(text(f"REVOKE ALL ON TABLE {name} FROM PUBLIC"))
                        for role in roles:
                            connection.execute(text(f"REVOKE ALL ON TABLE {name} FROM {role}"))
                connection.commit()
            finally:
                connection.execute(text("SELECT pg_advisory_unlock(7349021101)"))
                connection.commit()
    else:
        Base.metadata.create_all(engine)
        from .migrations import sqlite_nullable_projects
        sqlite_nullable_projects(engine)
        from .migrations import sqlite_private_component_sessions
        sqlite_private_component_sessions(engine)
        from .migrations import project_storage_choice
        with engine.begin() as connection:
            project_storage_choice(connection)
            from .migrations import collaboration_projects
            collaboration_projects(connection)
            from .migrations import component_chat_sessions
            component_chat_sessions(connection)
