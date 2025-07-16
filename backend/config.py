import os
from typing import List

class Settings:
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./good_vibes.db")
    
    # Authentication Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production-make-it-long-and-random")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Default User Configuration (change these!)
    DEFAULT_USERNAME: str = os.getenv("DEFAULT_USERNAME", "admin")
    DEFAULT_PASSWORD: str = os.getenv("DEFAULT_PASSWORD", "admin123")
    
    # CORS Configuration - Updated for production
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://good-vibes-planner-ctef8c8ih-sedricks-projects-c8cbcc98.vercel.app,https://good-vibes-planner.vercel.app,https://sedrickkeh.pythonanywhere.com").split(",")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Production Environment Detection
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

settings = Settings() 