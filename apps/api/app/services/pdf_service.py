"""PDF generation service for cover letters."""

import logging
import re
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class PDFService:
    """Service for generating PDF documents from cover letters."""

    @staticmethod
    def _sanitize_filename(filename: Optional[str]) -> str:
        """Sanitize filename for safe file download.

        Args:
            filename: Raw filename from user input.

        Returns:
            Sanitized filename safe for Content-Disposition header.
        """
        if not filename:
            return "cover_letter"

        # Keep only alphanumeric, dash, underscore; replace spaces with underscore
        # Remove: / \ < > : " | ? * .
        sanitized = re.sub(r'[/\\<>:"|?*.]', '', filename)
        sanitized = sanitized.replace(' ', '_')

        # Keep only allowed characters
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', sanitized)

        # Truncate to 100 characters
        sanitized = sanitized[:100]

        # Default if empty after sanitization
        return sanitized if sanitized else "cover_letter"

    @staticmethod
    def generate_cover_letter_pdf(
        content: str, file_name: Optional[str] = None
    ) -> bytes:
        """Generate a professional PDF from cover letter content.

        Args:
            content: Cover letter text content.
            file_name: Optional filename (will be sanitized).

        Returns:
            PDF file as bytes.

        Raises:
            ValueError: If content is empty or WeasyPrint fails.
        """
        if not content or not content.strip():
            raise ValueError("Content cannot be empty")

        try:
            from weasyprint import HTML
        except ImportError as e:
            logger.error("WeasyPrint not installed. Install with: uv add weasyprint")
            raise ValueError("PDF generation unavailable") from e

        # Get current date in professional format
        current_date = datetime.now().strftime("%B %d, %Y")

        # Convert \n\n to <p> tags for proper paragraph spacing
        paragraphs = content.split('\n\n')
        content_with_paragraphs = '\n'.join(
            f"<p>{para.strip()}</p>" for para in paragraphs if para.strip()
        )

        # HTML template with professional formatting
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    @page {{
      size: letter;
      margin: 1in;
    }}
    body {{
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }}
    .date {{
      margin-bottom: 2em;
    }}
    p {{
      margin: 0 0 1em 0;
      text-align: justify;
    }}
  </style>
</head>
<body>
  <div class="date">{current_date}</div>
  {content_with_paragraphs}
</body>
</html>"""

        try:
            # Generate PDF from HTML
            pdf_bytes = HTML(string=html_content).write_pdf()
            logger.info("Successfully generated cover letter PDF")
            return pdf_bytes
        except Exception as e:
            logger.error(f"WeasyPrint error generating PDF: {e}")
            raise ValueError("Failed to generate PDF") from e
