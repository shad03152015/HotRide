"""
Rating routes
"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.rating import (
    SubmitRatingRequest,
    RatingResponse,
    DriverRatingStatsResponse,
)
from app.models.rating import get_rating_document

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("/submit", response_model=RatingResponse)
async def submit_rating(
    request: SubmitRatingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit a rating for a completed ride"""
    db = get_database()

    # Verify booking exists and belongs to user
    booking = await db.bookings.find_one({
        "_id": ObjectId(request.booking_id),
        "user_id": str(current_user["_id"])
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check if booking is completed
    if booking["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed rides")

    # Check if rating already exists
    existing_rating = await db.ratings.find_one({
        "booking_id": request.booking_id
    })

    if existing_rating:
        raise HTTPException(status_code=400, detail="Rating already submitted for this ride")

    # Get driver_id from booking (in production, this would be actual driver ID)
    driver_id = booking.get("driver_id", "mock_driver_1")

    # Create rating document
    rating_doc = get_rating_document(
        booking_id=request.booking_id,
        user_id=str(current_user["_id"]),
        driver_id=driver_id,
        rating=request.rating,
        comment=request.comment or ""
    )

    result = await db.ratings.insert_one(rating_doc)
    rating_doc["_id"] = result.inserted_id

    # Update driver's average rating (in production, this would update driver document)
    # For now, we'll just store the rating

    return RatingResponse(
        id=str(rating_doc["_id"]),
        booking_id=rating_doc["booking_id"],
        user_id=rating_doc["user_id"],
        driver_id=rating_doc["driver_id"],
        rating=rating_doc["rating"],
        comment=rating_doc["comment"],
        created_at=rating_doc["created_at"]
    )


@router.get("/driver/{driver_id}/stats", response_model=DriverRatingStatsResponse)
async def get_driver_rating_stats(
    driver_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get rating statistics for a driver"""
    db = get_database()

    # Get all ratings for the driver
    cursor = db.ratings.find({"driver_id": driver_id})
    ratings = await cursor.to_list(length=None)

    if not ratings:
        return DriverRatingStatsResponse(
            driver_id=driver_id,
            average_rating=0.0,
            total_ratings=0,
            rating_breakdown={"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        )

    # Calculate statistics
    total_ratings = len(ratings)
    sum_ratings = sum(r["rating"] for r in ratings)
    average_rating = round(sum_ratings / total_ratings, 1)

    # Count ratings by star
    rating_breakdown = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for rating in ratings:
        rating_breakdown[str(rating["rating"])] += 1

    return DriverRatingStatsResponse(
        driver_id=driver_id,
        average_rating=average_rating,
        total_ratings=total_ratings,
        rating_breakdown=rating_breakdown
    )


@router.get("/booking/{booking_id}", response_model=RatingResponse)
async def get_booking_rating(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get rating for a specific booking"""
    db = get_database()

    # Verify booking belongs to user
    booking = await db.bookings.find_one({
        "_id": ObjectId(booking_id),
        "user_id": str(current_user["_id"])
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Get rating
    rating = await db.ratings.find_one({"booking_id": booking_id})

    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    return RatingResponse(
        id=str(rating["_id"]),
        booking_id=rating["booking_id"],
        user_id=rating["user_id"],
        driver_id=rating["driver_id"],
        rating=rating["rating"],
        comment=rating["comment"],
        created_at=rating["created_at"]
    )


@router.get("/my-ratings", response_model=List[RatingResponse])
async def get_my_ratings(
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get all ratings submitted by current user"""
    db = get_database()

    cursor = db.ratings.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).skip(skip).limit(limit)

    ratings = await cursor.to_list(length=limit)

    return [
        RatingResponse(
            id=str(rating["_id"]),
            booking_id=rating["booking_id"],
            user_id=rating["user_id"],
            driver_id=rating["driver_id"],
            rating=rating["rating"],
            comment=rating["comment"],
            created_at=rating["created_at"]
        )
        for rating in ratings
    ]
