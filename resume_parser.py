# resume_parser.py

from docx import Document

def extract_resume_text(file_path):

    if file_path.endswith(".pdf"):
        text = ""

        try:
            import fitz
            pdf = fitz.open(file_path)

            for page in pdf:
                text += page.get_text()
        except Exception:
            from PyPDF2 import PdfReader
            pdf = PdfReader(file_path)

            for page in pdf.pages:
                text += page.extract_text() or ""

        if not text.strip():
            with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
                text = file.read()

        return text

    elif file_path.endswith(".docx"):

        doc = Document(file_path)

        text = "\n".join(
            para.text for para in doc.paragraphs
        )

        return text

    elif file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
            return file.read()

    return ""
