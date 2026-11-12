from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Resume, User
from app.schemas.resume import ResumeDetail, ResumeInfo, ResumeListItem
from app.services import resume_parser, resume_service

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _detail(resume: Resume) -> ResumeDetail:
    base = ResumeListItem.model_validate(resume).model_dump()
    return ResumeDetail(**base, extracted_text=resume.extracted_text,
                        info=ResumeInfo(**resume_parser.basic_info(resume.extracted_text)))


@router.post("/upload", response_model=ResumeDetail, status_code=201)
def upload_resume(
    file: UploadFile = File(...),
    title: str | None = Form(default=None, max_length=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    max_bytes = get_settings().max_upload_bytes
    data = file.file.read(max_bytes + 1)  # read one extra byte so we can detect oversize without loading it all
    resume = resume_service.create_from_upload(db, user, file.filename or "resume", data, title, max_bytes)
    return _detail(resume)


@router.get("", response_model=list[ResumeListItem])
def list_resumes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc(), Resume.id.desc())))


@router.get("/{resume_id}", response_model=ResumeDetail)
def get_resume(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _detail(resume_service.get_owned_resume(db, user, resume_id))


@router.delete("/{resume_id}", status_code=204)
def delete_resume(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(resume_service.get_owned_resume(db, user, resume_id))
    db.commit()
