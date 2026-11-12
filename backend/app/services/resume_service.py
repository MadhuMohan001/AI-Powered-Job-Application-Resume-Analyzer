from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import FileTooLargeError, NotFoundError
from app.models import JobDescription, Resume, User
from app.services import resume_parser


def create_from_upload(db: Session, user: User, filename: str, data: bytes, title: str | None, max_bytes: int) -> Resume:
    if len(data) > max_bytes:
        raise FileTooLargeError(f"File is too large. Maximum size is {max_bytes // (1024 * 1024)} MB.")
    file_type, text = resume_parser.extract_text(filename, data)
    resume = Resume(
        user_id=user.id,
        title=(title or filename).strip()[:200],
        original_name=filename[:255],
        file_type=file_type,
        file_size=len(data),
        extracted_text=text,
    )
    db.add(resume)
    db.commit()
    return resume


def get_owned_resume(db: Session, user: User, resume_id: int) -> Resume:
    """Ownership check lives in the query itself: other users' rows simply don't exist for you."""
    resume = db.scalar(select(Resume).where(Resume.id == resume_id, Resume.user_id == user.id))
    if not resume:
        raise NotFoundError("Resume not found.")
    return resume


def get_owned_job(db: Session, user: User, job_id: int) -> JobDescription:
    job = db.scalar(select(JobDescription).where(JobDescription.id == job_id, JobDescription.user_id == user.id))
    if not job:
        raise NotFoundError("Job description not found.")
    return job
