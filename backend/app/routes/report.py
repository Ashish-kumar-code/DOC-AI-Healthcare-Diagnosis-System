import os
from pathlib import Path
from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import DiagnosisHistory, User
from ..extensions import db
from ..services.report_service import generate_report_pdf

report_bp = Blueprint("report_bp", __name__)


@report_bp.route("/<int:diagnosis_id>/pdf", methods=["GET"])
@jwt_required()
def get_pdf_report(diagnosis_id):
    user_id = get_jwt_identity()
    diagnosis = db.session.get(DiagnosisHistory, diagnosis_id)
    if not diagnosis:
        return jsonify({"error": "Diagnosis not found"}), 404

    # SECURITY: Verify the requesting user owns this diagnosis
    if str(diagnosis.user_id) != str(user_id):
        return jsonify({"error": "Access denied"}), 403

    user = db.session.get(User, diagnosis.user_id)

    report_context = {
        "patient_name": user.name if user else "Anonymous",
        "patient_email": user.email if user else "",
        "date": diagnosis.created_at.isoformat(),
        "symptoms_summary": diagnosis.symptom_text,
        "text_prediction": diagnosis.text_prediction,
        "image_prediction": diagnosis.image_prediction,
        "final_prediction": diagnosis.final_prediction,
        "confidence_score": diagnosis.confidence_score,
        "advice": diagnosis.advice or "Follow doctor advice.",
    }

    file_path = Path(__file__).resolve().parent.parent / "static" / "reports" / f"diagnosis_{diagnosis_id}.pdf"
    file_path = str(file_path)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    generate_report_pdf(file_path, report_context)

    return send_file(file_path, mimetype="application/pdf", as_attachment=True)
