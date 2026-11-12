from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import ApplicationStatus, User
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate, NoteCreate
from app.services import application_service as svc

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=ApplicationOut, status_code=201)
def create(data: ApplicationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.create(db, user, data)


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    status: ApplicationStatus | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return svc.list_for_user(db, user, status)


@router.patch("/{app_id}", response_model=ApplicationOut)
def update(app_id: int, data: ApplicationUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.update(db, user, app_id, data)


@router.delete("/{app_id}", status_code=204)
def delete(app_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(svc.get_owned(db, user, app_id))
    db.commit()


@router.post("/{app_id}/notes", response_model=ApplicationOut, status_code=201)
def add_note(app_id: int, data: NoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return svc.add_note(db, user, app_id, data.content)


@router.delete("/{app_id}/notes/{note_id}", status_code=204)
def delete_note(app_id: int, note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    svc.delete_note(db, user, app_id, note_id)
