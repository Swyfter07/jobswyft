# ── Stage 1: Build ──────────────────────────────────────────────
FROM python:3.11-slim-bookworm AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies first (cache-friendly layer)
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev --frozen

# Copy application source
COPY . .

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM python:3.11-slim-bookworm

# WeasyPrint system dependencies (pango, cairo, gdk-pixbuf, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libharfbuzz0b \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libffi8 \
    shared-mime-info \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual env and app from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app .

# Put venv on PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Railway injects PORT dynamically
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
