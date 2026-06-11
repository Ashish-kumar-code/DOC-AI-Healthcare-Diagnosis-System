import json
import pytest

from app import create_app
from app.config import DevelopmentConfig
from app.extensions import db
from app.models import User


class TestConfig(DevelopmentConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-jwt-secret"


@pytest.fixture(scope="module")
def test_client():
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_register_login_profile(test_client):
    register_payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "StrongPass123",
        "age": 30,
        "gender": "other",
    }

    resp = test_client.post("/api/auth/register", json=register_payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["message"] == "User registered successfully"
    assert "access_token" in data

    login_payload = {
        "email": "test@example.com",
        "password": "StrongPass123",
    }

    resp = test_client.post("/api/auth/login", json=login_payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Login successful"
    assert "access_token" in data

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    resp = test_client.get("/api/auth/profile", headers=headers)
    assert resp.status_code == 200
    profile_data = resp.get_json()["user"]
    assert profile_data["email"] == "test@example.com"


def test_register_duplicate_email_returns_conflict(test_client):
    payload = {
        "name": "Jane Doe",
        "email": "duplicate@example.com",
        "password": "Password123",
    }

    resp = test_client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201

    resp2 = test_client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 409
    assert resp2.get_json()["error"] == "Email already registered"
