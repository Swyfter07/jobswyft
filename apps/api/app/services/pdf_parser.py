"""PDF text extraction service."""

import io
import logging

import pdfplumber

logger = logging.getLogger(__name__)


def extract_text_from_pdf(content: bytes) -> str:
    """Extract text content from a PDF file.

    Args:
        content: Raw PDF file bytes.

    Returns:
        Extracted text from all pages concatenated.

    Raises:
        ValueError: If the PDF cannot be parsed.
    """
    try:
        text_parts: list[str] = []

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        full_text = "\n\n".join(text_parts)

        if not full_text.strip():
            raise ValueError("No text content found in PDF")

        logger.info(f"Extracted {len(full_text)} characters from PDF")
        return full_text

    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Failed to extract text from PDF: {e}") from e
