"""Subscriptions router - Billing and subscription management endpoints."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.deps import CurrentUser
from app.core.exceptions import MockModeDisabledError
from app.db.client import get_supabase_admin_client
from app.models.base import ok
from app.models.subscriptions import (
    CheckoutRequest,
    MockCancelRequest,
)
from app.services.stripe_service import (
    MockStripeService,
    RealStripeService,
    StripeService,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscriptions")


def get_stripe_service() -> StripeService:
    """Factory to get appropriate Stripe service instance."""
    if settings.stripe_mock_mode:
        return MockStripeService()
    else:
        return RealStripeService()


@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    user: CurrentUser,
    stripe_service: StripeService = Depends(get_stripe_service),
) -> Dict[str, Any]:
    """Create a checkout session for subscription upgrade.

    In mock mode, immediately upgrades user's tier.
    In production, returns Stripe Checkout URL.
    """
    user_id = user["id"]
    logger.info(
        f"Checkout requested - user: {user_id[:8]}..., tier: {request.tier.value}"
    )

    result = await stripe_service.create_checkout_session(
        user_id=user_id,
        tier=request.tier.value,
        success_url=request.success_url,
        cancel_url=request.cancel_url,
    )

    assert result is not None, "Stripe service returned None"
    assert "checkout_url" in result, "Missing checkout_url in response"

    logger.info(
        f"Checkout created - user: {user_id[:8]}..., mock: {result.get('mock', False)}"
    )
    return ok(result)


@router.post("/portal")
async def create_portal_session(
    user: CurrentUser,
    stripe_service: StripeService = Depends(get_stripe_service),
) -> Dict[str, Any]:
    """Create a customer portal session for subscription management.

    In mock mode, returns mock portal URL.
    In production, returns Stripe Customer Portal URL.
    """
    user_id = user["id"]
    logger.info(f"Portal session requested - user: {user_id[:8]}...")

    result = await stripe_service.create_portal_session(user_id=user_id)

    assert result is not None, "Stripe service returned None"
    assert "portal_url" in result, "Missing portal_url in response"

    logger.info(
        f"Portal session created - user: {user_id[:8]}..., mock: {result.get('mock', False)}"
    )
    return ok(result)


@router.post("/mock-cancel")
async def mock_cancel_subscription(
    request: MockCancelRequest,
    user: CurrentUser,
) -> Dict[str, Any]:
    """Mock cancellation endpoint (dev/test only).

    Downgrades user to free tier. Only available in mock mode.
    """
    if not settings.stripe_mock_mode:
        raise MockModeDisabledError()

    user_id = user["id"]
    logger.info(f"Mock cancel requested - user: {user_id[:8]}...")

    admin_client = get_supabase_admin_client()
    admin_client.table("profiles").update(
        {
            "subscription_tier": "free",
            "subscription_status": "canceled",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", user_id).execute()

    # Audit log for subscription cancellations (critical for billing reconciliation)
    logger.warning(
        f"SUBSCRIPTION_CANCELED: user_id={user_id}, to_tier=free, "
        f"to_status=canceled, reason=mock_cancel, "
        f"timestamp={datetime.now(timezone.utc).isoformat()}"
    )
    return ok({"message": "Subscription canceled (mock)", "tier": "free"})
