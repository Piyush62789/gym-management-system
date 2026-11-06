from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def utc_now():
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


class Member(Base):
    """Gym member account details and membership history."""

    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(25), nullable=False)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    subscriptions = relationship(
        "Subscription", back_populates="member", cascade="all, delete-orphan"
    )
    attendances = relationship(
        "Attendance", back_populates="member", cascade="all, delete-orphan"
    )
    bookings = relationship(
        "ClassBooking", back_populates="member", cascade="all, delete-orphan"
    )


class MembershipPlan(Base):
    """Membership plans offered by the gym (e.g., Monthly, Annual, VIP)."""

    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, nullable=False)  # Duration in days, e.g., 30, 90, 365
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    """Active or past membership subscription for a member."""

    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(
        Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_id = Column(
        Integer, ForeignKey("membership_plans.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    amount_paid = Column(Float, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, expired, cancelled
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    member = relationship("Member", back_populates="subscriptions")
    plan = relationship("MembershipPlan", back_populates="subscriptions")


class Trainer(Base):
    """Fitness coaches and personal trainers employed by the gym."""

    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(25), nullable=False)
    specialization = Column(String(100), nullable=False)  # e.g., HIIT, Yoga, Powerlifting
    hourly_rate = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    classes = relationship("GymClass", back_populates="trainer")


class GymClass(Base):
    """Scheduled group classes (e.g., Zumba, CrossFit, Spin)."""

    __tablename__ = "gym_classes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    trainer_id = Column(
        Integer, ForeignKey("trainers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    schedule_time = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=60, nullable=False)
    capacity = Column(Integer, default=20, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    trainer = relationship("Trainer", back_populates="classes")
    bookings = relationship(
        "ClassBooking", back_populates="gym_class", cascade="all, delete-orphan"
    )


class ClassBooking(Base):
    """Member enrollments/reservations for scheduled classes."""

    __tablename__ = "class_bookings"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(
        Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id = Column(
        Integer, ForeignKey("gym_classes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    booked_at = Column(DateTime, default=utc_now, nullable=False)
    status = Column(String(20), default="confirmed", nullable=False)  # confirmed, cancelled, attended

    # Relationships
    member = relationship("Member", back_populates="bookings")
    gym_class = relationship("GymClass", back_populates="bookings")


class Attendance(Base):
    """Daily check-in and check-out logs for gym members."""

    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(
        Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    check_in = Column(DateTime, default=utc_now, nullable=False)
    check_out = Column(DateTime, nullable=True)

    # Relationships
    member = relationship("Member", back_populates="attendances")

