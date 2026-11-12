"""Import every model so Base.metadata (used by Alembic and create_all) knows about all tables."""
from app.models.application_note import ApplicationNote
from app.models.job_application import ApplicationStatus, JobApplication
from app.models.job_description import JobDescription
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.models.user import User

__all__ = [
    "ApplicationNote", "ApplicationStatus", "JobApplication", "JobDescription",
    "Resume", "ResumeAnalysis", "User",
]
