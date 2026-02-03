# Jobswyft API

AI-powered job application assistant backend built with FastAPI.

## Development Setup

### Prerequisites
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

```bash
# Install dependencies
uv sync

# Install dev dependencies (required for testing)
uv sync --all-groups

# Copy environment template
cp .env.example .env
# Edit .env with your Supabase and AI provider credentials
```

### Running the API

```bash
# Development server with hot reload
uv run uvicorn app.main:app --reload --port 3001

# Production
uv run uvicorn app.main:app --host 0.0.0.0 --port 3001
```

### Running Tests

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_resumes.py

# Run with verbose output
uv run pytest -v

# Run with coverage
uv run pytest --cov=app
```

**Important:** Tests require dev dependencies. Run `uv sync --all-groups` before testing.

## Environment Variables

Required variables (see `.env.example`):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin)
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - OpenAI API key

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## Project Structure

```
app/
├── core/           # Config, security, exceptions
├── db/             # Database client
├── models/         # Pydantic models
├── routers/        # API endpoints
└── services/       # Business logic
    └── ai/         # AI provider implementations
tests/              # Test suite
```
