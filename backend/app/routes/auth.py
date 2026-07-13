from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from datetime import datetime, timedelta

from ..extensions import db
from ..models import User
from ..schemas.auth_schema import RegisterSchema, LoginSchema
from ..utils.rate_limiter import rate_limit, POLICIES


auth_bp = Blueprint("auth_bp", __name__)

# In-memory login attempt tracking (use Redis in production)
_login_attempts = {}


def _check_account_lockout(email):
    """Check if an account is locked due to failed login attempts."""
    from flask import current_app
    max_attempts = current_app.config.get('MAX_LOGIN_ATTEMPTS', 5)
    lockout_minutes = current_app.config.get('ACCOUNT_LOCKOUT_MINUTES', 15)

    if email not in _login_attempts:
        return False

    attempts, last_attempt = _login_attempts[email]
    if attempts >= max_attempts:
        if datetime.utcnow() - last_attempt < timedelta(minutes=lockout_minutes):
            return True
        else:
            # Lockout expired, reset
            del _login_attempts[email]
            return False
    return False


def _record_failed_login(email):
    """Record a failed login attempt."""
    if email in _login_attempts:
        attempts, _ = _login_attempts[email]
        _login_attempts[email] = (attempts + 1, datetime.utcnow())
    else:
        _login_attempts[email] = (1, datetime.utcnow())


def _clear_login_attempts(email):
    """Clear login attempts on successful login."""
    _login_attempts.pop(email, None)


@auth_bp.route("/register", methods=["POST"])
@rate_limit(**POLICIES['auth'])
def register():
    data = request.get_json() or {}
    try:
        validated = RegisterSchema().load(data)
    except ValidationError as exc:
        return jsonify({"error": "Invalid payload", "messages": exc.messages}), 400

    if User.query.filter_by(email=validated["email"]).first():
        return jsonify({"error": "Email already registered"}), 409

    try:
        user = User(
            name=validated["name"],
            email=validated["email"],
            age=validated.get("age"),
            gender=validated.get("gender"),
        )
        user.set_password(validated["password"])
        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return (
            jsonify({
                "message": "User registered successfully",
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            }),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500


@auth_bp.route("/login", methods=["POST"])
@rate_limit(**POLICIES['auth'])
def login():
    data = request.get_json() or {}
    try:
        validated = LoginSchema().load(data)
    except ValidationError as exc:
        return jsonify({"error": "Invalid payload", "messages": exc.messages}), 400

    email = validated["email"]

    # Check account lockout
    if _check_account_lockout(email):
        return jsonify({"error": "Account temporarily locked due to too many failed attempts. Try again later."}), 429

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(validated["password"]):
        _record_failed_login(email)
        return jsonify({"error": "Invalid email or password"}), 401

    _clear_login_attempts(email)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Get a new access token using a valid refresh token."""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200
