from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    MONGO_URI: str = ""

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    EMBEDDING_MODEL: str = "gemini-embedding-001"

    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "mental_health_kb"

    NODE_SERVER_URL: str = "http://localhost:5000"

    RISK_THRESHOLD_MEDIUM: int = 31
    RISK_THRESHOLD_HIGH: int = 61
    RISK_THRESHOLD_CRITICAL: int = 81

    MAX_HISTORY_LENGTH: int = 20
    RAG_TOP_K: int = 5
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def chroma_path(self) -> Path:
        return Path(self.CHROMA_PERSIST_DIR)

    @property
    def has_gemini(self) -> bool:
        return bool(self.GEMINI_API_KEY)


settings = Settings()
