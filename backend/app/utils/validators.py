import re
from typing import Tuple


def is_email(identifier: str) -> bool:
    """
    Quick check if identifier looks like email

    Args:
        identifier: String to check

    Returns:
        True if identifier contains @ and looks like email
    """
    return "@" in identifier


def is_phone(identifier: str) -> bool:
    """
    Quick check if identifier looks like phone number

    Args:
        identifier: String to check

    Returns:
        True if identifier looks like phone number
    """
    # Remove common phone number characters
    cleaned = identifier.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
    return cleaned.isdigit() and len(cleaned) >= 10


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email format

    Args:
        email: Email address to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

    if not re.match(email_regex, email):
        return False, "Please enter a valid email address"

    return True, ""


def validate_phone(phone: str) -> Tuple[bool, str]:
    """
    Validate phone number format

    Args:
        phone: Phone number to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Remove common phone number characters
    cleaned = phone.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")

    if not cleaned.isdigit():
        return False, "Please enter a valid phone number"

    if len(cleaned) < 10:
        return False, "Phone number must be at least 10 digits"

    return True, ""


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password meets minimum requirements

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    return True, ""
