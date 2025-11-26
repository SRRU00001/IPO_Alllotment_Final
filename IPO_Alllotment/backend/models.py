from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """User model for authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    token = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Applicant(Base):
    """Applicant/User for IPO applications (separate from auth users)"""
    __tablename__ = "applicants"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    pan = Column(String(10), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class IpoName(Base):
    """IPO names table with amount"""
    __tablename__ = "ipo_names"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

class IpoApplication(Base):
    """IPO application records - links applicants to IPOs"""
    __tablename__ = "ipo_applications"

    id = Column(String(50), primary_key=True)
    ipo_name = Column(String(255), nullable=False)
    user_id = Column(String(50), nullable=False)  # Reference to applicants.id
    money_sent = Column(Boolean, default=False)
    money_received = Column(Boolean, default=False)
    allotment_status = Column(String(20), default='Pending')  # Pending/Allotted/Not Allotted
    created_at = Column(DateTime, server_default=func.now())

    # Unique constraint: user can only apply once per IPO
    __table_args__ = (
        UniqueConstraint('ipo_name', 'user_id', name='unique_user_ipo'),
    )
