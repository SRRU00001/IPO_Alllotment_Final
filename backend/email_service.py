import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

# Gmail SMTP configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "tesseract.uk.in@gmail.com"
SENDER_APP_PASSWORD = "jhfb wdil xrcm fgku"

# OTP storage (in production, use Redis or database)
otp_storage: dict[str, dict] = {}

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))

def generate_temp_password(length: int = 10) -> str:
    """Generate a random temporary password"""
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(random.choices(chars, k=length))

def store_otp(email: str, otp: str, purpose: str = "verification", expires_minutes: int = 10) -> None:
    """Store OTP with expiration time"""
    otp_storage[email] = {
        "otp": otp,
        "purpose": purpose,
        "expires_at": datetime.utcnow() + timedelta(minutes=expires_minutes),
        "created_at": datetime.utcnow()
    }

def verify_otp(email: str, otp: str, purpose: str = "verification") -> bool:
    """Verify OTP for email"""
    if email not in otp_storage:
        return False

    stored = otp_storage[email]

    # Check purpose
    if stored["purpose"] != purpose:
        return False

    # Check expiration
    if datetime.utcnow() > stored["expires_at"]:
        del otp_storage[email]
        return False

    # Check OTP match
    if stored["otp"] != otp:
        return False

    # OTP verified, remove it
    del otp_storage[email]
    return True

def send_email(to_email: str, subject: str, html_body: str) -> tuple[bool, str]:
    """Send email using Gmail SMTP"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"IPO Allotment <{SENDER_EMAIL}>"
        msg["To"] = to_email

        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())

        return True, "Email sent successfully"
    except smtplib.SMTPAuthenticationError:
        return False, "Email authentication failed"
    except smtplib.SMTPException as e:
        return False, f"SMTP error: {str(e)}"
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"

def send_verification_otp(email: str, username: str) -> tuple[bool, str]:
    """Send verification OTP for registration"""
    otp = generate_otp()
    store_otp(email, otp, purpose="registration")

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb;">IPO Allotment - Email Verification</h2>
            <p>Hello <strong>{username}</strong>,</p>
            <p>Your OTP for email verification is:</p>
            <div style="background: #2563eb; color: white; padding: 15px 30px; font-size: 28px; font-weight: bold; text-align: center; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
                {otp}
            </div>
            <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">IPO Allotment Manager</p>
        </div>
    </body>
    </html>
    """

    success, message = send_email(email, "IPO Allotment - Verify Your Email", html_body)
    return success, message if not success else otp

def send_password_recovery_otp(email: str) -> tuple[bool, str]:
    """Send OTP for password recovery"""
    otp = generate_otp()
    store_otp(email, otp, purpose="recovery")

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #dc2626;">IPO Allotment - Password Recovery</h2>
            <p>You requested to reset your password.</p>
            <p>Your OTP for password recovery is:</p>
            <div style="background: #dc2626; color: white; padding: 15px 30px; font-size: 28px; font-weight: bold; text-align: center; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
                {otp}
            </div>
            <p style="color: #666;">This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">IPO Allotment Manager</p>
        </div>
    </body>
    </html>
    """

    return send_email(email, "IPO Allotment - Password Recovery OTP", html_body)

def send_new_password(email: str, username: str, new_password: str) -> tuple[bool, str]:
    """Send new password after recovery verification"""
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #16a34a;">IPO Allotment - Password Reset Successful</h2>
            <p>Hello <strong>{username}</strong>,</p>
            <p>Your password has been reset successfully.</p>
            <p>Your new password is:</p>
            <div style="background: #1f2937; color: #10b981; padding: 15px 30px; font-size: 20px; font-weight: bold; text-align: center; border-radius: 8px; font-family: monospace; margin: 20px 0;">
                {new_password}
            </div>
            <p style="color: #dc2626;"><strong>Important:</strong> Please change this password after logging in.</p>
            <p style="color: #666;">If you didn't request this, please contact support immediately.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">IPO Allotment Manager</p>
        </div>
    </body>
    </html>
    """

    return send_email(email, "IPO Allotment - Your New Password", html_body)
