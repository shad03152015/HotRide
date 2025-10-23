"""
Booking model for MongoDB
"""
from datetime import datetime
from typing import Optional


class Booking:
    """
    Booking document structure in MongoDB

    Collection: bookings

    Fields:
    - _id: ObjectId (auto-generated)
    - user_id: ObjectId (reference to users collection)
    - driver_id: ObjectId (reference to users collection, null until accepted)
    - pickup_location: {
        address: str,
        latitude: float,
        longitude: float
      }
    - destination: {
        address: str,
        latitude: float,
        longitude: float
      }
    - distance: float (in kilometers)
    - estimated_time: int (in minutes)
    - base_fare: float (calculated: distance * BASE_FARE_PER_KM)
    - gratuity: float (tip amount)
    - total_fare: float (base_fare + gratuity)
    - notes: str (optional notes for driver)
    - status: str (pending, accepted, in_progress, completed, cancelled)
    - created_at: datetime
    - updated_at: datetime
    - completed_at: datetime (optional, when ride completed)
    """

    # Booking statuses
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"

    @staticmethod
    def create_booking_document(
        user_id: str,
        pickup_location: dict,
        destination: dict,
        distance: float,
        estimated_time: int,
        base_fare: float,
        gratuity: float,
        total_fare: float,
        notes: str = "",
    ) -> dict:
        """Create a new booking document"""
        return {
            "user_id": user_id,
            "driver_id": None,
            "pickup_location": pickup_location,
            "destination": destination,
            "distance": distance,
            "estimated_time": estimated_time,
            "base_fare": base_fare,
            "gratuity": gratuity,
            "total_fare": total_fare,
            "notes": notes,
            "status": Booking.STATUS_PENDING,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "completed_at": None,
        }


# MongoDB indexes to create on application startup
BOOKING_INDEXES = [
    ("user_id", 1),  # Index on user_id for fast user booking lookup
    ("driver_id", 1),  # Index on driver_id for driver's rides
    ("status", 1),  # Index on status for filtering by status
    ("created_at", -1),  # Index on created_at for sorting by date (descending)
    [("user_id", 1), ("status", 1)],  # Compound index for user's bookings by status
    [("driver_id", 1), ("status", 1)],  # Compound index for driver's rides by status
]
