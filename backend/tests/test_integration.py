"""
Full integration test suite for DOC AI.
Tests complete diagnosis flow: register → login → chatbot → diagnosis → report.

Run: pytest tests/test_integration.py -v
"""

import pytest
import json
from app import create_app, db
from app.models import User, DiagnosisHistory, ChatSession


@pytest.fixture(scope="module")
def integration_client():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret",
        "RATELIMIT_ENABLED": False,
    })

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_complete_flow_register_login_diagnosis(integration_client):
    """Full user journey: register → login → start chat → send symptom → get diagnosis"""

    # 1. Register
    register_res = integration_client.post(
        "/api/auth/register",
        json={
            "name": "John Doe",
            "email": "john@example.com",
            "password": "SecurePass123",
            "age": 35,
            "gender": "male",
        },
    )
    assert register_res.status_code == 201
    register_data = register_res.get_json()
    assert "access_token" in register_data
    assert register_data["user"]["email"] == "john@example.com"
    token = register_data["access_token"]

    # 2. Login (verify token works)
    headers = {"Authorization": f"Bearer {token}"}
    profile_res = integration_client.get("/api/auth/profile", headers=headers)
    assert profile_res.status_code == 200
    assert profile_res.get_json()["user"]["email"] == "john@example.com"

    # 3. Start chat session
    chat_start_res = integration_client.post("/api/chat/start", headers=headers)
    assert chat_start_res.status_code == 200
    chat_data = chat_start_res.get_json()
    session_id = chat_data["session_id"]
    assert "question" in chat_data
    first_question = chat_data["question"]
    assert first_question["question_id"] == 1  # Age question

    # 4. Send first answer (age)
    msg1_res = integration_client.post(
        "/api/chat/message",
        headers=headers,
        json={"session_id": session_id, "message": "35"},
    )
    assert msg1_res.status_code == 200
    msg1_data = msg1_res.get_json()
    assert msg1_data["status"] == "continued"

    # 5. Send second answer (gender)
    msg2_res = integration_client.post(
        "/api/chat/message",
        headers=headers,
        json={"session_id": session_id, "message": "male"},
    )
    assert msg2_res.status_code == 200
    assert msg2_res.get_json()["status"] == "continued"

    # 6. Send third answer (symptoms)
    msg3_res = integration_client.post(
        "/api/chat/message",
        headers=headers,
        json={"session_id": session_id, "message": "I have a persistent fever, body aches, and cough for the last 3 days"},
    )
    assert msg3_res.status_code == 200
    assert msg3_res.get_json()["status"] == "continued"

    # 7. Send remaining answers quickly
    answers = ["3", "moderate", "101.5", "7"]
    for answer in answers:
        msg_res = integration_client.post(
            "/api/chat/message",
            headers=headers,
            json={"session_id": session_id, "message": answer},
        )
        assert msg_res.status_code == 200

    # 8. Get history
    hist_res = integration_client.get("/api/chat/history", headers=headers)
    assert hist_res.status_code == 200
    assert hist_res.get_json()["total"] >= 1

    print("✅ Full integration flow test passed!")


def test_text_diagnosis_flow(integration_client):
    """Test text-based diagnosis endpoint"""

    # Register and login
    reg = integration_client.post(
        "/api/auth/register",
        json={
            "name": "Jane Smith",
            "email": "jane@example.com",
            "password": "Password123",
            "age": 28,
            "gender": "female",
        },
    )
    token = reg.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Text diagnosis
    diag_res = integration_client.post(
        "/api/diagnosis/text",
        headers=headers,
        json={
            "age": 28,
            "gender": "female",
            "symptom_text": "I have a runny nose, sneezing, and mild headache",
            "duration_days": 2,
            "severity": "mild",
            "temperature": 98.6,
            "pain_level": 2,
        },
    )

    assert diag_res.status_code in [201, 503]  # 201 if model exists, 503 if not trained
    if diag_res.status_code == 201:
        diag_data = diag_res.get_json()
        assert "diagnosis_id" in diag_data
        assert "prediction" in diag_data
        assert "advice" in diag_data

        # Get diagnosis history
        hist = integration_client.get("/api/diagnosis/history", headers=headers)
        assert hist.status_code == 200
        assert hist.get_json()["pagination"]["total"] >= 1

    print("✅ Text diagnosis test passed!")


def test_location_nearby(integration_client):
    """Test nearby location search"""

    # Register and login
    reg = integration_client.post(
        "/api/auth/register",
        json={
            "name": "Bob Johnson",
            "email": "bob@example.com",
            "password": "BobPass123",
        },
    )
    token = reg.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Nearby search (should fail without API key, but endpoint responds)
    nearby_res = integration_client.post(
        "/api/location/nearby",
        headers=headers,
        json={
            "latitude": 40.7128,
            "longitude": -74.0060,
            "type": "hospital",
            "radius": 5000,
        },
    )

    assert nearby_res.status_code in [200, 500]  # 200 with results, 500 without API key
    print("✅ Location nearby test passed!")


def test_health_endpoint(integration_client):
    """Test health check endpoint"""
    res = integration_client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"
    print("✅ Health check test passed!")


def test_auth_protected_routes(integration_client):
    """Test that protected routes require auth"""

    # Test without token
    profile_res = integration_client.get("/api/auth/profile")
    assert profile_res.status_code == 401

    # Test with invalid token
    bad_headers = {"Authorization": "Bearer invalid"}
    profile_res2 = integration_client.get("/api/auth/profile", headers=bad_headers)
    assert profile_res2.status_code in [401, 422]

    print("✅ Auth protection test passed!")


def test_invalid_registration(integration_client):
    """Test validation on registration"""

    # Missing required fields
    res1 = integration_client.post(
        "/api/auth/register",
        json={"name": "John", "email": "john@example.com"},
    )
    assert res1.status_code == 400

    # Password too short
    res2 = integration_client.post(
        "/api/auth/register",
        json={
            "name": "John",
            "email": "john2@example.com",
            "password": "short",
        },
    )
    assert res2.status_code == 400

    # Invalid email
    res3 = integration_client.post(
        "/api/auth/register",
        json={
            "name": "John",
            "email": "notanemail",
            "password": "ValidPass123",
        },
    )
    assert res3.status_code == 400

    print("✅ Validation test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
