from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import JobDescription, User
from app.schemas.job import JobCreate, JobOut
from app.services.resume_service import get_owned_job

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobOut, status_code=201)
def create_job(data: JobCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = JobDescription(user_id=user.id, **data.model_dump())
    db.add(job)
    db.commit()
    return job


@router.get("", response_model=list[JobOut])
def list_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(JobDescription).where(JobDescription.user_id == user.id)
                           .order_by(JobDescription.created_at.desc(), JobDescription.id.desc())))


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_owned_job(db, user, job_id)


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(get_owned_job(db, user, job_id))
    db.commit()
