from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


class UserModel(BaseModel):
    """User model for MongoDB storage"""

    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password_hash: Optional[str] = None
    oauth_provider: Literal["email", "google", "apple"] = "email"
    oauth_id: Optional[str] = None
    profile_picture_url: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool = True
    is_email_verified: bool = False
    is_phone_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "phone": "+1234567890",
                "password_hash": "$2b$12$...",
                "oauth_provider": "email",
                "full_name": "John Doe",
                "is_active": True,
            }
        }
