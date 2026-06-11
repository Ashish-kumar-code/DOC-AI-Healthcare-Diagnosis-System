from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from ..extensions import db
from ..models import User
from ..schemas.auth_schema import RegisterSchema, LoginSchema
from ..utils.rate_limiter import rate_limit, POLICIES



auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/register", methods=["POST"])
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

        access_token = create_access_token(identity=str(user.id))   # Convert to string
        return (
            jsonify({
                "message": "User registered successfully",
                "user": user.to_dict(),
                "access_token": access_token,
            }),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Registration failed", "detail": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
@rate_limit(**POLICIES['auth'])   # ← Add this decorator (5 attempts per minute)
def login():
    data = request.get_json() or {}
    try:
        validated = LoginSchema().load(data)
    except ValidationError as exc:
        return jsonify({"error": "Invalid payload", "messages": exc.messages}), 400

    user = User.query.filter_by(email=validated["email"]).first()
    if not user or not user.check_password(validated["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({"message": "Login successful", "access_token": access_token, "user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": user.to_dict()}), 200
