from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Email/Phone + Password login request"""

    identifier: str
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "user@example.com",
                "password": "password123",
            }
        }


class GoogleAuthRequest(BaseModel):
    """Google OAuth authentication request"""

    id_token: str

    class Config:
        json_schema_extra = {
            "example": {
                "id_token": "google_id_token_string",
            }
        }


class AppleAuthRequest(BaseModel):
    """Apple Sign In authentication request"""

    identity_token: str
    nonce: str
    user_data: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "identity_token": "apple_identity_token_string",
                "nonce": "nonce_string",
                "user_data": {"email": "user@example.com", "full_name": "John Doe"},
            }
        }


class AuthResponse(BaseModel):
    """Authentication response with JWT token and user data"""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "507f1f77bcf86cd799439011",
                    "email": "user@example.com",
                    "full_name": "John Doe",
                    "oauth_provider": "email",
                },
            }
        }
