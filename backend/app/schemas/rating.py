"""
Rating schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SubmitRatingRequest(BaseModel):
    """Request schema for submitting ride rating"""
    booking_id: str = Field(..., description="Booking ID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: Optional[str] = Field(default="", max_length=500, description="Optional comment")


class RatingResponse(BaseModel):
    """Response schema for rating"""
    id: str
    booking_id: str
    user_id: str
    driver_id: str
    rating: int
    comment: str
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class DriverRatingStatsResponse(BaseModel):
    """Response schema for driver rating statistics"""
    driver_id: str
    average_rating: float
    total_ratings: int
    rating_breakdown: dict  # {"5": 10, "4": 5, "3": 2, "2": 1, "1": 0}
