from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------
# Member Schemas
# ---------------------------------------------------------
class MemberBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50, examples=["John"])
    last_name: str = Field(..., min_length=1, max_length=50, examples=["Doe"])
    email: EmailStr = Field(..., examples=["john.doe@example.com"])
    phone: str = Field(..., min_length=5, max_length=25, examples=["+1-555-0199"])
    gender: Optional[str] = Field(None, max_length=20, examples=["Male"])
    date_of_birth: Optional[date] = Field(None, examples=["1995-05-15"])
    emergency_contact: Optional[str] = Field(None, max_length=100, examples=["Jane Doe (+1-555-0198)"])


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=5, max_length=25)
    gender: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class MemberResponse(MemberBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Membership Plan Schemas
# ---------------------------------------------------------
class MembershipPlanBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Gold Membership"])
    description: Optional[str] = Field(None, examples=["Unlimited gym & pool access with sauna"])
    duration_days: int = Field(..., gt=0, examples=[30])
    price: float = Field(..., ge=0.0, examples=[49.99])
    is_active: bool = Field(True, examples=[True])


class MembershipPlanCreate(MembershipPlanBase):
    pass


class MembershipPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    duration_days: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0.0)
    is_active: Optional[bool] = None


class MembershipPlanResponse(MembershipPlanBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Subscription Schemas
# ---------------------------------------------------------
class SubscriptionCreate(BaseModel):
    member_id: int = Field(..., examples=[1])
    plan_id: int = Field(..., examples=[1])
    start_date: Optional[date] = Field(None, examples=["2026-11-06"])
    amount_paid: Optional[float] = Field(None, ge=0.0, description="Override fee or leave empty for plan price")


class SubscriptionResponse(BaseModel):
    id: int
    member_id: int
    plan_id: int
    start_date: date
    end_date: date
    amount_paid: float
    status: str
    created_at: datetime
    plan: Optional[MembershipPlanResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Trainer Schemas
# ---------------------------------------------------------
class TrainerBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50, examples=["Alex"])
    last_name: str = Field(..., min_length=1, max_length=50, examples=["Rivera"])
    email: EmailStr = Field(..., examples=["alex.rivera@gym.com"])
    phone: str = Field(..., min_length=5, max_length=25, examples=["+1-555-0144"])
    specialization: str = Field(..., min_length=2, max_length=100, examples=["HIIT & Strength"])
    hourly_rate: float = Field(0.0, ge=0.0, examples=[50.0])
    is_active: bool = Field(True, examples=[True])


class TrainerCreate(TrainerBase):
    pass


class TrainerUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=5, max_length=25)
    specialization: Optional[str] = Field(None, min_length=2, max_length=100)
    hourly_rate: Optional[float] = Field(None, ge=0.0)
    is_active: Optional[bool] = None


class TrainerResponse(TrainerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Gym Class Schemas
# ---------------------------------------------------------
class GymClassBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100, examples=["Morning CrossFit"])
    description: Optional[str] = Field(None, examples=["High intensity interval workout with barbell movements"])
    trainer_id: Optional[int] = Field(None, examples=[1])
    schedule_time: datetime = Field(..., examples=["2026-11-07T08:00:00Z"])
    duration_minutes: int = Field(60, gt=0, le=360, examples=[60])
    capacity: int = Field(20, gt=0, examples=[20])


class GymClassCreate(GymClassBase):
    pass


class GymClassUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    trainer_id: Optional[int] = None
    schedule_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, gt=0, le=360)
    capacity: Optional[int] = Field(None, gt=0)


class GymClassResponse(GymClassBase):
    id: int
    created_at: datetime
    enrolled_count: int = 0
    available_spots: int = 0
    trainer: Optional[TrainerResponse] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Class Booking Schemas
# ---------------------------------------------------------
class ClassBookingCreate(BaseModel):
    member_id: int = Field(..., examples=[1])
    class_id: int = Field(..., examples=[1])


class ClassBookingResponse(BaseModel):
    id: int
    member_id: int
    class_id: int
    booked_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Attendance Schemas
# ---------------------------------------------------------
class AttendanceCheckIn(BaseModel):
    member_id: int = Field(..., examples=[1])


class AttendanceResponse(BaseModel):
    id: int
    member_id: int
    check_in: datetime
    check_out: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Detailed Member View & Class Roster
# ---------------------------------------------------------
class MemberDetailResponse(MemberResponse):
    subscriptions: List[SubscriptionResponse] = []
    attendances: List[AttendanceResponse] = []
    bookings: List[ClassBookingResponse] = []


class ClassRosterItemResponse(BaseModel):
    booking_id: int
    member_id: int
    member_name: str
    member_email: str
    booked_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Dashboard & Utility Schemas
# ---------------------------------------------------------
class DashboardStats(BaseModel):
    total_members: int
    active_members: int
    active_subscriptions: int
    today_checkins: int
    total_revenue: float
    total_classes: int


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
