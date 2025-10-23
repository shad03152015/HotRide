import secrets
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from app.config import settings
from app.database import get_database


async def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


async def send_email_verification(email: str, verification_code: str) -> bool:
    """
    Send email verification code

    Args:
        email: Recipient email address
        verification_code: 6-digit verification code

    Returns:
        True if email sent successfully, False otherwise
    """
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Verify Your HotRide Email"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = email

        # HTML email body
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #FF5733;">🏍️ HotRide</h1>
              </div>

              <h2 style="color: #333;">Verify Your Email</h2>

              <p style="color: #666; font-size: 16px;">
                Thank you for signing up with HotRide! Please use the verification code below to complete your registration:
              </p>

              <div style="background-color: #F5F5F5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                <h1 style="color: #FF5733; font-size: 36px; letter-spacing: 8px; margin: 0;">
                  {verification_code}
                </h1>
              </div>

              <p style="color: #666; font-size: 14px;">
                This code will expire in 10 minutes.
              </p>

              <p style="color: #666; font-size: 14px;">
                If you didn't request this verification, please ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                © 2025 HotRide. All rights reserved.
              </p>
            </div>
          </body>
        </html>
        """

        message.attach(MIMEText(html_body, "html"))

        # Send email
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )

        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


async def store_verification_code(email: str, code: str, code_type: str = "email") -> None:
    """
    Store verification code in database

    Args:
        email: User email
        code: Verification code
        code_type: Type of verification (email or phone)
    """
    db = get_database()

    expiry = datetime.utcnow() + timedelta(minutes=10)

    await db.verification_codes.update_one(
        {"email": email.lower(), "type": code_type},
        {
            "$set": {
                "code": code,
                "expires_at": expiry,
                "created_at": datetime.utcnow(),
                "verified": False,
            }
        },
        upsert=True
    )


async def verify_code(email: str, code: str, code_type: str = "email") -> bool:
    """
    Verify the provided code

    Args:
        email: User email
        code: Code to verify
        code_type: Type of verification (email or phone)

    Returns:
        True if code is valid, False otherwise
    """
    db = get_database()

    verification = await db.verification_codes.find_one({
        "email": email.lower(),
        "type": code_type,
        "code": code,
        "verified": False
    })

    if not verification:
        return False

    # Check if code expired
    if verification["expires_at"] < datetime.utcnow():
        return False

    # Mark as verified
    await db.verification_codes.update_one(
        {"_id": verification["_id"]},
        {"$set": {"verified": True}}
    )

    return True
