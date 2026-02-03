"""Webhooks router - External service webhooks."""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from app.core.config import settings
from app.services.stripe_service import (
    MockStripeService,
    RealStripeService,
    StripeService,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks")


def get_stripe_service() -> StripeService:
    """Factory to get appropriate Stripe service instance."""
    if settings.stripe_mock_mode:
        return MockStripeService()
    else:
        return RealStripeService()


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_service: StripeService = Depends(get_stripe_service),
) -> Dict[str, Any]:
    """Stripe webhook handler.

    In mock mode, this is a no-op stub.

    Post-MVP Implementation Notes:
    1. Verify signature: stripe.Webhook.construct_event(payload, signature, secret)
    2. Handle subscription events:
       - customer.subscription.created → Update user tier
       - customer.subscription.updated → Update tier/status
       - customer.subscription.deleted → Downgrade to free
       - invoice.payment_failed → Set status to past_due
    3. Return 200 immediately to acknowledge receipt
    4. Process events idempotently (check event.id for duplicates)
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    logger.info(f"Webhook received - signature present: {bool(signature)}")

    result = await stripe_service.handle_webhook(payload, signature)

    return {"received": True, "status": result.get("status")}
