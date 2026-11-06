import os

# Set in-memory database URL before app/database imports
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from datetime import date, datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Create in-memory SQLite database specifically for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh tables for each test function and teardown afterwards."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------
# Test: Health & Root Endpoints
# ---------------------------------------------------------
def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "documentation" in data


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


# ---------------------------------------------------------
# Test: Member CRUD
# ---------------------------------------------------------
def test_member_crud(client):
    # 1. Create Member
    payload = {
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "sarah.connor@resistance.org",
        "phone": "+1-555-0100",
        "gender": "Female",
        "date_of_birth": "1985-04-10",
        "emergency_contact": "John Connor (+1-555-0101)",
    }
    response = client.post("/api/v1/members", json=payload)
    assert response.status_code == 201
    member = response.json()
    assert member["id"] is not None
    assert member["email"] == payload["email"]
    assert member["is_active"] is True
    member_id = member["id"]

    # 2. Reject duplicate email
    dup_res = client.post("/api/v1/members", json=payload)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Retrieve Member
    get_res = client.get(f"/api/v1/members/{member_id}")
    assert get_res.status_code == 200
    assert get_res.json()["first_name"] == "Sarah"

    # 4. Search Members
    search_res = client.get("/api/v1/members?search=connor")
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

    # 5. Update Member
    update_res = client.put(
        f"/api/v1/members/{member_id}",
        json={"phone": "+1-555-9999", "emergency_contact": "Kyle Reese"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+1-555-9999"
    assert update_res.json()["emergency_contact"] == "Kyle Reese"

    # 6. Delete Member
    del_res = client.delete(f"/api/v1/members/{member_id}")
    assert del_res.status_code == 200

    # 7. Verify deletion
    not_found_res = client.get(f"/api/v1/members/{member_id}")
    assert not_found_res.status_code == 404


# ---------------------------------------------------------
# Test: Membership Plans & Subscriptions
# ---------------------------------------------------------
def test_membership_plan_and_subscription(client):
    # 1. Create a member
    member = client.post(
        "/api/v1/members",
        json={
            "first_name": "Bruce",
            "last_name": "Wayne",
            "email": "bruce@wayne.com",
            "phone": "+1-555-0199",
        },
    ).json()

    # 2. Create a Plan
    plan_payload = {
        "name": "Platinum Annual",
        "description": "Full access to all facilities and classes for 365 days",
        "duration_days": 365,
        "price": 599.99,
        "is_active": True,
    }
    plan_res = client.post("/api/v1/plans", json=plan_payload)
    assert plan_res.status_code == 201
    plan = plan_res.json()
    assert plan["duration_days"] == 365

    # 3. Duplicate plan rejected
    dup_plan = client.post("/api/v1/plans", json=plan_payload)
    assert dup_plan.status_code == 400

    # 4. Subscribe Member to Plan
    sub_payload = {
        "member_id": member["id"],
        "plan_id": plan["id"],
        "start_date": "2026-11-01",
    }
    sub_res = client.post("/api/v1/subscriptions", json=sub_payload)
    assert sub_res.status_code == 201
    sub = sub_res.json()
    assert sub["status"] == "active"
    assert sub["amount_paid"] == 599.99
    # Calculated end date: 2026-11-01 + 365 days = 2027-11-01
    assert sub["end_date"] == "2027-11-01"

    # 5. List subscriptions
    sub_list = client.get(f"/api/v1/subscriptions?member_id={member['id']}")
    assert sub_list.status_code == 200
    assert len(sub_list.json()) == 1

    # 6. Cancel subscription
    cancel_res = client.patch(f"/api/v1/subscriptions/{sub['id']}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"


# ---------------------------------------------------------
# Test: Trainers, Classes & Booking Flow
# ---------------------------------------------------------
def test_trainers_classes_and_bookings(client):
    # 1. Create Trainer
    trainer_res = client.post(
        "/api/v1/trainers",
        json={
            "first_name": "Marcus",
            "last_name": "Aurelius",
            "email": "marcus@gym.com",
            "phone": "+1-555-7777",
            "specialization": "Stoic Calisthenics",
            "hourly_rate": 60.0,
        },
    )
    assert trainer_res.status_code == 201
    trainer = trainer_res.json()

    # 2. Create Class with capacity 2
    class_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    class_res = client.post(
        "/api/v1/classes",
        json={
            "title": "Kettlebell Mastery",
            "description": "Functional kettlebell training",
            "trainer_id": trainer["id"],
            "schedule_time": class_time,
            "duration_minutes": 45,
            "capacity": 2,
        },
    )
    assert class_res.status_code == 201
    gym_class = class_res.json()
    assert gym_class["capacity"] == 2
    assert gym_class["available_spots"] == 2

    # 3. Create two members
    m1 = client.post(
        "/api/v1/members",
        json={
            "first_name": "Member",
            "last_name": "One",
            "email": "m1@test.com",
            "phone": "+1-111-1111",
        },
    ).json()

    m2 = client.post(
        "/api/v1/members",
        json={
            "first_name": "Member",
            "last_name": "Two",
            "email": "m2@test.com",
            "phone": "+1-222-2222",
        },
    ).json()

    m3 = client.post(
        "/api/v1/members",
        json={
            "first_name": "Member",
            "last_name": "Three",
            "email": "m3@test.com",
            "phone": "+1-333-3333",
        },
    ).json()

    # 4. Book Member 1
    book1 = client.post(
        f"/api/v1/classes/{gym_class['id']}/book", json={"member_id": m1["id"]}
    )
    assert book1.status_code == 201

    # Duplicate booking prevention
    dup_book = client.post(
        f"/api/v1/classes/{gym_class['id']}/book", json={"member_id": m1["id"]}
    )
    assert dup_book.status_code == 400

    # 5. Book Member 2 (reaches capacity)
    book2 = client.post(
        f"/api/v1/classes/{gym_class['id']}/book", json={"member_id": m2["id"]}
    )
    assert book2.status_code == 201

    # 6. Book Member 3 (fails due to full capacity)
    book3 = client.post(
        f"/api/v1/classes/{gym_class['id']}/book", json={"member_id": m3["id"]}
    )
    assert book3.status_code == 400
    assert "maximum capacity" in book3.json()["detail"]

    # 7. Member 1 cancels booking
    cancel = client.post(
        f"/api/v1/classes/{gym_class['id']}/cancel-booking/{m1['id']}"
    )
    assert cancel.status_code == 200

    # 8. Member 3 can now book the freed spot
    book3_retry = client.post(
        f"/api/v1/classes/{gym_class['id']}/book", json={"member_id": m3["id"]}
    )
    assert book3_retry.status_code == 201


# ---------------------------------------------------------
# Test: Attendance Tracking Flow
# ---------------------------------------------------------
def test_attendance_flow(client):
    member = client.post(
        "/api/v1/members",
        json={
            "first_name": "Diana",
            "last_name": "Prince",
            "email": "diana@themyscira.com",
            "phone": "+1-555-8888",
        },
    ).json()

    # 1. Check in
    checkin_res = client.post(
        "/api/v1/attendance/check-in", json={"member_id": member["id"]}
    )
    assert checkin_res.status_code == 201
    attendance = checkin_res.json()
    assert attendance["check_in"] is not None
    assert attendance["check_out"] is None

    # 2. Check out
    att_id = attendance["id"]
    checkout_res = client.post(f"/api/v1/attendance/check-out/{att_id}")
    assert checkout_res.status_code == 200
    updated_att = checkout_res.json()
    assert updated_att["check_out"] is not None

    # 3. Double checkout error
    double_checkout = client.post(f"/api/v1/attendance/check-out/{att_id}")
    assert double_checkout.status_code == 400

    # 4. List attendance
    history = client.get(f"/api/v1/attendance?member_id={member['id']}")
    assert history.status_code == 200
    assert len(history.json()) == 1


# ---------------------------------------------------------
# Test: Dashboard Analytics
# ---------------------------------------------------------
def test_dashboard_metrics(client):
    # Setup member, plan, subscription, and checkin
    m = client.post(
        "/api/v1/members",
        json={
            "first_name": "Clark",
            "last_name": "Kent",
            "email": "clark@dailyplanet.com",
            "phone": "+1-555-3333",
        },
    ).json()

    p = client.post(
        "/api/v1/plans",
        json={"name": "Krypton Tier", "duration_days": 30, "price": 100.0},
    ).json()

    client.post(
        "/api/v1/subscriptions",
        json={"member_id": m["id"], "plan_id": p["id"]},
    )

    client.post("/api/v1/attendance/check-in", json={"member_id": m["id"]})

    res = client.get("/api/v1/dashboard")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_members"] >= 1
    assert stats["active_members"] >= 1
    assert stats["active_subscriptions"] >= 1
    assert stats["total_revenue"] >= 100.0
    assert stats["today_checkins"] >= 1


def test_frontend_and_seed(client):
    # Test HTML dashboard serving
    dash_res = client.get("/dashboard")
    assert dash_res.status_code == 200
    assert "<!DOCTYPE html>" in dash_res.text

    # Test Seed Endpoint
    seed_res = client.post("/api/v1/seed")
    assert seed_res.status_code == 200
    assert "seeded successfully" in seed_res.json()["message"]

    # Verify seeded members and plans exist
    members_res = client.get("/api/v1/members")
    assert members_res.status_code == 200
    assert len(members_res.json()) >= 3

    plans_res = client.get("/api/v1/plans")
    assert plans_res.status_code == 200
    assert len(plans_res.json()) >= 3
