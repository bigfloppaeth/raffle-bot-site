"""Configuration management using Pydantic Settings."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Discord Credentials (optional; if empty, bot will ask for manual login)
    discord_email: str = Field(default="")
    discord_password: str = Field(default="")

    # Browser Settings
    browser_headless: bool = Field(default=False)
    browser_minimized: bool = Field(default=True)
    browser_timeout: int = Field(default=30000)
    browser_user_data_dir: Optional[str] = Field(
        default=None,
        description="Path to Chrome user data directory (for persistent login). Leave empty to use default Chrome profile.",
    )

    # Action Delays (for human-like behavior)
    action_delay_min: int = Field(default=1000)
    action_delay_max: int = Field(default=3000)

    # Raffle-specific delays
    raffle_click_delay_min: int = Field(default=5000, description="Min delay between raffle clicks (ms)")
    raffle_click_delay_max: int = Field(default=10000, description="Max delay between raffle clicks (ms)")

    # Server delays
    server_delay_min: int = Field(default=20000, description="Min delay between servers (ms)")
    server_delay_max: int = Field(default=40000, description="Max delay between servers (ms)")

    # Retry Settings
    max_retries: int = Field(default=3)
    retry_delay: int = Field(default=5000)

    # Logging
    log_level: str = Field(default="INFO")

    def load_config_json(self) -> dict:
        """Load configuration from config.json file."""
        config_path = Path(__file__).parent.parent.parent / "config.json"
        if config_path.exists():
            return json.loads(config_path.read_text())
        return {}


@lru_cache
def get_settings() -> Settings:
    return Settings()

