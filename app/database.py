import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to local SQLite for instant zero-configuration local use.
# In production / Docker Compose, override with PostgreSQL via DATABASE_URL.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gym.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session for requests and closes it cleanly."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables defined in the SQLAlchemy models."""
    Base.metadata.create_all(bind=engine)


def check_db_connection() -> bool:
    """Validate that the database connection is active and responsive."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

