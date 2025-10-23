from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import (
    LoginRequest,
    GoogleAuthRequest,
    AppleAuthRequest,
    AuthResponse,
    RegisterRequest,
    VerifyEmailRequest,
    SendPhoneCodeRequest,
    VerifyPhoneRequest,
    ProfileSetupRequest,
    MessageResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    create_user,
    find_user_by_email,
    find_user_by_oauth,
    update_user,
)
from app.services.oauth_service import verify_google_token, verify_apple_token
from app.services.email_service import (
    generate_verification_code,
    send_email_verification,
    store_verification_code,
    verify_code,
)
from app.services.sms_service import send_sms_verification, verify_phone_code
from app.utils.jwt import create_access_token, verify_token
from app.utils.password import hash_password
from app.database import get_database
from app.middleware.auth import get_current_user

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


# Stage 2: Registration and Verification Routes

@router.post("/register", response_model=MessageResponse)
async def register(request: RegisterRequest):
    """
    Register new user with email and password
    
    Sends verification code to email
    """
    try:
        # Check if user already exists
        existing_user = await find_user_by_email(request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        user_data = {
            "email": request.email.lower(),
            "full_name": request.full_name,
            "password_hash": password_hash,
            "oauth_provider": "email",
            "is_active": True,
            "is_email_verified": False,
            "is_phone_verified": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        user = await create_user(user_data)
        
        # Generate and send email verification code
        verification_code = await generate_verification_code()
        await store_verification_code(request.email, verification_code, "email")
        await send_email_verification(request.email, verification_code)
        
        return MessageResponse(message="Registration successful. Please check your email for verification code.")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.post("/verify-email", response_model=AuthResponse)
async def verify_email(request: VerifyEmailRequest):
    """
    Verify email with code and return auth token
    """
    try:
        # Verify the code
        is_valid = await verify_code(request.email, request.code, "email")
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code",
            )
        
        # Find user and mark email as verified
        db = get_database()
        user = await db.users.find_one({"email": request.email.lower()})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Update user email verified status
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"is_email_verified": True, "updated_at": datetime.utcnow()}}
        )
        
        # Get updated user
        user = await db.users.find_one({"_id": user["_id"]})
        
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


@router.post("/resend-email-code", response_model=MessageResponse)
async def resend_email_code(request: VerifyEmailRequest):
    """
    Resend email verification code
    """
    try:
        # Check if user exists
        user = await find_user_by_email(request.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Generate and send new code
        verification_code = await generate_verification_code()
        await store_verification_code(request.email, verification_code, "email")
        await send_email_verification(request.email, verification_code)
        
        return MessageResponse(message="Verification code sent to your email")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.post("/send-phone-code", response_model=MessageResponse)
async def send_phone_code(request: SendPhoneCodeRequest):
    """
    Send SMS verification code to phone number
    """
    try:
        success, code = await send_sms_verification(request.phone)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send SMS. Please try again.",
            )
        
        return MessageResponse(message="Verification code sent to your phone")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.post("/verify-phone", response_model=MessageResponse)
async def verify_phone(request: VerifyPhoneRequest):
    """
    Verify phone number with code
    """
    try:
        # Verify the code
        is_valid = await verify_phone_code(request.phone, request.code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code",
            )
        
        return MessageResponse(message="Phone verified successfully")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.post("/profile-setup", response_model=UserResponse)
async def profile_setup(request: ProfileSetupRequest, token: str = Depends(lambda: None)):
    """
    Update user profile information
    
    Requires authentication
    """
    try:
        # This would normally require auth middleware
        # For now, accepting updates based on email/phone in request
        db = get_database()
        
        # Find user by phone or update current user
        # In production, get user ID from JWT token
        update_data = {"updated_at": datetime.utcnow()}
        
        if request.full_name:
            update_data["full_name"] = request.full_name
        if request.phone:
            update_data["phone"] = request.phone
            update_data["is_phone_verified"] = True
        if request.profile_picture_url:
            update_data["profile_picture_url"] = request.profile_picture_url
        
        # For now, update by phone if provided
        if request.phone:
            user = await db.users.find_one_and_update(
                {"phone": request.phone},
                {"$set": update_data},
                return_document=True
            )
            
            if user:
                return user_to_response(user)
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )


@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    request: ProfileSetupRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update authenticated user's profile
    
    Only allows updating full_name and profile_picture_url
    Email and phone cannot be changed through this endpoint
    
    Requires: Authorization header with Bearer token
    """
    try:
        db = get_database()
        
        # Prepare update data - only allow full_name and profile_picture_url
        update_data = {"updated_at": datetime.utcnow()}
        
        if request.full_name is not None:
            update_data["full_name"] = request.full_name
        
        if request.profile_picture_url is not None:
            update_data["profile_picture_url"] = request.profile_picture_url
        
        # Update user in database
        user = await db.users.find_one_and_update(
            {"_id": current_user["_id"]},
            {"$set": update_data},
            return_document=True
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        return user_to_response(user)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong. Please try again.",
        )
