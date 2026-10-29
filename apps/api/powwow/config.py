from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../../.env", ".env"), extra="ignore")
    app_env: str = "production"
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:56322/postgres"
    local_auth: bool = False
    local_auth_allowed_hosts: str = "127.0.0.1,::1,testclient"
    local_owner_id: str = "00000000-0000-4000-8000-000000000001"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "artifacts"
    storage_backend: str = "supabase"
    storage_path: Path = Path("../../.data/artifacts")
    max_upload_bytes: int = 20 * 1024 * 1024
    free_storage_quota_bytes: int = Field(default=500 * 1024 * 1024, ge=1)
    cloud_storage_grace_percent: float = Field(default=5, ge=0, le=10)
    cloud_storage_grace_max_bytes: int = Field(default=25 * 1024 * 1024, ge=0)
    local_staging_quota_bytes: int = Field(default=500 * 1024 * 1024, ge=1)
    local_retention_hours: int = Field(default=24, ge=1, le=168)
    max_generated_artifact_bytes: int = Field(default=100 * 1024 * 1024, ge=1, le=100 * 1024 * 1024)
    ollama_base_url: str = ""
    ollama_model: str = "qwen3:4b-instruct-2507-q4_K_M"
    openai_api_key: SecretStr = SecretStr("")
    openai_image_model: str = "gpt-image-2.5-sunburst-2026-09-08"
    openai_image_reservation_usd: float = Field(default=1.0, gt=0, le=10)
    language_daily_budget_usd: float = Field(default=2.0, gt=0, le=100)
    language_daily_turn_limit: int = Field(default=100, ge=1, le=1000)
    hosted_chat_timeout_seconds: int = Field(default=120, ge=10, le=300)
    http_model_base_url: str = ""
    local_media_url: str = ""
    powwow_worker_token: str = ""
    local_media_capabilities: str = "text_to_image"
    runpod_api_key: str = ""
    runpod_image_endpoint_id: str = ""
    runpod_video_endpoint_id: str = ""
    runpod_3d_endpoint_id: str = ""
    runpod_chat_endpoint_id: str = ""
    brave_api_key: str = ""
    runpod_hourly_rate_usd: float = 1.44
    max_run_budget_usd: float = 5.0
    account_budget_usd: float = 25.0
    development_uncapped_spending: bool = False
    worker_poll_seconds: float = 1.0
    worker_capabilities: str = ""
    worker_lease_seconds: int = 60
    provider_timeout_seconds: int = 1200
    blender_binary: str = "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe"
    enable_test_provider: bool = False

    @property
    def spending_limits_enabled(self) -> bool:
        # A server-only, explicit development choice; never a browser override.
        return self.app_env != 'development' or not self.development_uncapped_spending

    @property
    def media_url(self) -> str:
        return (self.http_model_base_url or self.local_media_url).rstrip("/")

    def validate_runtime(self) -> None:
        if self.local_auth and self.app_env != "development":
            raise RuntimeError("LOCAL_AUTH is allowed only with APP_ENV=development")
        if self.database_url.startswith("sqlite") and self.app_env != "test":
            raise RuntimeError("SQLite is for tests only; configure PostgreSQL DATABASE_URL")
        if not self.local_auth and self.app_env != "test" and not self.supabase_url:
            raise RuntimeError("Configure SUPABASE_URL, or explicitly opt into local development auth")
        if self.enable_test_provider and self.app_env != "test":
            raise RuntimeError("The test provider cannot be enabled outside tests")
        if self.max_upload_bytes > 100 * 1024 * 1024:
            raise RuntimeError("MAX_UPLOAD_BYTES must not exceed 100 MiB")
        if self.storage_backend not in {"supabase", "local"}:
            raise RuntimeError("STORAGE_BACKEND must be supabase or local")
        if self.supabase_url:
            address = urlsplit(self.supabase_url)
            local_http = self.app_env in {"development", "test"} and address.scheme == "http" and address.hostname in {"127.0.0.1", "localhost", "::1"}
            if address.username or address.password or (address.scheme != "https" and not local_http):
                raise RuntimeError("Supabase requires HTTPS; HTTP is allowed only for loopback development")
        if self.storage_backend == "supabase" and self.app_env != "test" and (not self.supabase_url or not self.supabase_service_role_key):
            raise RuntimeError("Supabase storage requires SUPABASE_URL and a server-side service role key")


@lru_cache
def settings() -> Settings:
    return Settings()
