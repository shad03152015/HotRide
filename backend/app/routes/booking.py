"""
Booking routes
"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.schemas.booking import (
    CreateBookingRequest,
    BookingResponse,
    BookingListResponse,
    UpdateBookingStatusRequest,
    LocationSchema,
)
from app.models.booking import Booking
from app.middleware.auth import get_current_user
from app.database import get_database

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def booking_to_response(booking: dict) -> BookingResponse:
    """Convert MongoDB booking document to BookingResponse schema"""
    return BookingResponse(
        id=str(booking["_id"]),
        user_id=str(booking["user_id"]),
        driver_id=str(booking["driver_id"]) if booking.get("driver_id") else None,
        pickup_location=LocationSchema(**booking["pickup_location"]),
        destination=LocationSchema(**booking["destination"]),
        distance=booking["distance"],
        estimated_time=booking["estimated_time"],
        base_fare=booking["base_fare"],
        gratuity=booking["gratuity"],
        total_fare=booking["total_fare"],
        notes=booking.get("notes", ""),
        status=booking["status"],
        created_at=booking["created_at"],
        updated_at=booking["updated_at"],
    )


@router.post("/create", response_model=BookingResponse)
async def create_booking(
    request: CreateBookingRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new ride booking

    Requires authentication
    """
    try:
        db = get_database()

        # Create booking document
        booking_doc = Booking.create_booking_document(
            user_id=str(current_user["_id"]),
            pickup_location={
                "address": request.pickup_location.address,
                "latitude": request.pickup_location.latitude,
                "longitude": request.pickup_location.longitude,
            },
            destination={
                "address": request.destination.address,
                "latitude": request.destination.latitude,
                "longitude": request.destination.longitude,
            },
            distance=request.distance,
            estimated_time=request.estimated_time,
            base_fare=request.base_fare,
            gratuity=request.gratuity,
            total_fare=request.total_fare,
            notes=request.notes or "",
        )

        # Insert into database
        result = await db.bookings.insert_one(booking_doc)

        # Fetch the created booking
        booking = await db.bookings.find_one({"_id": result.inserted_id})

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create booking",
            )

        # TODO: Notify nearby drivers about new booking
        # This would involve:
        # 1. Finding drivers within radius
        # 2. Sending push notifications
        # 3. WebSocket/real-time updates

        return booking_to_response(booking)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.get("/my-bookings", response_model=BookingListResponse)
async def get_my_bookings(
    current_user: dict = Depends(get_current_user),
    limit: int = 20,
    skip: int = 0,
):
    """
    Get current user's booking history

    Requires authentication
    """
    try:
        db = get_database()

        # Query bookings for current user, sorted by creation date (newest first)
        bookings_cursor = (
            db.bookings.find({"user_id": str(current_user["_id"])})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        bookings = await bookings_cursor.to_list(length=limit)

        # Get total count
        total = await db.bookings.count_documents({"user_id": str(current_user["_id"])})

        return BookingListResponse(
            bookings=[booking_to_response(b) for b in bookings],
            total=total,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching bookings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get specific booking details

    Requires authentication
    Only booking owner can access
    """
    try:
        db = get_database()

        # Validate ObjectId
        if not ObjectId.is_valid(booking_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking ID",
            )

        # Find booking
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # Verify ownership
        if str(booking["user_id"]) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return booking_to_response(booking)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    request: UpdateBookingStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update booking status

    Requires authentication
    """
    try:
        db = get_database()

        # Validate ObjectId
        if not ObjectId.is_valid(booking_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking ID",
            )

        # Find booking
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # Prepare update data
        update_data = {
            "status": request.status,
            "updated_at": datetime.utcnow(),
        }

        # If status is completed, add completion timestamp
        if request.status == Booking.STATUS_COMPLETED:
            update_data["completed_at"] = datetime.utcnow()

        # If driver is accepting booking, update driver_id
        if request.driver_id and request.status == Booking.STATUS_ACCEPTED:
            update_data["driver_id"] = request.driver_id

        # Update booking
        updated_booking = await db.bookings.find_one_and_update(
            {"_id": ObjectId(booking_id)},
            {"$set": update_data},
            return_document=True,
        )

        if not updated_booking:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update booking",
            )

        # TODO: Send notification to user/driver about status change

        return booking_to_response(updated_booking)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating booking status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Cancel a booking

    Requires authentication
    Only booking owner can cancel
    """
    try:
        db = get_database()

        # Validate ObjectId
        if not ObjectId.is_valid(booking_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid booking ID",
            )

        # Find booking
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # Verify ownership
        if str(booking["user_id"]) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        # Can't cancel completed bookings
        if booking["status"] == Booking.STATUS_COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel completed booking",
            )

        # Update status to cancelled
        await db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {
                "$set": {
                    "status": Booking.STATUS_CANCELLED,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        # TODO: Notify driver if booking was accepted

        return {"message": "Booking cancelled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )
