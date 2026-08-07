from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # extra="ignore" -- backend/.env also carries Spec Builder's own vars
    # (AIPM_MODEL, ANTHROPIC_API_KEY, JIRA_*), which app/spec_builder/main.py
    # reads directly via os.environ (python-dotenv), not through this model.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    # Both localhost and 127.0.0.1 -- browsers treat them as different
    # origins for CORS, and this middleware wraps the whole app, including
    # the /pm mount (app/spec_builder/main.py), so it has to cover whichever
    # one the frontend actually loaded from.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
