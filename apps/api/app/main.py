"""Jobswyft API - Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.core.config import settings
from app.core.security import register_exception_handlers
from app.routers import ai, auth, autofill, feedback, jobs, privacy, resumes, subscriptions, usage, webhooks

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.environment == "development" else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events.

    Args:
        app: The FastAPI application instance.
    """
    # Startup
    logger.info("Starting Jobswyft API v1.0.0")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"CORS origins: {settings.allowed_origins}")
    yield
    # Shutdown (if needed in future)
    logger.info("Shutting down Jobswyft API")


# Create FastAPI app
app = FastAPI(
    title="Jobswyft API",
    version="1.0.0",
    description="AI-powered job application assistant API",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers (replaces middleware approach)
register_exception_handlers(app)

# Include routers
app.include_router(auth.router, prefix="/v1", tags=["auth"])
app.include_router(resumes.router, prefix="/v1", tags=["resumes"])
app.include_router(jobs.router, prefix="/v1", tags=["jobs"])
app.include_router(ai.router, prefix="/v1", tags=["ai"])
app.include_router(autofill.router, prefix="/v1", tags=["autofill"])
app.include_router(feedback.router, prefix="/v1", tags=["feedback"])
app.include_router(usage.router, prefix="/v1", tags=["usage"])
app.include_router(subscriptions.router, prefix="/v1", tags=["subscriptions"])
app.include_router(privacy.router, prefix="/v1", tags=["privacy"])
app.include_router(webhooks.router, prefix="/v1", tags=["webhooks"])


def custom_openapi():
    """Generate custom OpenAPI schema with security."""
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Jobswyft API",
        version="1.0.0",
        description="AI-powered job application assistant API",
        routes=app.routes,
    )

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your Supabase JWT token",
        }
    }

    # Apply security globally to all endpoints except health and login
    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health")
async def health_check():
    """Health check endpoint.

    Returns:
        Health status and version.
    """
    return {"status": "ok", "version": "1.0.0"}
