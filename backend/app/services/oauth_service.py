from typing import Dict
from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token
import jwt
import requests as http_requests
from app.config import settings


async def verify_google_token(id_token_string: str) -> Dict:
    """
    Verify Google ID token and extract user information

    Args:
        id_token_string: Google ID token from client

    Returns:
        Dictionary with user info (email, name, picture, sub)

    Raises:
        HTTPException: If token verification fails
    """
    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            id_token_string, requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        # Verify issuer
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise ValueError("Invalid token issuer")

        # Extract user information
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "sub": idinfo.get("sub"),  # Google user ID
            "email_verified": idinfo.get("email_verified", False),
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sign in with Google failed. Please try again.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign in is temporarily unavailable.",
        )


async def verify_apple_token(identity_token: str, nonce: str) -> Dict:
    """
    Verify Apple identity token and extract user information

    Args:
        identity_token: Apple identity token from client
        nonce: Nonce used in the sign-in request

    Returns:
        Dictionary with user info (email, sub)

    Raises:
        HTTPException: If token verification fails
    """
    try:
        # Fetch Apple's public keys
        apple_keys_url = "https://appleid.apple.com/auth/keys"
        response = http_requests.get(apple_keys_url, timeout=5)
        apple_keys = response.json()

        # Decode token header to get key ID
        header = jwt.get_unverified_header(identity_token)
        key_id = header.get("kid")

        # Find matching public key
        public_key = None
        for key in apple_keys.get("keys", []):
            if key.get("kid") == key_id:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not public_key:
            raise ValueError("Public key not found")

        # Verify and decode token
        decoded = jwt.decode(
            identity_token,
            public_key,
            algorithms=["RS256"],
            audience=settings.APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com",
        )

        # Verify nonce if present in token
        token_nonce = decoded.get("nonce")
        if token_nonce and token_nonce != nonce:
            raise ValueError("Nonce mismatch")

        # Extract user information
        return {
            "email": decoded.get("email"),
            "sub": decoded.get("sub"),  # Apple user ID
            "email_verified": decoded.get("email_verified", False),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization code expired",
        )
    except (ValueError, jwt.PyJWTError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sign in with Apple failed. Please try again.",
        )
    except http_requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Apple sign in is temporarily unavailable.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Apple sign in is temporarily unavailable.",
        )
