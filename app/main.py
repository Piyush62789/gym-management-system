import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import check_db_connection, create_tables, get_db
from app.models import (
    Attendance,
    ClassBooking,
    GymClass,
    Member,
    MembershipPlan,
    Subscription,
    Trainer,
    utc_now,
)
from app.schemas import (
    AttendanceCheckIn,
    AttendanceResponse,
    ClassBookingCreate,
    ClassBookingResponse,
    ClassRosterItemResponse,
    DashboardStats,
    GymClassCreate,
    GymClassResponse,
    GymClassUpdate,
    HealthResponse,
    MemberCreate,
    MemberDetailResponse,
    MemberResponse,
    MemberUpdate,
    MembershipPlanCreate,
    MembershipPlanResponse,
    MembershipPlanUpdate,
    MessageResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    TrainerCreate,
    TrainerResponse,
    TrainerUpdate,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events: create tables on startup."""
    create_tables()
    yield


app = FastAPI(
    title="Gym Management System API",
    description="Production-ready RESTful API for managing gym members, subscriptions, trainers, classes, and daily attendance.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend static assets if directory exists
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


# ---------------------------------------------------------
# Frontend & System Endpoints
# ---------------------------------------------------------
@app.get("/dashboard", include_in_schema=False)
@app.get("/app", include_in_schema=False)
def serve_dashboard():
    """Serve the HTML & CSS Gym Management Frontend."""
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    raise HTTPException(status_code=404, detail="Frontend static/index.html not found.")


@app.get("/", tags=["General"])
def root(request: Request):
    """API Root with service metadata and frontend routing."""
    accept = request.headers.get("accept", "")
    # If opened directly in browser without API client, serve UI
    if "text/html" in accept and os.path.exists("static/index.html"):
        return FileResponse("static/index.html")

    return {
        "service": "Gym Management System API",
        "version": "1.0.0",
        "status": "online",
        "dashboard_ui": "/dashboard",
        "documentation": "/docs",
        "alternative_documentation": "/redoc",
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
def health_check():
    """Healthcheck endpoint for Docker, Kubernetes, and uptime monitoring."""
    db_ok = check_db_connection()
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        version="1.0.0",
        database="connected" if db_ok else "disconnected",
        timestamp=datetime.now(timezone.utc),
    )


@app.get("/api/v1/dashboard", response_model=DashboardStats, tags=["Dashboard"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for gym administration and dashboard metrics."""
    total_members = db.query(Member).count()
    active_members = db.query(Member).filter(Member.is_active == True).count()
    active_subscriptions = (
        db.query(Subscription).filter(Subscription.status == "active").count()
    )

    today = date.today()
    today_start = datetime(today.year, today.month, today.day, 0, 0, 0)
    today_checkins = (
        db.query(Attendance).filter(Attendance.check_in >= today_start).count()
    )

    total_revenue = (
        db.query(func.coalesce(func.sum(Subscription.amount_paid), 0.0)).scalar() or 0.0
    )
    total_classes = db.query(GymClass).count()

    return DashboardStats(
        total_members=total_members,
        active_members=active_members,
        active_subscriptions=active_subscriptions,
        today_checkins=today_checkins,
        total_revenue=float(total_revenue),
        total_classes=total_classes,
    )


@app.post("/api/v1/seed", response_model=MessageResponse, tags=["Dashboard"])
def seed_demo_data(db: Session = Depends(get_db)):
    """Seed the database with sample membership plans, trainers, members, classes, and check-ins."""
    if db.query(MembershipPlan).first():
        return MessageResponse(
            message="Database already initialized with plans. Seed completed."
        )

    # 1. Plans
    plans = [
        MembershipPlan(
            name="Basic Monthly",
            description="Access to gym floor equipment during standard gym hours",
            duration_days=30,
            price=39.99,
            is_active=True,
        ),
        MembershipPlan(
            name="Pro Quarterly",
            description="Full access to gym, swimming pool, and sauna for 90 days",
            duration_days=90,
            price=99.99,
            is_active=True,
        ),
        MembershipPlan(
            name="VIP Annual",
            description="Unlimited 24/7 access, free group classes, and personal locker",
            duration_days=365,
            price=349.99,
            is_active=True,
        ),
    ]
    db.add_all(plans)
    db.commit()

    # 2. Trainers
    trainers = [
        Trainer(
            first_name="Elena",
            last_name="Rostova",
            email="elena.rostova@gym.com",
            phone="+1-555-0201",
            specialization="CrossFit & Olympic Lifting",
            hourly_rate=65.0,
            is_active=True,
        ),
        Trainer(
            first_name="Marcus",
            last_name="Vance",
            email="marcus.vance@gym.com",
            phone="+1-555-0202",
            specialization="HIIT & Athletic Conditioning",
            hourly_rate=55.0,
            is_active=True,
        ),
        Trainer(
            first_name="Aria",
            last_name="Chen",
            email="aria.chen@gym.com",
            phone="+1-555-0203",
            specialization="Vinyasa Yoga & Mobility",
            hourly_rate=50.0,
            is_active=True,
        ),
    ]
    db.add_all(trainers)
    db.commit()

    # 3. Members
    members = [
        Member(
            first_name="Liam",
            last_name="Smith",
            email="liam.smith@example.com",
            phone="+1-555-1101",
            gender="Male",
            date_of_birth=date(1994, 6, 12),
            emergency_contact="Emma Smith (+1-555-1102)",
            is_active=True,
        ),
        Member(
            first_name="Sophia",
            last_name="Johnson",
            email="sophia.johnson@example.com",
            phone="+1-555-2201",
            gender="Female",
            date_of_birth=date(1998, 9, 23),
            emergency_contact="David Johnson (+1-555-2202)",
            is_active=True,
        ),
        Member(
            first_name="Ethan",
            last_name="Brown",
            email="ethan.brown@example.com",
            phone="+1-555-3301",
            gender="Male",
            date_of_birth=date(1991, 1, 30),
            emergency_contact="Sarah Brown (+1-555-3302)",
            is_active=True,
        ),
    ]
    db.add_all(members)
    db.commit()

    # 4. Subscriptions
    today = date.today()
    for i, m in enumerate(members):
        p = plans[i % len(plans)]
        sub = Subscription(
            member_id=m.id,
            plan_id=p.id,
            start_date=today,
            end_date=today + timedelta(days=p.duration_days),
            amount_paid=p.price,
            status="active",
        )
        db.add(sub)
    db.commit()

    # 5. Classes
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    classes = [
        GymClass(
            title="Sunrise Spin Cycle",
            description="High-energy rhythm cycle workout for cardiovascular fitness",
            trainer_id=trainers[1].id,
            schedule_time=tomorrow.replace(hour=7, minute=0, second=0),
            duration_minutes=45,
            capacity=15,
        ),
        GymClass(
            title="Barbell Foundations",
            description="Technique and strength building with compound lifts",
            trainer_id=trainers[0].id,
            schedule_time=tomorrow.replace(hour=10, minute=0, second=0),
            duration_minutes=60,
            capacity=10,
        ),
        GymClass(
            title="Evening Yoga Flow",
            description="Restorative stretching and mindful breathing",
            trainer_id=trainers[2].id,
            schedule_time=tomorrow.replace(hour=18, minute=30, second=0),
            duration_minutes=60,
            capacity=20,
        ),
    ]
    db.add_all(classes)
    db.commit()

    # 6. Sample Attendance & Booking
    db.add(Attendance(member_id=members[0].id, check_in=datetime.now(timezone.utc)))
    db.add(ClassBooking(member_id=members[0].id, class_id=classes[0].id, status="confirmed"))
    db.commit()

    return MessageResponse(
        message="Demo data seeded successfully with plans, trainers, members, subscriptions, and classes."
    )


# ---------------------------------------------------------
# Member Management Endpoints
# ---------------------------------------------------------
@app.post(
    "/api/v1/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Members"],
)
def create_member(payload: MemberCreate, db: Session = Depends(get_db)):
    """Register a new gym member."""
    existing = db.query(Member).filter(Member.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member with email '{payload.email}' already exists.",
        )

    member = Member(**payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@app.get("/api/v1/members", response_model=List[MemberResponse], tags=["Members"])
def list_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
):
    """Retrieve members with optional search and active status filter."""
    query = db.query(Member)

    if is_active is not None:
        query = query.filter(Member.is_active == is_active)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Member.first_name.ilike(search_pattern),
                Member.last_name.ilike(search_pattern),
                Member.email.ilike(search_pattern),
                Member.phone.ilike(search_pattern),
            )
        )

    return query.order_by(Member.id.desc()).offset(skip).limit(limit).all()


@app.get("/api/v1/members/{member_id}", response_model=MemberResponse, tags=["Members"])
def get_member(member_id: int, db: Session = Depends(get_db)):
    """Fetch details of a specific member by ID."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found.",
        )
    return member


@app.put("/api/v1/members/{member_id}", response_model=MemberResponse, tags=["Members"])
def update_member(
    member_id: int, payload: MemberUpdate, db: Session = Depends(get_db)
):
    """Update member information."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != member.email:
        conflict = db.query(Member).filter(Member.email == data["email"]).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Member with email '{data['email']}' already exists.",
            )

    for field, value in data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


@app.delete("/api/v1/members/{member_id}", response_model=MessageResponse, tags=["Members"])
def delete_member(member_id: int, db: Session = Depends(get_db)):
    """Delete a member and their associated records."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found.",
        )

    db.delete(member)
    db.commit()
    return MessageResponse(message=f"Member {member_id} has been successfully deleted.")


# ---------------------------------------------------------
# Membership Plan Endpoints
# ---------------------------------------------------------
@app.post(
    "/api/v1/plans",
    response_model=MembershipPlanResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Plans"],
)
def create_membership_plan(
    payload: MembershipPlanCreate, db: Session = Depends(get_db)
):
    """Create a new gym membership plan."""
    existing = (
        db.query(MembershipPlan).filter(MembershipPlan.name == payload.name).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan with name '{payload.name}' already exists.",
        )

    plan = MembershipPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.get(
    "/api/v1/plans", response_model=List[MembershipPlanResponse], tags=["Plans"]
)
def list_membership_plans(
    active_only: bool = Query(False, description="Filter only active plans"),
    db: Session = Depends(get_db),
):
    """List available membership plans."""
    query = db.query(MembershipPlan)
    if active_only:
        query = query.filter(MembershipPlan.is_active == True)
    return query.order_by(MembershipPlan.price.asc()).all()


@app.get(
    "/api/v1/plans/{plan_id}",
    response_model=MembershipPlanResponse,
    tags=["Plans"],
)
def get_membership_plan(plan_id: int, db: Session = Depends(get_db)):
    """Get membership plan details by ID."""
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found.",
        )
    return plan


@app.put(
    "/api/v1/plans/{plan_id}",
    response_model=MembershipPlanResponse,
    tags=["Plans"],
)
def update_membership_plan(
    plan_id: int, payload: MembershipPlanUpdate, db: Session = Depends(get_db)
):
    """Update an existing membership plan."""
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != plan.name:
        conflict = (
            db.query(MembershipPlan).filter(MembershipPlan.name == data["name"]).first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan with name '{data['name']}' already exists.",
            )

    for field, value in data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


@app.delete("/api/v1/plans/{plan_id}", response_model=MessageResponse, tags=["Plans"])
def delete_membership_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a plan or deactivate if it has associated subscriptions."""
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {plan_id} not found.",
        )

    # Check if subscriptions exist
    has_subscriptions = (
        db.query(Subscription).filter(Subscription.plan_id == plan_id).first()
    )
    if has_subscriptions:
        # Gracefully deactivate rather than breaking foreign key constraints
        plan.is_active = False
        db.commit()
        return MessageResponse(
            message=f"Plan {plan_id} has existing subscriptions; marked as inactive instead of deleting."
        )

    db.delete(plan)
    db.commit()
    return MessageResponse(message=f"Plan {plan_id} deleted successfully.")


# ---------------------------------------------------------
# Subscription Endpoints
# ---------------------------------------------------------
@app.post(
    "/api/v1/subscriptions",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Subscriptions"],
)
def create_subscription(
    payload: SubscriptionCreate, db: Session = Depends(get_db)
):
    """Subscribe a member to a plan. Computes end_date automatically from plan duration."""
    member = db.query(Member).filter(Member.id == payload.member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {payload.member_id} not found.",
        )

    plan = db.query(MembershipPlan).filter(MembershipPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan with ID {payload.plan_id} not found.",
        )
    if not plan.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot subscribe to inactive plan '{plan.name}'.",
        )

    start_date = payload.start_date or date.today()
    end_date = start_date + timedelta(days=plan.duration_days)
    amount_paid = payload.amount_paid if payload.amount_paid is not None else plan.price

    subscription = Subscription(
        member_id=member.id,
        plan_id=plan.id,
        start_date=start_date,
        end_date=end_date,
        amount_paid=amount_paid,
        status="active",
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@app.get(
    "/api/v1/subscriptions",
    response_model=List[SubscriptionResponse],
    tags=["Subscriptions"],
)
def list_subscriptions(
    member_id: Optional[int] = Query(None, description="Filter by member ID"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status (active, expired, cancelled)"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List subscriptions with optional filters."""
    query = db.query(Subscription)
    if member_id:
        query = query.filter(Subscription.member_id == member_id)
    if status_filter:
        query = query.filter(Subscription.status == status_filter)

    return query.order_by(Subscription.id.desc()).offset(skip).limit(limit).all()


@app.get(
    "/api/v1/subscriptions/{subscription_id}",
    response_model=SubscriptionResponse,
    tags=["Subscriptions"],
)
def get_subscription(subscription_id: int, db: Session = Depends(get_db)):
    """Get subscription by ID."""
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {subscription_id} not found.",
        )
    return sub


@app.patch(
    "/api/v1/subscriptions/{subscription_id}/cancel",
    response_model=SubscriptionResponse,
    tags=["Subscriptions"],
)
def cancel_subscription(subscription_id: int, db: Session = Depends(get_db)):
    """Cancel an ongoing subscription."""
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription with ID {subscription_id} not found.",
        )

    sub.status = "cancelled"
    db.commit()
    db.refresh(sub)
    return sub


# ---------------------------------------------------------
# Trainer Endpoints
# ---------------------------------------------------------
@app.post(
    "/api/v1/trainers",
    response_model=TrainerResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Trainers"],
)
def create_trainer(payload: TrainerCreate, db: Session = Depends(get_db)):
    """Register a new gym trainer or coach."""
    existing = db.query(Trainer).filter(Trainer.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trainer with email '{payload.email}' already exists.",
        )

    trainer = Trainer(**payload.model_dump())
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return trainer


@app.get(
    "/api/v1/trainers", response_model=List[TrainerResponse], tags=["Trainers"]
)
def list_trainers(
    is_active: Optional[bool] = Query(None),
    specialization: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List trainers with optional specialization filter."""
    query = db.query(Trainer)
    if is_active is not None:
        query = query.filter(Trainer.is_active == is_active)
    if specialization:
        query = query.filter(Trainer.specialization.ilike(f"%{specialization}%"))
    return query.order_by(Trainer.first_name.asc()).all()


@app.get(
    "/api/v1/trainers/{trainer_id}",
    response_model=TrainerResponse,
    tags=["Trainers"],
)
def get_trainer(trainer_id: int, db: Session = Depends(get_db)):
    """Get trainer details by ID."""
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trainer with ID {trainer_id} not found.",
        )
    return trainer


@app.put(
    "/api/v1/trainers/{trainer_id}",
    response_model=TrainerResponse,
    tags=["Trainers"],
)
def update_trainer(
    trainer_id: int, payload: TrainerUpdate, db: Session = Depends(get_db)
):
    """Update trainer details."""
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trainer with ID {trainer_id} not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "email" in data and data["email"] != trainer.email:
        conflict = db.query(Trainer).filter(Trainer.email == data["email"]).first()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trainer with email '{data['email']}' already exists.",
            )

    for field, value in data.items():
        setattr(trainer, field, value)

    db.commit()
    db.refresh(trainer)
    return trainer


@app.delete(
    "/api/v1/trainers/{trainer_id}",
    response_model=MessageResponse,
    tags=["Trainers"],
)
def delete_trainer(trainer_id: int, db: Session = Depends(get_db)):
    """Delete trainer from system."""
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trainer with ID {trainer_id} not found.",
        )

    db.delete(trainer)
    db.commit()
    return MessageResponse(message=f"Trainer {trainer_id} successfully deleted.")


# ---------------------------------------------------------
# Gym Class & Booking Endpoints
# ---------------------------------------------------------
def _format_gym_class(gc: GymClass, db: Session) -> GymClassResponse:
    """Helper to populate dynamic counts for a gym class."""
    enrolled_count = (
        db.query(ClassBooking)
        .filter(ClassBooking.class_id == gc.id, ClassBooking.status == "confirmed")
        .count()
    )
    available_spots = max(0, gc.capacity - enrolled_count)
    return GymClassResponse(
        id=gc.id,
        title=gc.title,
        description=gc.description,
        trainer_id=gc.trainer_id,
        schedule_time=gc.schedule_time,
        duration_minutes=gc.duration_minutes,
        capacity=gc.capacity,
        created_at=gc.created_at,
        enrolled_count=enrolled_count,
        available_spots=available_spots,
        trainer=TrainerResponse.model_validate(gc.trainer) if gc.trainer else None,
    )


@app.post(
    "/api/v1/classes",
    response_model=GymClassResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Classes"],
)
def create_class(payload: GymClassCreate, db: Session = Depends(get_db)):
    """Schedule a new fitness class."""
    if payload.trainer_id:
        trainer = db.query(Trainer).filter(Trainer.id == payload.trainer_id).first()
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trainer with ID {payload.trainer_id} does not exist.",
            )

    gym_class = GymClass(**payload.model_dump())
    db.add(gym_class)
    db.commit()
    db.refresh(gym_class)
    return _format_gym_class(gym_class, db)


@app.get("/api/v1/classes", response_model=List[GymClassResponse], tags=["Classes"])
def list_classes(
    upcoming_only: bool = Query(False, description="Filter only classes starting from now"),
    trainer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List scheduled classes with capacity & available spot calculations."""
    query = db.query(GymClass)
    if upcoming_only:
        query = query.filter(GymClass.schedule_time >= utc_now())
    if trainer_id:
        query = query.filter(GymClass.trainer_id == trainer_id)

    classes = query.order_by(GymClass.schedule_time.asc()).offset(skip).limit(limit).all()
    return [_format_gym_class(c, db) for c in classes]


@app.get(
    "/api/v1/classes/{class_id}",
    response_model=GymClassResponse,
    tags=["Classes"],
)
def get_class(class_id: int, db: Session = Depends(get_db)):
    """Get single class details with enrollment info."""
    gym_class = db.query(GymClass).filter(GymClass.id == class_id).first()
    if not gym_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found.",
        )
    return _format_gym_class(gym_class, db)


@app.put(
    "/api/v1/classes/{class_id}",
    response_model=GymClassResponse,
    tags=["Classes"],
)
def update_class(
    class_id: int, payload: GymClassUpdate, db: Session = Depends(get_db)
):
    """Update class schedule or capacity."""
    gym_class = db.query(GymClass).filter(GymClass.id == class_id).first()
    if not gym_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found.",
        )

    data = payload.model_dump(exclude_unset=True)
    if "trainer_id" in data and data["trainer_id"] is not None:
        trainer = db.query(Trainer).filter(Trainer.id == data["trainer_id"]).first()
        if not trainer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Trainer with ID {data['trainer_id']} does not exist.",
            )

    for field, value in data.items():
        setattr(gym_class, field, value)

    db.commit()
    db.refresh(gym_class)
    return _format_gym_class(gym_class, db)


@app.delete(
    "/api/v1/classes/{class_id}",
    response_model=MessageResponse,
    tags=["Classes"],
)
def delete_class(class_id: int, db: Session = Depends(get_db)):
    """Cancel and remove a class."""
    gym_class = db.query(GymClass).filter(GymClass.id == class_id).first()
    if not gym_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found.",
        )

    db.delete(gym_class)
    db.commit()
    return MessageResponse(message=f"Class {class_id} successfully deleted.")


@app.post(
    "/api/v1/classes/{class_id}/book",
    response_model=ClassBookingResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Bookings"],
)
def book_class(
    class_id: int, payload: AttendanceCheckIn, db: Session = Depends(get_db)
):
    """Reserve a member's spot in a class with capacity validation."""
    member_id = payload.member_id

    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found.",
        )
    if not member.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive members cannot book classes.",
        )

    gym_class = db.query(GymClass).filter(GymClass.id == class_id).first()
    if not gym_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class with ID {class_id} not found.",
        )

    # Check for duplicate active booking
    existing = (
        db.query(ClassBooking)
        .filter(
            ClassBooking.class_id == class_id,
            ClassBooking.member_id == member_id,
            ClassBooking.status == "confirmed",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member is already booked for this class.",
        )

    # Check capacity
    enrolled_count = (
        db.query(ClassBooking)
        .filter(ClassBooking.class_id == class_id, ClassBooking.status == "confirmed")
        .count()
    )
    if enrolled_count >= gym_class.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class has reached maximum capacity.",
        )

    booking = ClassBooking(member_id=member_id, class_id=class_id, status="confirmed")
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@app.post(
    "/api/v1/classes/{class_id}/cancel-booking/{member_id}",
    response_model=MessageResponse,
    tags=["Bookings"],
)
def cancel_booking(class_id: int, member_id: int, db: Session = Depends(get_db)):
    """Cancel a member's reservation in a class."""
    booking = (
        db.query(ClassBooking)
        .filter(
            ClassBooking.class_id == class_id,
            ClassBooking.member_id == member_id,
            ClassBooking.status == "confirmed",
        )
        .first()
    )
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No confirmed booking found for member {member_id} in class {class_id}.",
        )

    booking.status = "cancelled"
    db.commit()
    return MessageResponse(message=f"Booking for member {member_id} in class {class_id} cancelled.")


# ---------------------------------------------------------
# Attendance Endpoints
# ---------------------------------------------------------
@app.post(
    "/api/v1/attendance/check-in",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Attendance"],
)
def member_check_in(payload: AttendanceCheckIn, db: Session = Depends(get_db)):
    """Record member entry/check-in to the gym."""
    member = db.query(Member).filter(Member.id == payload.member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {payload.member_id} not found.",
        )
    if not member.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot check in an inactive member.",
        )

    attendance = Attendance(member_id=member.id, check_in=datetime.now(timezone.utc))
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


@app.post(
    "/api/v1/attendance/check-out/{attendance_id}",
    response_model=AttendanceResponse,
    tags=["Attendance"],
)
def member_check_out(attendance_id: int, db: Session = Depends(get_db)):
    """Record member exit/check-out."""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found.",
        )
    if attendance.check_out is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Member has already checked out for this session.",
        )

    attendance.check_out = datetime.now(timezone.utc)
    db.commit()
    db.refresh(attendance)
    return attendance


@app.get(
    "/api/v1/attendance",
    response_model=List[AttendanceResponse],
    tags=["Attendance"],
)
def list_attendance(
    member_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve gym attendance log entries."""
    query = db.query(Attendance)
    if member_id:
        query = query.filter(Attendance.member_id == member_id)
    return query.order_by(Attendance.check_in.desc()).offset(skip).limit(limit).all()

