from typing import Optional, Dict
from fastapi import HTTPException, status
from app.database import get_database
from app.utils.password import verify_password
from app.utils.validators import is_email, is_phone


async def authenticate_user(identifier: str, password: str) -> Dict:
    """
    Authenticate user with email/phone and password

    Args:
        identifier: Email or phone number
        password: Plain text password

    Returns:
        User document from database

    Raises:
        HTTPException: If authentication fails
    """
    db = get_database()

    # Determine if identifier is email or phone
    query = {}
    if is_email(identifier):
        query = {"email": identifier.lower()}
    elif is_phone(identifier):
        query = {"phone": identifier}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address or phone number",
        )

    # Find user in database
    user = await db.users.find_one(query)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email/phone",
        )

    # Check if account is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Contact support.",
        )

    # Verify password
    password_hash = user.get("password_hash")
    if not password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password",
        )

    if not verify_password(password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password",
        )

    return user


async def create_user(user_data: Dict) -> Dict:
    """
    Create new user in database

    Args:
        user_data: User data dictionary

    Returns:
        Created user document with _id

    Raises:
        HTTPException: If user creation fails
    """
    db = get_database()

    try:
        result = await db.users.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return user_data
    except Exception as e:
        # Handle duplicate key errors (unique email/phone/oauth_id)
        if "duplicate key error" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email or phone already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account",
        )


async def find_user_by_email(email: str) -> Optional[Dict]:
    """
    Find user by email address

    Args:
        email: Email address to search

    Returns:
        User document or None if not found
    """
    db = get_database()
    return await db.users.find_one({"email": email.lower()})


async def find_user_by_oauth(provider: str, oauth_id: str) -> Optional[Dict]:
    """
    Find user by OAuth provider and ID

    Args:
        provider: OAuth provider (google, apple)
        oauth_id: Provider's user ID

    Returns:
        User document or None if not found
    """
    db = get_database()
    return await db.users.find_one({"oauth_provider": provider, "oauth_id": oauth_id})


async def update_user(user_id: str, update_data: Dict) -> Optional[Dict]:
    """
    Update user information

    Args:
        user_id: User's MongoDB ObjectId as string
        update_data: Dictionary of fields to update

    Returns:
        Updated user document or None if not found
    """
    from bson import ObjectId
    db = get_database()
    
    try:
        result = await db.users.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user",
        )
