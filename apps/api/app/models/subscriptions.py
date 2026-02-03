"""Subscription models for billing endpoints."""

from enum import Enum

from pydantic import BaseModel, Field


class SubscriptionTier(str, Enum):
    """Valid subscription tiers for checkout."""

    STARTER = "starter"
    PRO = "pro"
    POWER = "power"


class CheckoutRequest(BaseModel):
    """Request to create checkout session."""

    tier: SubscriptionTier = Field(..., description="Subscription tier")
    success_url: str = Field(..., description="URL to redirect on success")
    cancel_url: str = Field(..., description="URL to redirect on cancel")


class CheckoutResponse(BaseModel):
    """Response from checkout session creation."""

    checkout_url: str
    mock: bool = False


class PortalResponse(BaseModel):
    """Response from portal session creation."""

    portal_url: str
    mock: bool = False


class MockCancelRequest(BaseModel):
    """Request to mock-cancel subscription (dev/test only)."""

    pass
