import pytest

from app.core.exceptions import FileValidationError
from app.services import resume_parser
from tests.conftest import make_docx, make_pdf, upload


def test_parse_docx_and_pdf():
    ftype, text = resume_parser.extract_text("a.docx", make_docx())
    assert ftype == "docx" and "FastAPI" in text
    ftype, text = resume_parser.extract_text("a.pdf", make_pdf())
    assert ftype == "pdf" and "FastAPI" in text


def test_parser_rejects_bad_files():
    with pytest.raises(FileValidationError):
        resume_parser.extract_text("notes.txt", b"hello")
    with pytest.raises(FileValidationError):
        resume_parser.extract_text("fake.pdf", b"not really a pdf")
    with pytest.raises(FileValidationError):
        resume_parser.extract_text("empty.docx", b"")
    with pytest.raises(FileValidationError):
        resume_parser.extract_text("tiny.docx", make_docx(["hi"]))  # too little text


def test_upload_docx_returns_extracted_info(client, auth):
    r = upload(client, auth, title="My CV")
    assert r.status_code == 201
    body = r.json()
    assert body["title"] == "My CV" and body["file_type"] == "docx"
    assert body["info"]["email"] == "jane.doe@example.com"
    assert "Python" in body["extracted_text"]


def test_upload_pdf(client, auth):
    assert upload(client, auth, make_pdf(), "cv.pdf").status_code == 201


def test_upload_rejects_wrong_type_and_oversize(client, auth, monkeypatch):
    assert upload(client, auth, b"plain text", "cv.txt").status_code == 422
    monkeypatch.setenv("MAX_UPLOAD_MB", "0")
    from app.core.config import get_settings
    get_settings.cache_clear()
    try:
        assert upload(client, auth).status_code == 413
    finally:
        monkeypatch.delenv("MAX_UPLOAD_MB")
        get_settings.cache_clear()


def test_list_get_delete(client, auth):
    rid = upload(client, auth).json()["id"]
    listing = client.get("/api/resumes", headers=auth).json()
    assert len(listing) == 1 and "extracted_text" not in listing[0]
    assert client.get(f"/api/resumes/{rid}", headers=auth).status_code == 200
    assert client.delete(f"/api/resumes/{rid}", headers=auth).status_code == 204
    assert client.get(f"/api/resumes/{rid}", headers=auth).status_code == 404


def test_users_cannot_access_each_others_resumes(client, auth, other_auth):
    rid = upload(client, auth).json()["id"]
    assert client.get(f"/api/resumes/{rid}", headers=other_auth).status_code == 404
    assert client.delete(f"/api/resumes/{rid}", headers=other_auth).status_code == 404
    assert client.get("/api/resumes", headers=other_auth).json() == []
