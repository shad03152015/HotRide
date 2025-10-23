from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import (
    LoginRequest,
    GoogleAuthRequest,
    AppleAuthRequest,
    AuthResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    create_user,
    find_user_by_email,
    find_user_by_oauth,
)
from app.services.oauth_service import verify_google_token, verify_apple_token
from app.utils.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


def user_to_response(user: dict) -> UserResponse:
    """Convert MongoDB user document to UserResponse schema"""
    return UserResponse(
        id=str(user["_id"]),
        email=user.get("email"),
        phone=user.get("phone"),
        full_name=user.get("full_name"),
        profile_picture_url=user.get("profile_picture_url"),
        oauth_provider=user.get("oauth_provider", "email"),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with email/phone and password

    Returns JWT token and user data on success
    """
    try:
        # Authenticate user
        user = await authenticate_user(request.identifier, request.password)

        # Generate JWT token
        access_token = create_access_token(
            user_id=str(user["_id"]), email=user.get("email")
        )

        # Return response
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_to_response(user),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate user with Google OAuth

    Verifies Google ID token and creates/logs in user
    """
    try:
        # Verify Google token
        google_data = await verify_google_token(request.id_token)

        email = google_data.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google",
            )

        # Check if user exists
        existing_user = await find_user_by_email(email)

        if existing_user:
            # User exists - check OAuth provider
            if existing_user.get("oauth_provider") != "google":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists. Please log in with email/password.",
                )

            # Log in existing Google user
            user = existing_user
        else:
            # Create new Google user
            user_data = {
                "email": email.lower(),
                "oauth_provider": "google",
                "oauth_id": google_data.get("sub"),
                "full_name": google_data.get("name"),
                "profile_picture_url": google_data.get("picture"),
                "is_email_verified": google_data.get("email_verified", False),
                "is_active": True,
                "is_phone_verified": False,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }

            user = await create_user(user_data)

        # Generate JWT token
        access_token = create_access_token(
            user_id=str(user["_id"]), email=user.get("email")
        )

        # Return response
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_to_response(user),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.post("/apple", response_model=AuthResponse)
async def apple_auth(request: AppleAuthRequest):
    """
    Authenticate user with Apple Sign In

    Verifies Apple identity token and creates/logs in user
    """
    try:
        # Verify Apple token
        apple_data = await verify_apple_token(request.identity_token, request.nonce)

        # Email might not be in token on subsequent sign-ins
        email = apple_data.get("email") or (
            request.user_data.get("email") if request.user_data else None
        )

        if not email:
            # Try to find existing user by Apple ID
            user = await find_user_by_oauth("apple", apple_data.get("sub"))
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not provided by Apple. Please try again.",
                )
        else:
            # Check if user exists by email
            existing_user = await find_user_by_email(email)

            if existing_user:
                # User exists - check OAuth provider
                if existing_user.get("oauth_provider") != "apple":
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="An account with this email already exists. Please log in with email/password.",
                    )

                user = existing_user
            else:
                # Create new Apple user
                user_data = {
                    "email": email.lower(),
                    "oauth_provider": "apple",
                    "oauth_id": apple_data.get("sub"),
                    "full_name": (
                        request.user_data.get("full_name") if request.user_data else None
                    ),
                    "is_email_verified": apple_data.get("email_verified", False),
                    "is_active": True,
                    "is_phone_verified": False,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }

                user = await create_user(user_data)

        # Generate JWT token
        access_token = create_access_token(
            user_id=str(user["_id"]), email=user.get("email")
        )

        # Return response
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_to_response(user),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )
