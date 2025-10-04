from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
from .config import DB_PATH

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120))
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    credits = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=None)
    last_reset = Column(DateTime, default=None)

class Upload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    path = Column(Text, nullable=False)
    w = Column(Integer, default=0); h = Column(Integer, default=0)
    preview_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Face(Base):
    __tablename__ = "faces"
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, index=True, nullable=False)
    x = Column(Integer, nullable=False); y = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False); height = Column(Integer, nullable=False)
    preview_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DialogueLog(Base):
    __tablename__ = "dialogues"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    character_id = Column(String(64), nullable=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String(64), primary_key=True, index=True)
    job_uid = Column(String(64), index=True)
    user_id = Column(Integer, index=True)
    image_path = Column(Text, nullable=False)
    aspect = Column(String(8), default="16:9")
    resolution = Column(String(10), default="480p")
    prompt = Column(Text, default="")
    dialogues_json = Column(Text, default="[]")
    status = Column(String(20), default="queued")
    video_path = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def migrate_schema(engine):
    conn = engine.connect()
    try:
        cols = [r[1] for r in conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
        if "last_login" not in cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_login DATETIME")
        if "last_reset" not in cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN last_reset DATETIME")
    except Exception:
        pass
    try:
        cols = [r[1] for r in conn.exec_driver_sql("PRAGMA table_info(jobs)").fetchall()]
        if "job_uid" not in cols:
            conn.exec_driver_sql("ALTER TABLE jobs ADD COLUMN job_uid VARCHAR(64)")
        if "updated_at" not in cols:
            conn.exec_driver_sql("ALTER TABLE jobs ADD COLUMN updated_at DATETIME")
    except Exception:
        pass
    conn.close()
