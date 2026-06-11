from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from ..extensions import db
from ..models import ChatSession
from ..schemas.chat_schema import ChatMessageSchema
from ..services.chatbot_service import ChatbotService

chat_bp = Blueprint("chat_bp", __name__)

# In-memory store for active chat sessions (use Redis in production)
active_chats = {}


@chat_bp.route("/start", methods=["POST"])
@jwt_required()
def start_chat():
    user_id = get_jwt_identity()
    session_id = f"{user_id}_{int(__import__('time').time())}"

    chatbot = ChatbotService()
    active_chats[session_id] = chatbot

    first_question = chatbot.get_next_question()

    return jsonify({
        "session_id": session_id,
        "message": "Welcome to DOC AI Symptom Checker. Let's collect your information.",
        "question": first_question,
    }), 200


@chat_bp.route("/message", methods=["POST"])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    session_id = data.get("session_id")
    user_message = data.get("message", "").strip()

    if not session_id or session_id not in active_chats:
        return jsonify({"error": "Invalid or expired session"}), 400

    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        validated = ChatMessageSchema().load({"message": user_message})
    except ValidationError as exc:
        return jsonify({"error": "Invalid message", "messages": exc.messages}), 400

    chatbot = active_chats[session_id]
    response = chatbot.process_answer(validated["message"])

    # If complete, save chat session to DB
    if response["status"] == "complete":
        messages = [
            {"role": "system", "content": q["question"]} for q in SYSTEM_QUESTIONS[:chatbot.current_question_idx]
        ]
        chat_session = ChatSession(
            user_id=user_id,
            messages_json=messages,
            summary=f"Collected {len(chatbot.collected_data)} symptoms",
        )
        db.session.add(chat_session)
        db.session.commit()

        # Clean up active session
        del active_chats[session_id]

        return jsonify({
            "status": response["status"],
            "message": response["message"],
            "collected_data": response.get("data"),
        }), 200

    return jsonify(response), 200


@chat_bp.route("/history", methods=["GET"])
@jwt_required()
def chat_history():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    sessions = ChatSession.query.filter_by(user_id=user_id).order_by(ChatSession.created_at.desc()).paginate(page=page, per_page=limit)

    results = [s.to_dict() for s in sessions.items]
    return jsonify({
        "data": results,
        "total": sessions.total,
        "pages": sessions.pages,
        "current_page": page,
    }), 200


# Import for convenience
from ..services.chatbot_service import SYSTEM_QUESTIONS
