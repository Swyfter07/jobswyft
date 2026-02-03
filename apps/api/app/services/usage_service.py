"""Usage tracking service for credit management."""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.core.exceptions import AuthenticationError, ErrorCode
from app.db.client import get_supabase_admin_client

logger = logging.getLogger(__name__)


class UsageService:
    """Service for tracking and checking credit usage."""

    def __init__(self):
        """Initialize usage service with admin client."""
        self.admin_client = get_supabase_admin_client()

    async def get_tier_limits(self) -> Dict[str, Any]:
        """Get tier limits from global_config.

        Returns:
            Dictionary of tier configurations.
        """
        response = (
            self.admin_client.table("global_config")
            .select("value")
            .eq("key", "tier_limits")
            .single()
            .execute()
        )

        if response.data:
            return response.data["value"]

        # Fallback defaults if config not found
        logger.warning("tier_limits not found in global_config, using defaults")
        return {
            "free": {"type": "lifetime", "credits": 5, "max_resumes": 5},
            "pro": {"type": "monthly", "credits": 100, "max_resumes": 10},
            "unlimited": {"type": "monthly", "credits": -1, "max_resumes": 25},
        }

    async def get_user_tier(self, user_id: str) -> str:
        """Get user's subscription tier from profile.

        Args:
            user_id: User's UUID.

        Returns:
            Tier name (free, pro, unlimited).

        Raises:
            AuthenticationError: If user profile not found.
        """
        response = (
            self.admin_client.table("profiles")
            .select("subscription_tier")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not response.data:
            logger.error(f"User profile not found for user_id: {user_id[:8]}...")
            raise AuthenticationError()

        return response.data.get("subscription_tier", "free")

    def _get_period_key(self, period_type: str) -> str:
        """Get the period key for a given period type.

        Args:
            period_type: Either 'lifetime' or 'monthly'.

        Returns:
            Period key string.
        """
        if period_type == "lifetime":
            return "lifetime"
        # Monthly format: YYYY-MM
        return datetime.now(timezone.utc).strftime("%Y-%m")

    async def check_credits(self, user_id: str) -> bool:
        """Check if user has remaining credits.

        WARNING: Race condition possible between check and record_usage.
        In high-concurrency scenarios, multiple requests could pass this check
        before any record_usage completes. Consider implementing optimistic locking
        or database-level constraints for production use.

        Args:
            user_id: User's UUID.

        Returns:
            True if user has credits available, False otherwise.
        """
        tier = await self.get_user_tier(user_id)
        limits = await self.get_tier_limits()
        tier_config = limits.get(tier, limits["free"])

        # Unlimited credits
        if tier_config["credits"] == -1:
            return True

        period_type = tier_config["type"]
        period_key = self._get_period_key(period_type)

        # Sum credits used in current period
        response = (
            self.admin_client.table("usage_events")
            .select("credits_used")
            .eq("user_id", user_id)
            .eq("period_type", period_type)
            .eq("period_key", period_key)
            .execute()
        )

        used = sum(row["credits_used"] for row in response.data) if response.data else 0
        remaining = tier_config["credits"] - used

        logger.info(
            f"Credit check for user {user_id[:8]}...: {used}/{tier_config['credits']} used, {remaining} remaining"
        )

        return remaining > 0

    async def get_max_resumes(self, user_id: str) -> int:
        """Get maximum resumes allowed for user's tier.

        Args:
            user_id: User's UUID.

        Returns:
            Maximum number of resumes allowed.
        """
        tier = await self.get_user_tier(user_id)
        limits = await self.get_tier_limits()
        tier_config = limits.get(tier, limits["free"])
        return tier_config.get("max_resumes", 5)

    async def record_usage(
        self,
        user_id: str,
        operation_type: str,
        ai_provider: Optional[str] = None,
        credits_used: int = 1,
    ) -> None:
        """Record a usage event.

        Args:
            user_id: User's UUID.
            operation_type: Type of operation (resume_parse, match, etc.).
            ai_provider: AI provider used (claude, gpt).
            credits_used: Number of credits consumed.
        """
        tier = await self.get_user_tier(user_id)
        limits = await self.get_tier_limits()
        tier_config = limits.get(tier, limits["free"])

        period_type = tier_config["type"]
        period_key = self._get_period_key(period_type)

        self.admin_client.table("usage_events").insert(
            {
                "user_id": user_id,
                "operation_type": operation_type,
                "ai_provider": ai_provider,
                "credits_used": credits_used,
                "period_type": period_type,
                "period_key": period_key,
            }
        ).execute()

        logger.info(
            f"Recorded usage: user={user_id[:8]}..., op={operation_type}, credits={credits_used}"
        )

    async def calculate_balance(self, user_id: str) -> Dict[str, Any]:
        """Calculate detailed balance with usage breakdown.

        Returns dict with: subscription_tier, period_type, period_key,
        credits_used, credits_limit, credits_remaining, usage_by_type,
        subscription_status, current_period_end

        Args:
            user_id: User's UUID.

        Returns:
            Dictionary containing detailed balance information.
        """
        from dateutil.relativedelta import relativedelta

        tier = await self.get_user_tier(user_id)
        limits = await self.get_tier_limits()
        tier_config = limits.get(tier, limits["free"])

        period_type = tier_config["type"]
        period_key = self._get_period_key(period_type)
        credits_limit = tier_config["credits"]

        # Query all usage events for current period
        response = (
            self.admin_client.table("usage_events")
            .select("credits_used, operation_type")
            .eq("user_id", user_id)
            .eq("period_type", period_type)
            .eq("period_key", period_key)
            .execute()
        )

        # Aggregate by operation type
        usage_by_type = {
            "match": 0,
            "cover_letter": 0,
            "answer": 0,
            "outreach": 0,
            "resume_parse": 0,
            "referral_bonus": 0,
        }
        total_used = 0

        for event in response.data or []:
            op_type = event.get("operation_type", "")
            credits = event.get("credits_used", 0)
            total_used += credits
            if op_type in usage_by_type:
                usage_by_type[op_type] += credits

        # Handle unlimited tier
        if credits_limit == -1:
            credits_remaining = -1  # Unlimited
        else:
            credits_remaining = credits_limit - total_used

        # Get subscription info and deletion status from profile
        profile_response = (
            self.admin_client.table("profiles")
            .select("subscription_status, deletion_token_expires")
            .eq("id", user_id)
            .single()
            .execute()
        )

        subscription_status = (
            profile_response.data.get("subscription_status", "active")
            if profile_response.data
            else "active"
        )

        # Check for pending deletion
        pending_deletion_expires = None
        if profile_response.data:
            expires_str = profile_response.data.get("deletion_token_expires")
            if expires_str and isinstance(expires_str, str):
                # Check if not expired
                try:
                    expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) <= expires_at:
                        pending_deletion_expires = expires_str
                except (ValueError, AttributeError):
                    # Invalid timestamp format, ignore
                    pass

        # Calculate current_period_end for monthly tiers
        current_period_end = None
        if period_type == "monthly":
            # Parse period_key (e.g., "2026-02") and calculate end of month
            year, month = map(int, period_key.split("-"))
            period_start = datetime(year, month, 1, tzinfo=timezone.utc)
            period_end = period_start + relativedelta(months=1) - relativedelta(seconds=1)
            current_period_end = period_end.isoformat()

        logger.info(
            f"Balance calculated for user {user_id[:8]}...: "
            f"{total_used}/{credits_limit} used, {credits_remaining} remaining"
        )

        result = {
            "subscription_tier": tier,
            "period_type": period_type,
            "period_key": period_key,
            "credits_used": total_used,
            "credits_limit": credits_limit,
            "credits_remaining": credits_remaining,
            "usage_by_type": usage_by_type,
            "subscription_status": subscription_status,
            "current_period_end": current_period_end,
        }

        # Include pending_deletion_expires only if present
        if pending_deletion_expires:
            result["pending_deletion_expires"] = pending_deletion_expires

        return result

    async def get_usage_history(
        self, user_id: str, page: int = 1, page_size: int = 20
    ) -> Dict[str, Any]:
        """Get paginated usage history for user.

        Args:
            user_id: User's UUID.
            page: Page number (1-indexed).
            page_size: Number of items per page.

        Returns:
            Dictionary with items, total, page, and page_size.
        """
        start = (page - 1) * page_size
        end = start + page_size - 1

        response = (
            self.admin_client.table("usage_events")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(start, end)
            .execute()
        )

        return {
            "items": response.data or [],
            "total": response.count or 0,
            "page": page,
            "page_size": page_size,
        }

    async def get_referral_bonus_amount(self) -> int:
        """Get referral bonus amount from global_config.

        Returns:
            Referral bonus credits (default 5 if not configured).
        """
        try:
            response = (
                self.admin_client.table("global_config")
                .select("value")
                .eq("key", "referral_bonus_credits")
                .single()
                .execute()
            )

            if response.data:
                return int(response.data["value"])
        except Exception as e:
            logger.warning(
                f"Failed to get referral_bonus_credits from config: {e}, using default"
            )

        return 5

    async def add_referral_credits(
        self, user_id: str, bonus_credits: int | None = None
    ) -> int:
        """Add referral bonus credits to user.

        Inserts negative credits_used to add credits.
        Referral bonuses are always lifetime (never expire).

        Args:
            user_id: User's UUID.
            bonus_credits: Credits to add (uses global_config if not specified).

        Returns:
            Number of credits added.
        """
        if bonus_credits is None:
            bonus_credits = await self.get_referral_bonus_amount()

        self.admin_client.table("usage_events").insert(
            {
                "user_id": user_id,
                "operation_type": "referral_bonus",
                "ai_provider": "system",
                "credits_used": -bonus_credits,  # Negative = add credits
                "period_type": "lifetime",
                "period_key": "lifetime",
            }
        ).execute()

        logger.info(
            f"Referral credits added - user: {user_id[:8]}..., amount: {bonus_credits}"
        )
        return bonus_credits
