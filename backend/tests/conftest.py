import io

import pytest
from docx import Document
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.ai.factory import get_llm_provider
from app.ai.providers.mock_provider import MockLLMProvider
from app.db.base import Base
from app.db.session import get_db
from app.main import app

RESUME_TEXT = [
    "Jane Doe - jane.doe@example.com - +91 98765 43210",
    "Final-year B.Tech student. Skills: Python, SQL, REST APIs, React, Git.",
    "Project: Built a FastAPI service with PostgreSQL and JWT authentication.",
]
JOB_TEXT = "We need a backend engineer with Python, FastAPI, Docker and AWS experience for REST APIs."


def make_docx(lines=RESUME_TEXT) -> bytes:
    doc = Document()
    for line in lines:
        doc.add_paragraph(line)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def make_pdf(lines=RESUME_TEXT) -> bytes:
    import fitz

    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "\n".join(lines))
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def mock_llm():
    return MockLLMProvider()


@pytest.fixture()
def client(db_session, mock_llm):
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_llm_provider] = lambda: mock_llm
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register(client, email="jane@example.com", name="Jane", password="password123"):
    r = client.post("/api/auth/register", json={"email": email, "full_name": name, "password": password})
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def auth(client):
    return register(client)


@pytest.fixture()
def other_auth(client):
    return register(client, email="mallory@example.com", name="Mallory")


def upload(client, headers, content=None, name="resume.docx", title=None):
    data = {"title": title} if title else {}
    return client.post("/api/resumes/upload", headers=headers, data=data,
                       files={"file": (name, content if content is not None else make_docx())})


def create_job(client, headers, title="Backend Engineer", company="Acme"):
    return client.post("/api/jobs", headers=headers, json={"title": title, "company": company, "description": JOB_TEXT})
