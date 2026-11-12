from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import ApplicationStatus, JobApplication, JobDescription, Resume, ResumeAnalysis, User
from app.schemas.dashboard import DashboardSummary
from app.services import analysis_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    def count(model):
        return db.scalar(select(func.count()).select_from(model).where(model.user_id == user.id)) or 0

    avg = db.scalar(select(func.avg(ResumeAnalysis.match_score)).where(ResumeAnalysis.user_id == user.id))
    rows = db.execute(
        select(JobApplication.status, func.count()).where(JobApplication.user_id == user.id).group_by(JobApplication.status)
    ).all()
    by_status = {s.value: 0 for s in ApplicationStatus}
    for status, n in rows:
        by_status[status.value] = n
    return DashboardSummary(
        total_resumes=count(Resume),
        total_jobs=count(JobDescription),
        total_analyses=count(ResumeAnalysis),
        average_match_score=round(float(avg), 1) if avg is not None else None,
        recent_analyses=[analysis_service.to_list_item(a) for a in analysis_service.history(db, user, limit=5)],
        applications_by_status=by_status,
    )
