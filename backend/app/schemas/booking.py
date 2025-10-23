"""
Booking request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocationSchema(BaseModel):
    """Location coordinates and address"""
    address: str
    latitude: float
    longitude: float


class CreateBookingRequest(BaseModel):
    """Create new booking request"""
    pickup_location: LocationSchema
    destination: LocationSchema
    distance: float = Field(..., description="Distance in kilometers")
    estimated_time: int = Field(..., description="Estimated time in minutes")
    base_fare: float = Field(..., description="Base fare amount")
    gratuity: float = Field(default=0, description="Gratuity/tip amount")
    total_fare: float = Field(..., description="Total fare (base + gratuity)")
    notes: Optional[str] = Field(default="", description="Notes for driver")


class BookingResponse(BaseModel):
    """Booking response"""
    id: str
    user_id: str
    driver_id: Optional[str] = None
    pickup_location: LocationSchema
    destination: LocationSchema
    distance: float
    estimated_time: int
    base_fare: float
    gratuity: float
    total_fare: float
    notes: str
    status: str  # pending, accepted, in_progress, completed, cancelled
    created_at: datetime
    updated_at: datetime


class BookingListResponse(BaseModel):
    """List of bookings for user"""
    bookings: list[BookingResponse]
    total: int


class UpdateBookingStatusRequest(BaseModel):
    """Update booking status"""
    status: str = Field(..., description="New status: accepted, in_progress, completed, cancelled")
    driver_id: Optional[str] = Field(default=None, description="Driver ID if accepting")
