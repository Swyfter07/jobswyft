"""Base response models following the envelope pattern."""

from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Error detail structure."""

    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response envelope."""

    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None


class PaginatedData(BaseModel, Generic[T]):
    """Paginated data structure."""

    items: List[T]
    total: int
    page: int
    page_size: int


def ok(data: Any) -> Dict[str, Any]:
    """Create a success response.

    Args:
        data: The response data.

    Returns:
        A success response dict.
    """
    return {"success": True, "data": data}


def error_response(
    code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create an error response.

    Args:
        code: Error code.
        message: Error message.
        details: Additional error details.

    Returns:
        An error response dict.
    """
    error_dict: Dict[str, Any] = {"code": code, "message": message}
    if details:
        error_dict["details"] = details
    return {"success": False, "error": error_dict}


def paginated(
    items: List[Any],
    total: int,
    page: int,
    page_size: int,
) -> Dict[str, Any]:
    """Create a paginated response.

    Args:
        items: List of items for current page.
        total: Total count of all items.
        page: Current page number.
        page_size: Number of items per page.

    Returns:
        A paginated success response dict.
    """
    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
    }
