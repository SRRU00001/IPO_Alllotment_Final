from fastapi import FastAPI, Query, Body, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import time

from database import engine, get_db, Base
from models import User, IpoName, Applicant, IpoApplication
from auth import (
    get_password_hash, authenticate_user, generate_token,
    get_current_user, get_optional_user
)
from email_service import (
    send_verification_otp, send_password_recovery_otp,
    send_new_password, verify_otp, generate_temp_password, store_otp
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IPO Allotment API",
    description="Backend API for IPO Allotment tracking",
    version="2.0.0"
)

# CORS middleware - allow frontend to connect
import os
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000,http://localhost:9000,https://ipo-allotment-frontend-02gb.onrender.com").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS + ["*"],  # Allow all origins for flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    username: Optional[str] = None
    error: Optional[str] = None

# Registration models
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class SendOtpRequest(BaseModel):
    email: str
    username: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str

class GenericResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None

# Temporary storage for pending registrations (in production use Redis)
pending_registrations: dict[str, dict] = {}

# Initialize default admin user on startup
@app.on_event("startup")
def create_default_user():
    db = next(get_db())
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            user = User(
                username="admin",
                hashed_password=get_password_hash("admin123")
            )
            db.add(user)
            db.commit()
            print("Default admin user created (username: admin, password: admin123)")
    finally:
        db.close()

# Auth routes
@app.post("/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and get authentication token"""
    user = authenticate_user(db, request.username, request.password)
    if not user:
        return LoginResponse(success=False, error="Invalid username or password")

    token = generate_token()
    user.token = token
    db.commit()

    return LoginResponse(success=True, token=token, username=user.username)

@app.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout and invalidate token"""
    current_user.token = None
    db.commit()
    return {"success": True}

@app.get("/auth/verify")
def verify_token(current_user: User = Depends(get_current_user)):
    """Verify if token is valid"""
    return {"success": True, "username": current_user.username}

# Registration endpoints
@app.post("/auth/register/send-otp", response_model=GenericResponse)
def register_send_otp(request: SendOtpRequest, db: Session = Depends(get_db)):
    """Send OTP for email verification during registration"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        return GenericResponse(success=False, error="Username already exists")

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        return GenericResponse(success=False, error="Email already registered")

    # Send verification OTP
    success, result = send_verification_otp(request.email, request.username)
    if success:
        return GenericResponse(success=True, message="OTP sent to your email")
    else:
        return GenericResponse(success=False, error=result)

@app.post("/auth/register/verify-otp", response_model=GenericResponse)
def register_verify_otp(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verify OTP and complete registration"""
    # Verify OTP
    if not verify_otp(request.email, request.otp, purpose="registration"):
        return GenericResponse(success=False, error="Invalid or expired OTP")

    # Check again if username/email exists (race condition prevention)
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        return GenericResponse(success=False, error="Username already exists")

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        return GenericResponse(success=False, error="Email already registered")

    # Create user
    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        is_verified=True
    )
    db.add(new_user)
    db.commit()

    return GenericResponse(success=True, message="Registration successful! You can now login.")

# Password recovery endpoints
@app.post("/auth/forgot-password/send-otp", response_model=GenericResponse)
def forgot_password_send_otp(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send OTP for password recovery"""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if email exists or not for security
        return GenericResponse(success=True, message="If the email exists, an OTP has been sent")

    # Send recovery OTP
    success, result = send_password_recovery_otp(request.email)
    if success:
        return GenericResponse(success=True, message="OTP sent to your email")
    else:
        return GenericResponse(success=False, error=result)

@app.post("/auth/forgot-password/verify-otp", response_model=GenericResponse)
def forgot_password_verify_otp(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify OTP and send new password"""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        return GenericResponse(success=False, error="Email not found")

    # Verify OTP
    if not verify_otp(request.email, request.otp, purpose="recovery"):
        return GenericResponse(success=False, error="Invalid or expired OTP")

    # Generate new password
    new_password = generate_temp_password()

    # Update user password
    user.hashed_password = get_password_hash(new_password)
    db.commit()

    # Send new password via email
    success, result = send_new_password(request.email, user.username, new_password)
    if success:
        return GenericResponse(success=True, message="New password has been sent to your email")
    else:
        return GenericResponse(success=False, error="Password reset successful but failed to send email. Contact support.")

# Helper functions
def applicant_to_dict(applicant: Applicant) -> dict:
    """Convert Applicant model to dict"""
    return {
        "id": applicant.id,
        "name": applicant.name,
        "phone": applicant.phone or "",
        "pan": applicant.pan or "",
        "createdAt": applicant.created_at.isoformat() if applicant.created_at else datetime.utcnow().isoformat()
    }

def ipo_to_dict(ipo: IpoName) -> dict:
    """Convert IpoName model to dict"""
    return {
        "name": ipo.name,
        "amount": ipo.amount
    }

def application_to_dict(app: IpoApplication, applicant: Applicant, ipo: IpoName) -> dict:
    """Convert IpoApplication model to dict with joined data"""
    return {
        "id": app.id,
        "ipoName": app.ipo_name,
        "userId": app.user_id,
        "userName": applicant.name if applicant else "Unknown",
        "userPan": applicant.pan or "" if applicant else "",
        "userPhone": applicant.phone or "" if applicant else "",
        "ipoAmount": ipo.amount if ipo else 0,
        "moneySent": app.money_sent,
        "moneyReceived": app.money_received,
        "allotmentStatus": app.allotment_status,
        "createdAt": app.created_at.isoformat() if app.created_at else datetime.utcnow().isoformat()
    }

# GET endpoints
@app.get("/api")
def handle_get(
    action: str = Query(...),
    ipoName: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Handle GET requests with action parameter"""

    # List all applications with joined user/IPO data
    if action == "list":
        applications = db.query(IpoApplication).order_by(IpoApplication.created_at.desc()).all()
        result = []
        for app in applications:
            applicant = db.query(Applicant).filter(Applicant.id == app.user_id).first()
            ipo = db.query(IpoName).filter(IpoName.name == app.ipo_name).first()
            result.append(application_to_dict(app, applicant, ipo))
        return result

    # List all IPOs with amounts
    elif action == "listIpos":
        ipos = db.query(IpoName).order_by(IpoName.name).all()
        return [ipo_to_dict(ipo) for ipo in ipos]

    # List all applicants/users
    elif action == "listUsers":
        applicants = db.query(Applicant).order_by(Applicant.name).all()
        return [applicant_to_dict(a) for a in applicants]

    # Get users already applied to a specific IPO
    elif action == "getAppliedUsers":
        if not ipoName:
            raise HTTPException(status_code=400, detail="ipoName is required")
        applications = db.query(IpoApplication).filter(IpoApplication.ipo_name == ipoName).all()
        return [app.user_id for app in applications]

    raise HTTPException(status_code=400, detail="Invalid action")

# POST endpoints
@app.post("/api")
def handle_post(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Handle POST requests with action in body"""
    action = payload.get("action")

    # Add new applicant/user
    if action == "addUser":
        data = payload.get("data", {})
        user_id = f"user-{int(time.time() * 1000)}"

        name = data.get("name", "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")

        new_applicant = Applicant(
            id=user_id,
            name=name,
            phone=data.get("phone", "").strip(),
            pan=data.get("pan", "").strip().upper(),
            created_at=datetime.utcnow()
        )
        db.add(new_applicant)
        db.commit()
        db.refresh(new_applicant)
        return applicant_to_dict(new_applicant)

    # Update applicant/user (phone and pan only)
    elif action == "updateUser":
        user_id = payload.get("id")
        data = payload.get("data", {})

        applicant = db.query(Applicant).filter(Applicant.id == user_id).first()
        if not applicant:
            raise HTTPException(status_code=404, detail="User not found")

        if "phone" in data:
            applicant.phone = data["phone"].strip()
        if "pan" in data:
            applicant.pan = data["pan"].strip().upper()

        db.commit()
        db.refresh(applicant)
        return applicant_to_dict(applicant)

    # Delete applicant/user
    elif action == "deleteUser":
        user_id = payload.get("id")

        applicant = db.query(Applicant).filter(Applicant.id == user_id).first()
        if not applicant:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if user has applications
        apps = db.query(IpoApplication).filter(IpoApplication.user_id == user_id).count()
        if apps > 0:
            raise HTTPException(status_code=400, detail="Cannot delete user with existing applications")

        db.delete(applicant)
        db.commit()
        return {"success": True}

    # Add new IPO with amount
    elif action == "addIpo":
        ipo_name = payload.get("ipoName", "").strip()
        amount = payload.get("amount", 0)

        if not ipo_name:
            raise HTTPException(status_code=400, detail="IPO name is required")

        existing = db.query(IpoName).filter(IpoName.name == ipo_name).first()
        if existing:
            raise HTTPException(status_code=400, detail="IPO name already exists")

        new_ipo = IpoName(
            name=ipo_name,
            amount=float(amount),
            created_at=datetime.utcnow()
        )
        db.add(new_ipo)
        db.commit()
        return ipo_to_dict(new_ipo)

    # Add bulk applications (multiple users to one IPO)
    elif action == "addBulkApplications":
        ipo_name = payload.get("ipoName")
        user_ids = payload.get("userIds", [])

        if not ipo_name:
            raise HTTPException(status_code=400, detail="IPO name is required")
        if not user_ids:
            raise HTTPException(status_code=400, detail="At least one user is required")

        # Validate IPO exists
        ipo = db.query(IpoName).filter(IpoName.name == ipo_name).first()
        if not ipo:
            raise HTTPException(status_code=400, detail=f"IPO '{ipo_name}' does not exist")

        created = []
        for user_id in user_ids:
            # Check if user exists
            applicant = db.query(Applicant).filter(Applicant.id == user_id).first()
            if not applicant:
                continue

            # Check if already applied
            existing = db.query(IpoApplication).filter(
                IpoApplication.ipo_name == ipo_name,
                IpoApplication.user_id == user_id
            ).first()
            if existing:
                continue

            app_id = f"app-{int(time.time() * 1000)}-{user_id[-4:]}"
            new_app = IpoApplication(
                id=app_id,
                ipo_name=ipo_name,
                user_id=user_id,
                money_sent=False,
                money_received=False,
                allotment_status="Pending",
                created_at=datetime.utcnow()
            )
            db.add(new_app)
            created.append(app_id)
            time.sleep(0.001)  # Ensure unique IDs

        db.commit()
        return {"success": True, "created": len(created)}

    # Update application (status and money fields only)
    elif action == "updateRow":
        row_id = payload.get("id")
        data = payload.get("data", {})

        app = db.query(IpoApplication).filter(IpoApplication.id == row_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        if "moneySent" in data:
            app.money_sent = bool(data["moneySent"])
        if "moneyReceived" in data:
            app.money_received = bool(data["moneyReceived"])
        if "allotmentStatus" in data:
            app.allotment_status = data["allotmentStatus"]
            # Auto-rule: If "Not Allotted", reset moneyReceived to false
            if data["allotmentStatus"] == "Not Allotted":
                app.money_received = False

        db.commit()
        db.refresh(app)

        applicant = db.query(Applicant).filter(Applicant.id == app.user_id).first()
        ipo = db.query(IpoName).filter(IpoName.name == app.ipo_name).first()
        return application_to_dict(app, applicant, ipo)

    # Delete application
    elif action == "deleteRow":
        row_id = payload.get("id")

        app = db.query(IpoApplication).filter(IpoApplication.id == row_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        db.delete(app)
        db.commit()
        return {"success": True}

    raise HTTPException(status_code=400, detail="Invalid action")

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
