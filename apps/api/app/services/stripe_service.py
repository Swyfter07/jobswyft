"""Stripe service interface and mock implementation."""

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict

from app.core.exceptions import InvalidSubscriptionTierError

logger = logging.getLogger(__name__)


class StripeService(ABC):
    """Abstract interface for Stripe operations."""

    @abstractmethod
    async def create_checkout_session(
        self, user_id: str, tier: str, success_url: str, cancel_url: str
    ) -> Dict[str, Any]:
        """Create a checkout session for subscription upgrade."""
        pass

    @abstractmethod
    async def create_portal_session(self, user_id: str) -> Dict[str, Any]:
        """Create a customer portal session."""
        pass

    @abstractmethod
    async def handle_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Handle Stripe webhook events."""
        pass


class MockStripeService(StripeService):
    """Mock Stripe implementation for MVP testing."""

    # API tier names → Database tier names
    # IMPORTANT: Tier mapping explained:
    # - Database has 3 tiers: free (5 lifetime), pro (100/month), unlimited
    # - API exposes 3 paid tiers: starter, pro, power
    # - Both "starter" and "pro" map to database "pro" tier (100 credits/month)
    # - Differentiation is price point only: $4.99 vs $9.99 (Stripe handles pricing)
    # - "power" maps to database "unlimited" tier (unlimited credits)
    # This allows flexible pricing without database schema changes.
    TIER_MAPPING = {
        "starter": "pro",  # $4.99/mo → maps to monthly 100 credits
        "pro": "pro",  # $9.99/mo → stays as pro (same features, different price)
        "power": "unlimited",  # $19.99/mo → maps to unlimited
    }

    TIER_PRICES = {
        "starter": 4.99,
        "pro": 9.99,
        "power": 19.99,
    }

    async def create_checkout_session(
        self, user_id: str, tier: str, success_url: str, cancel_url: str
    ) -> Dict[str, Any]:
        """Mock checkout - immediately upgrades user."""
        logger.info(
            f"Mock checkout session created - user: {user_id[:8]}..., tier: {tier}"
        )

        if tier not in self.TIER_PRICES:
            raise InvalidSubscriptionTierError(tier)

        # Map API tier to database tier
        db_tier = self.TIER_MAPPING.get(tier, "pro")

        from app.db.client import get_supabase_admin_client

        admin_client = get_supabase_admin_client()
        admin_client.table("profiles").update(
            {
                "subscription_tier": db_tier,
                "subscription_status": "active",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        ).eq("id", user_id).execute()

        # Audit log for subscription tier changes (critical for billing reconciliation)
        logger.warning(
            f"SUBSCRIPTION_TIER_CHANGED: user_id={user_id}, from_tier=unknown, "
            f"to_tier={db_tier}, api_tier={tier}, reason=checkout_mock, "
            f"price=${self.TIER_PRICES[tier]}, timestamp={datetime.now(timezone.utc).isoformat()}"
        )

        return {
            "checkout_url": f"mock://checkout?tier={tier}",
            "mock": True,
        }

    async def create_portal_session(self, user_id: str) -> Dict[str, Any]:
        """Mock portal session."""
        logger.info(f"Mock portal session created - user: {user_id[:8]}...")

        return {
            "portal_url": "mock://portal",
            "mock": True,
        }

    async def handle_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Mock webhook handler - no-op for now."""
        logger.info("Mock webhook received - no processing in MVP")
        return {"status": "ignored"}


class RealStripeService(StripeService):
    """Real Stripe implementation - to be implemented post-MVP."""

    def __init__(self):
        raise NotImplementedError("Real Stripe integration not yet implemented")

    async def create_checkout_session(
        self, user_id: str, tier: str, success_url: str, cancel_url: str
    ) -> Dict[str, Any]:
        raise NotImplementedError()

    async def create_portal_session(self, user_id: str) -> Dict[str, Any]:
        raise NotImplementedError()

    async def handle_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        raise NotImplementedError()
