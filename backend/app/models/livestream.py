"""
Livestream model and database indexes
"""
from datetime import datetime
from typing import Optional

# Livestream status constants
STATUS_ACTIVE = "active"
STATUS_ENDED = "ended"

def get_livestream_document(
    user_id: str,
    booking_id: str,
    title: str = "Live Ride",
) -> dict:
    """Create a new livestream document"""
    return {
        "user_id": user_id,
        "booking_id": booking_id,
        "title": title,
        "viewer_count": 0,
        "is_active": True,
        "status": STATUS_ACTIVE,
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

def get_live_comment_document(
    livestream_id: str,
    user_id: str,
    username: str,
    message: str,
) -> dict:
    """Create a new live comment document"""
    return {
        "livestream_id": livestream_id,
        "user_id": user_id,
        "username": username,
        "message": message,
        "timestamp": datetime.utcnow(),
        "created_at": datetime.utcnow(),
    }

# Database indexes for efficient queries
LIVESTREAM_INDEXES = [
    ("user_id", 1),
    ("booking_id", 1),
    ("is_active", 1),
    ("status", 1),
    ("created_at", -1),
    [("is_active", 1), ("created_at", -1)],
]

LIVE_COMMENT_INDEXES = [
    ("livestream_id", 1),
    ("created_at", -1),
    [("livestream_id", 1), ("created_at", -1)],
]
