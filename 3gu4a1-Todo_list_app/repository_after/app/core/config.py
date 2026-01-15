from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # Add environment-driven settings here (e.g., database URL) when migrating.
    app_name: str = "FastAPI Todo API"


settings = Settings()
