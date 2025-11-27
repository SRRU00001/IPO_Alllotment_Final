from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Get DATABASE_URL from environment or use Neon PostgreSQL
# Falls back to SQLite for local development
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://neondb_owner:npg_e0KTPYOs3kqj@ep-misty-king-adcnxsc2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")

if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    # PostgreSQL (Neon) - fix for SQLAlchemy compatibility
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    # Local development - SQLite
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'ipo_data.db')}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
