from datetime import datetime, timedelta
from typing import Dict, Optional
from jose import JWTError, jwt
from app.config import settings


def create_access_token(user_id: str, email: Optional[str]) -> str:
    """
    Create JWT access token

    Args:
        user_id: User's MongoDB ObjectId as string
        email: User's email address

    Returns:
        Encoded JWT token string
    """
    expiry = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS)

    payload = {
        "sub": user_id,
        "email": email,
        "exp": expiry,
        "iat": datetime.utcnow(),
    }

    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token


def verify_token(token: str) -> Dict:
    """
    Verify and decode JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise JWTError(f"Invalid or expired token: {str(e)}")
