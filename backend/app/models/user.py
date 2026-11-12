from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # cascade: deleting a user removes all their data (ORM level; DB also has ON DELETE CASCADE)
    resumes = relationship("Resume", cascade="all, delete-orphan")
    jobs = relationship("JobDescription", cascade="all, delete-orphan")
    analyses = relationship("ResumeAnalysis", cascade="all, delete-orphan")
    applications = relationship("JobApplication", cascade="all, delete-orphan")
