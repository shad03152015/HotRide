"""
Livestream request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StartLivestreamRequest(BaseModel):
    """Start livestream request"""
    booking_id: str = Field(..., description="Booking ID for the ride")
    title: Optional[str] = Field(default="Live Ride", description="Stream title")


class LivestreamResponse(BaseModel):
    """Livestream response"""
    id: str
    user_id: str
    booking_id: str
    title: str
    viewer_count: int
    is_active: bool
    started_at: datetime
    ended_at: Optional[datetime] = None


class JoinLivestreamResponse(BaseModel):
    """Join livestream response"""
    livestream: LivestreamResponse
    stream_url: Optional[str] = None  # WebRTC URL in production
    chat_room_id: str


class LiveCommentRequest(BaseModel):
    """Send live comment request"""
    livestream_id: str
    message: str = Field(..., max_length=200)


class LiveCommentResponse(BaseModel):
    """Live comment response"""
    id: str
    livestream_id: str
    user_id: str
    username: str
    message: str
    timestamp: datetime


class LivestreamListResponse(BaseModel):
    """List of active livestreams"""
    livestreams: List[LivestreamResponse]
    total: int
