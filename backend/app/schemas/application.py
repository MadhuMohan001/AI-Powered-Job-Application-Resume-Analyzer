from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.job_application import ApplicationStatus


class NoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content: str
    created_at: datetime


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    position: str = Field(min_length=1, max_length=200)
    status: ApplicationStatus = ApplicationStatus.applied
    applied_on: date | None = None
    interview_date: datetime | None = None
    job_id: int | None = None
    note: str | None = Field(default=None, max_length=5000)


class ApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    position: str | None = Field(default=None, min_length=1, max_length=200)
    status: ApplicationStatus | None = None
    applied_on: date | None = None
    interview_date: datetime | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company: str
    position: str
    status: ApplicationStatus
    applied_on: date | None
    interview_date: datetime | None
    job_id: int | None
    created_at: datetime
    notes: list[NoteOut] = []
