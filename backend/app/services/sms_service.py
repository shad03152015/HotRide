from twilio.rest import Client
from app.config import settings
from app.services.email_service import generate_verification_code, store_verification_code


async def send_sms_verification(phone: str) -> tuple[bool, str]:
    """
    Send SMS verification code via Twilio

    Args:
        phone: Phone number in E.164 format (e.g., +1234567890)

    Returns:
        Tuple of (success: bool, code: str)
    """
    try:
        # Generate verification code
        code = await generate_verification_code()

        # Initialize Twilio client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # Send SMS
        message = client.messages.create(
            body=f"Your HotRide verification code is: {code}\n\nThis code expires in 10 minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone
        )

        # Store verification code in database
        # Using phone as identifier for phone verification
        await store_verification_code(phone, code, code_type="phone")

        return True, code
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False, ""


async def verify_phone_code(phone: str, code: str) -> bool:
    """
    Verify phone verification code

    Args:
        phone: Phone number
        code: Verification code

    Returns:
        True if valid, False otherwise
    """
    from app.services.email_service import verify_code
    return await verify_code(phone, code, code_type="phone")
