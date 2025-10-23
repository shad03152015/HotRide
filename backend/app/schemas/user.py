from typing import Optional, Literal
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """User response schema for API responses"""

    id: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    oauth_provider: Literal["email", "google", "apple"]

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "phone": "+1234567890",
                "full_name": "John Doe",
                "profile_picture_url": "https://example.com/photo.jpg",
                "oauth_provider": "email",
            }
        }
