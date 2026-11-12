"""Validate and extract text from uploaded resumes."""
import io
import re
from pathlib import Path

from app.core.exceptions import FileValidationError

ALLOWED = {".pdf": "pdf", ".docx": "docx"}
MIN_TEXT_CHARS = 50


def validate_and_detect(filename: str, data: bytes) -> str:
    """Check extension AND file signature (never trust the extension alone)."""
    ext = Path(filename or "").suffix.lower()
    if ext not in ALLOWED:
        raise FileValidationError("Only PDF and DOCX files are allowed.")
    if not data:
        raise FileValidationError("The uploaded file is empty.")
    if ext == ".pdf" and not data.startswith(b"%PDF"):
        raise FileValidationError("The file is not a valid PDF.")
    if ext == ".docx" and not data.startswith(b"PK"):  # DOCX is a zip archive
        raise FileValidationError("The file is not a valid DOCX document.")
    return ALLOWED[ext]


def _clean(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _pdf_text(data: bytes) -> str:
    import fitz  # PyMuPDF

    try:
        with fitz.open(stream=data, filetype="pdf") as doc:
            return "\n".join(page.get_text() for page in doc)
    except Exception as exc:
        raise FileValidationError("Could not read this PDF. It may be corrupted or password protected.") from exc


def _docx_text(data: bytes) -> str:
    from docx import Document

    try:
        doc = Document(io.BytesIO(data))
    except Exception as exc:
        raise FileValidationError("Could not read this DOCX file. It may be corrupted.") from exc
    parts = [p.text for p in doc.paragraphs]
    for table in doc.tables:
        for row in table.rows:
            parts.append(" | ".join(cell.text for cell in row.cells))
    return "\n".join(parts)


def extract_text(filename: str, data: bytes) -> tuple[str, str]:
    """Return (file_type, extracted_text)."""
    file_type = validate_and_detect(filename, data)
    text = _clean(_pdf_text(data) if file_type == "pdf" else _docx_text(data))
    if len(text) < MIN_TEXT_CHARS:
        raise FileValidationError(
            "Very little text could be extracted. Scanned/image-only resumes are not supported; "
            "please upload a text-based PDF or DOCX."
        )
    return file_type, text


def basic_info(text: str) -> dict:
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone = re.search(r"(\+?\d[\d\s().-]{8,}\d)", text)
    return {
        "email": email.group(0) if email else None,
        "phone": phone.group(0).strip() if phone else None,
        "word_count": len(text.split()),
    }
