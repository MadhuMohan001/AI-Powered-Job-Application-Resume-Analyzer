from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import ApplicationNote, ApplicationStatus, JobApplication, User
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.services.resume_service import get_owned_job


def create(db: Session, user: User, data: ApplicationCreate) -> JobApplication:
    if data.job_id:
        get_owned_job(db, user, data.job_id)  # can't link someone else's job
    app = JobApplication(user_id=user.id, **data.model_dump(exclude={"note"}))
    if data.note:
        app.notes.append(ApplicationNote(content=data.note))
    db.add(app)
    db.commit()
    return app


def list_for_user(db: Session, user: User, status: ApplicationStatus | None) -> list[JobApplication]:
    q = select(JobApplication).where(JobApplication.user_id == user.id)
    if status:
        q = q.where(JobApplication.status == status)
    return list(db.scalars(q.order_by(JobApplication.created_at.desc(), JobApplication.id.desc())))


def get_owned(db: Session, user: User, app_id: int) -> JobApplication:
    app = db.scalar(select(JobApplication).where(JobApplication.id == app_id, JobApplication.user_id == user.id))
    if not app:
        raise NotFoundError("Application not found.")
    return app


def update(db: Session, user: User, app_id: int, data: ApplicationUpdate) -> JobApplication:
    app = get_owned(db, user, app_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    db.commit()
    return app


def add_note(db: Session, user: User, app_id: int, content: str) -> JobApplication:
    app = get_owned(db, user, app_id)
    app.notes.append(ApplicationNote(content=content))
    db.commit()
    return app


def delete_note(db: Session, user: User, app_id: int, note_id: int) -> None:
    app = get_owned(db, user, app_id)
    note = next((n for n in app.notes if n.id == note_id), None)
    if not note:
        raise NotFoundError("Note not found.")
    app.notes.remove(note)
    db.commit()
