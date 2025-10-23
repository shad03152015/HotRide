"""
Livestream routes
"""
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List

from app.database import get_database
from app.middleware.auth import get_current_user
from app.schemas.livestream import (
    StartLivestreamRequest,
    LivestreamResponse,
    JoinLivestreamResponse,
    LiveCommentRequest,
    LiveCommentResponse,
    LivestreamListResponse,
)
from app.models.livestream import (
    get_livestream_document,
    get_live_comment_document,
    STATUS_ACTIVE,
    STATUS_ENDED,
)

router = APIRouter(prefix="/api/livestreams", tags=["livestreams"])


@router.post("/start", response_model=LivestreamResponse)
async def start_livestream(
    request: StartLivestreamRequest,
    current_user: dict = Depends(get_current_user)
):
    """Start a new livestream for a booking"""
    db = get_database()

    # Verify booking exists and belongs to user
    booking = await db.bookings.find_one({
        "_id": ObjectId(request.booking_id),
        "user_id": str(current_user["_id"])
    })

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Check if there's already an active livestream for this booking
    existing_livestream = await db.livestreams.find_one({
        "booking_id": request.booking_id,
        "is_active": True
    })

    if existing_livestream:
        raise HTTPException(status_code=400, detail="Livestream already active for this booking")

    # Create new livestream
    livestream_doc = get_livestream_document(
        user_id=str(current_user["_id"]),
        booking_id=request.booking_id,
        title=request.title or "Live Ride"
    )

    result = await db.livestreams.insert_one(livestream_doc)
    livestream_doc["_id"] = result.inserted_id

    return LivestreamResponse(
        id=str(livestream_doc["_id"]),
        user_id=livestream_doc["user_id"],
        booking_id=livestream_doc["booking_id"],
        title=livestream_doc["title"],
        viewer_count=livestream_doc["viewer_count"],
        is_active=livestream_doc["is_active"],
        started_at=livestream_doc["started_at"],
        ended_at=livestream_doc.get("ended_at")
    )


@router.post("/{livestream_id}/stop", response_model=LivestreamResponse)
async def stop_livestream(
    livestream_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Stop an active livestream"""
    db = get_database()

    # Verify livestream exists and belongs to user
    livestream = await db.livestreams.find_one({
        "_id": ObjectId(livestream_id),
        "user_id": str(current_user["_id"])
    })

    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")

    if not livestream["is_active"]:
        raise HTTPException(status_code=400, detail="Livestream is not active")

    # Update livestream to ended
    await db.livestreams.update_one(
        {"_id": ObjectId(livestream_id)},
        {
            "$set": {
                "is_active": False,
                "status": STATUS_ENDED,
                "ended_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Fetch updated livestream
    updated_livestream = await db.livestreams.find_one({"_id": ObjectId(livestream_id)})

    return LivestreamResponse(
        id=str(updated_livestream["_id"]),
        user_id=updated_livestream["user_id"],
        booking_id=updated_livestream["booking_id"],
        title=updated_livestream["title"],
        viewer_count=updated_livestream["viewer_count"],
        is_active=updated_livestream["is_active"],
        started_at=updated_livestream["started_at"],
        ended_at=updated_livestream.get("ended_at")
    )


@router.get("/active", response_model=LivestreamListResponse)
async def get_active_livestreams(
    limit: int = 20,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get list of active livestreams"""
    db = get_database()

    # Get active livestreams
    cursor = db.livestreams.find({"is_active": True}).sort("created_at", -1).skip(skip).limit(limit)
    livestreams = await cursor.to_list(length=limit)

    # Get total count
    total = await db.livestreams.count_documents({"is_active": True})

    livestream_responses = [
        LivestreamResponse(
            id=str(ls["_id"]),
            user_id=ls["user_id"],
            booking_id=ls["booking_id"],
            title=ls["title"],
            viewer_count=ls["viewer_count"],
            is_active=ls["is_active"],
            started_at=ls["started_at"],
            ended_at=ls.get("ended_at")
        )
        for ls in livestreams
    ]

    return LivestreamListResponse(
        livestreams=livestream_responses,
        total=total
    )


@router.get("/{livestream_id}/join", response_model=JoinLivestreamResponse)
async def join_livestream(
    livestream_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Join a livestream as a viewer"""
    db = get_database()

    # Verify livestream exists and is active
    livestream = await db.livestreams.find_one({
        "_id": ObjectId(livestream_id),
        "is_active": True
    })

    if not livestream:
        raise HTTPException(status_code=404, detail="Active livestream not found")

    # Increment viewer count
    await db.livestreams.update_one(
        {"_id": ObjectId(livestream_id)},
        {
            "$inc": {"viewer_count": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    # Fetch updated livestream
    updated_livestream = await db.livestreams.find_one({"_id": ObjectId(livestream_id)})

    livestream_response = LivestreamResponse(
        id=str(updated_livestream["_id"]),
        user_id=updated_livestream["user_id"],
        booking_id=updated_livestream["booking_id"],
        title=updated_livestream["title"],
        viewer_count=updated_livestream["viewer_count"],
        is_active=updated_livestream["is_active"],
        started_at=updated_livestream["started_at"],
        ended_at=updated_livestream.get("ended_at")
    )

    return JoinLivestreamResponse(
        livestream=livestream_response,
        stream_url=None,  # In production, this would be WebRTC URL
        chat_room_id=livestream_id
    )


@router.post("/{livestream_id}/leave")
async def leave_livestream(
    livestream_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Leave a livestream (decrement viewer count)"""
    db = get_database()

    # Verify livestream exists
    livestream = await db.livestreams.find_one({"_id": ObjectId(livestream_id)})

    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")

    # Decrement viewer count (minimum 0)
    if livestream["viewer_count"] > 0:
        await db.livestreams.update_one(
            {"_id": ObjectId(livestream_id)},
            {
                "$inc": {"viewer_count": -1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

    return {"message": "Left livestream successfully"}


@router.post("/comments", response_model=LiveCommentResponse)
async def send_live_comment(
    request: LiveCommentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a comment to a livestream"""
    db = get_database()

    # Verify livestream exists and is active
    livestream = await db.livestreams.find_one({
        "_id": ObjectId(request.livestream_id),
        "is_active": True
    })

    if not livestream:
        raise HTTPException(status_code=404, detail="Active livestream not found")

    # Create comment document
    comment_doc = get_live_comment_document(
        livestream_id=request.livestream_id,
        user_id=str(current_user["_id"]),
        username=current_user.get("full_name", "Anonymous"),
        message=request.message
    )

    result = await db.live_comments.insert_one(comment_doc)
    comment_doc["_id"] = result.inserted_id

    return LiveCommentResponse(
        id=str(comment_doc["_id"]),
        livestream_id=comment_doc["livestream_id"],
        user_id=comment_doc["user_id"],
        username=comment_doc["username"],
        message=comment_doc["message"],
        timestamp=comment_doc["timestamp"]
    )


@router.get("/{livestream_id}/comments", response_model=List[LiveCommentResponse])
async def get_live_comments(
    livestream_id: str,
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get comments for a livestream"""
    db = get_database()

    # Verify livestream exists
    livestream = await db.livestreams.find_one({"_id": ObjectId(livestream_id)})

    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")

    # Get comments
    cursor = db.live_comments.find(
        {"livestream_id": livestream_id}
    ).sort("created_at", -1).skip(skip).limit(limit)

    comments = await cursor.to_list(length=limit)

    # Reverse to show oldest first
    comments.reverse()

    return [
        LiveCommentResponse(
            id=str(comment["_id"]),
            livestream_id=comment["livestream_id"],
            user_id=comment["user_id"],
            username=comment["username"],
            message=comment["message"],
            timestamp=comment["timestamp"]
        )
        for comment in comments
    ]


@router.get("/{livestream_id}", response_model=LivestreamResponse)
async def get_livestream(
    livestream_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get livestream details"""
    db = get_database()

    livestream = await db.livestreams.find_one({"_id": ObjectId(livestream_id)})

    if not livestream:
        raise HTTPException(status_code=404, detail="Livestream not found")

    return LivestreamResponse(
        id=str(livestream["_id"]),
        user_id=livestream["user_id"],
        booking_id=livestream["booking_id"],
        title=livestream["title"],
        viewer_count=livestream["viewer_count"],
        is_active=livestream["is_active"],
        started_at=livestream["started_at"],
        ended_at=livestream.get("ended_at")
    )
