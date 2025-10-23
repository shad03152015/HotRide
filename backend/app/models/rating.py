"""
Rating model and database indexes
"""
from datetime import datetime


def get_rating_document(
    booking_id: str,
    user_id: str,
    driver_id: str,
    rating: int,
    comment: str = "",
) -> dict:
    """Create a new rating document"""
    return {
        "booking_id": booking_id,
        "user_id": user_id,
        "driver_id": driver_id,
        "rating": rating,
        "comment": comment,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# Database indexes for efficient queries
RATING_INDEXES = [
    ("booking_id", 1),
    ("user_id", 1),
    ("driver_id", 1),
    ("rating", 1),
    ("created_at", -1),
    [("driver_id", 1), ("created_at", -1)],
]
