import io

from docx import Document
from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

TEXT_EXTENSIONS = {".txt", ".md"}


async def extract_text(file: UploadFile) -> str:
    filename = file.filename or ""
    suffix = filename[filename.rfind(".") :].lower() if "." in filename else ""
    raw = await file.read()

    if suffix in TEXT_EXTENSIONS:
        return raw.decode("utf-8", errors="replace")

    if suffix == ".pdf":
        reader = PdfReader(io.BytesIO(raw))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)

    if suffix == ".docx":
        document = Document(io.BytesIO(raw))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type '{suffix}'. Supported: .txt, .md, .pdf, .docx",
    )
