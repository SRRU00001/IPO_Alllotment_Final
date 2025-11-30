from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Get DATABASE_URL from environment or use SQLite for local development
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Check if PostgreSQL is available and should be used
if DATABASE_URL and DATABASE_URL.startswith(("postgresql", "postgres")):
    try:
        # Try to import psycopg2 to verify PostgreSQL support
        import psycopg2
        # PostgreSQL (Neon) - fix for SQLAlchemy compatibility
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        engine = create_engine(DATABASE_URL)
        print("📊 Using PostgreSQL database")
    except ImportError:
        # psycopg2 not available, fall back to SQLite
        print("⚠️  PostgreSQL not available, falling back to SQLite")
        DATABASE_URL = None

if not DATABASE_URL or not DATABASE_URL.startswith("postgresql"):
    # Local development - SQLite
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'ipo_data.db')}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    print(f"📊 Using SQLite database: {os.path.join(BASE_DIR, 'ipo_data.db')}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
