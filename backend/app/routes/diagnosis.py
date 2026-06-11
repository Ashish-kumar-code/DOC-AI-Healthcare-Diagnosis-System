"""
Diagnosis Routes - Text, Image & Multimodal Diagnosis
Cleaned & Improved Version
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
import os
import time

from ..utils.report_generator import generate_diagnosis_report
from ..extensions import db
from ..models import DiagnosisHistory, UploadedImage, User
from ..schemas.diagnosis_schema import (
    TextDiagnosisSchema, 
    ImageDiagnosisSchema, 
    MultimodalDiagnosisSchema
)
from ..ml.text_model import predict_text_symptoms
from ..ml.image_model import predict_image
from ..ml.multimodal import fuse_results

from ..utils.nearby_facilities import get_nearby_medical_facilities, get_user_location_from_ip
from app.utils.logger import get_logger, ErrorLogger, Timer

diagnosis_bp = Blueprint("diagnosis_bp", __name__)
logger = get_logger(__name__)


def get_advice(final_confidence: float, disease: str) -> str:
    """Generate natural and professional advice based on confidence"""
    if final_confidence >= 80:
        return f"High confidence assessment suggests {disease}. Please consult a doctor as soon as possible for confirmation and treatment."
    elif final_confidence >= 60:
        return f"Moderate confidence for {disease}. It is recommended to seek medical evaluation soon."
    else:
        return f"Preliminary assessment indicates possible {disease} with lower confidence. Further clinical evaluation is strongly advised."


@diagnosis_bp.route("/text", methods=["POST"])
@jwt_required()
def text_diagnosis():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    try:
        validated = TextDiagnosisSchema().load(data)
    except ValidationError as exc:
        ErrorLogger.log_validation_error("text_diagnosis", str(data), str(exc.messages))
        return jsonify({"error": "Invalid input", "messages": exc.messages}), 400

    with Timer("text_diagnosis"):
        try:
            model_input = {
                "age": validated["age"],
                "gender": validated["gender"],
                "duration_days": validated["duration_days"],
                "severity": validated["severity"],
                "temperature": validated.get("temperature", 98.6),
                "pain_level": validated.get("pain_level", 0),
                "symptom_text": validated.get("symptom_text", "")
            }

            prediction = predict_text_symptoms(model_input)
            final_conf = prediction.get("confidence", 0.0)
            advice = get_advice(final_conf, prediction.get("predicted_disease", "Unknown"))

            diagnosis = DiagnosisHistory(
                user_id=user_id,
                symptom_text=validated.get("symptom_text", ""),
                structured_symptoms_json=validated,
                text_prediction=prediction,
                image_prediction=None,
                final_prediction=prediction.get("predicted_disease"),
                confidence_score=final_conf,
                advice=advice,
            )
            db.session.add(diagnosis)
            db.session.commit()

            # Generate PDF Report
            user = db.session.get(User, user_id)
            generate_diagnosis_report(diagnosis, user)

            return jsonify({
                "success": True,
                "diagnosis_id": diagnosis.id,
                "prediction": prediction,
                "advice": advice,
                "report_url": f"/static/reports/diagnosis_{diagnosis.id}.pdf",
                "disclaimer": "This is an AI-assisted preliminary assessment for educational purposes only. It is not a substitute for professional medical advice."
            }), 201

        except Exception as exc:
            db.session.rollback()
            ErrorLogger.log_error(exc, context="text_diagnosis", user_id=user_id)
            return jsonify({"error": "Diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/image", methods=["POST"])
@jwt_required()
def image_diagnosis():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "Image file required"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    allowed_ext = {"jpg", "jpeg", "png"}
    ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else ""
    if ext not in allowed_ext:
        return jsonify({"error": "Only JPG, JPEG and PNG files allowed"}), 400

    file_path = None
    with Timer("image_diagnosis"):
        try:
            upload_dir = os.getenv("UPLOAD_FOLDER", "app/static/uploads")
            os.makedirs(upload_dir, exist_ok=True)

            file_path = os.path.join(upload_dir, f"{user_id}_{int(time.time())}_{file.filename}")
            file.save(file_path)

            prediction = predict_image(file_path)
            predicted_disease = prediction.get("predicted_class", "Unknown")
            prediction["predicted_disease"] = predicted_disease

            final_conf = prediction.get("confidence", 0.0)
            advice = get_advice(final_conf, predicted_disease)

            uploaded = UploadedImage(
                user_id=user_id,
                image_path=file_path,
                image_type=request.form.get("image_type", "general"),
                processed_status="completed",
            )
            db.session.add(uploaded)
            db.session.flush()

            diagnosis = DiagnosisHistory(
                user_id=user_id,
                symptom_text="Image-based diagnosis",
                structured_symptoms_json={},
                text_prediction=None,
                image_prediction=prediction,
                final_prediction=predicted_disease,
                confidence_score=final_conf,
                advice=advice,
            )
            diagnosis.uploaded_images.append(uploaded)
            db.session.add(diagnosis)
            db.session.commit()

            user = db.session.get(User, user_id)
            generate_diagnosis_report(diagnosis, user)

            return jsonify({
                "success": True,
                "diagnosis_id": diagnosis.id,
                "prediction": prediction,
                "advice": advice,
                "report_url": f"/static/reports/diagnosis_{diagnosis.id}.pdf",
                "disclaimer": "This is an AI-assisted preliminary assessment for educational purposes only."
            }), 201

        except Exception as exc:
            db.session.rollback()
            ErrorLogger.log_error(exc, context="image_diagnosis", user_id=user_id)
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({"error": "Image diagnosis failed", "detail": str(exc)}), 500


@diagnosis_bp.route("/multimodal", methods=["POST"])
@jwt_required()
def multimodal_diagnosis():
    user_id = get_jwt_identity()
    data = request.form.to_dict() if request.form else {}
    file = request.files.get("file")

    try:
        validated = MultimodalDiagnosisSchema().load(data)
    except ValidationError as exc:
        ErrorLogger.log_validation_error("multimodal", str(data), str(exc.messages))
        return jsonify({"error": "Invalid input", "messages": exc.messages}), 400

    file_path = None
    with Timer("multimodal_diagnosis"):
        try:
            # Text Prediction
            model_input = {
                "age": validated["age"],
                "gender": validated["gender"],
                "duration_days": validated["duration_days"],
                "severity": validated["severity"],
                "temperature": validated.get("temperature", 98.6),
                "pain_level": validated.get("pain_level", 0),
                "symptom_text": validated.get("symptom_text", "")
            }
            text_pred = predict_text_symptoms(model_input)

            # Image Prediction
            image_pred = None
            uploaded = None

            if file and file.filename:
                upload_dir = os.getenv("UPLOAD_FOLDER", "app/static/uploads")
                os.makedirs(upload_dir, exist_ok=True)
                file_path = os.path.join(upload_dir, f"{user_id}_{int(time.time())}_{file.filename}")
                file.save(file_path)

                image_pred = predict_image(file_path)
                if "predicted_class" in image_pred:
                    image_pred["predicted_disease"] = image_pred["predicted_class"]

                uploaded = UploadedImage(
                    user_id=user_id,
                    image_path=file_path,
                    image_type=validated.get("image_type", "general"),
                    processed_status="completed",
                )
                db.session.add(uploaded)
                db.session.flush()

            # Fuse Results
            fused = fuse_results(text_result=text_pred, image_result=image_pred)
            final_disease = fused.get("final_prediction", "Unknown")
            final_conf = fused.get("final_confidence", 0.0)

            advice = get_advice(final_conf, final_disease)

            diagnosis = DiagnosisHistory(
                user_id=user_id,
                symptom_text=validated.get("symptom_text", "Multimodal diagnosis"),
                structured_symptoms_json=validated,
                text_prediction=text_pred,
                image_prediction=image_pred,
                final_prediction=final_disease,
                confidence_score=final_conf,
                advice=advice,
            )

            if uploaded:
                diagnosis.uploaded_images.append(uploaded)

            db.session.add(diagnosis)
            db.session.commit()

            # Generate PDF
            user = db.session.get(User, user_id)
            generate_diagnosis_report(diagnosis, user)

            return jsonify({
                "success": True,
                "diagnosis_id": diagnosis.id,
                "final_diagnosis": {
                    "disease": final_disease,
                    "confidence": final_conf,
                    "method": fused.get("method", "unknown")
                },
                "text_prediction": text_pred,
                "image_prediction": image_pred,
                "fused_result": fused,
                "advice": advice,
                "report_url": f"/static/reports/diagnosis_{diagnosis.id}.pdf",
                "disclaimer": "This is an AI-assisted preliminary assessment for educational purposes only."
            }), 201

        except Exception as exc:
            db.session.rollback()
            ErrorLogger.log_error(exc, context="multimodal_diagnosis", user_id=user_id)
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass
            return jsonify({"error": "Multimodal diagnosis failed", "detail": str(exc)}), 500


# ====================== DOWNLOAD REPORT ======================
@diagnosis_bp.route("/report/<int:diagnosis_id>", methods=["GET"])
@jwt_required()
def download_report(diagnosis_id):
    """Download PDF report"""
    user_id = get_jwt_identity()
    diagnosis = DiagnosisHistory.query.filter_by(id=diagnosis_id, user_id=user_id).first()

    if not diagnosis:
        return jsonify({"error": "Report not found"}), 404

    report_path = f"app/static/reports/diagnosis_{diagnosis_id}.pdf"

    if not os.path.exists(report_path):
        user = db.session.get(User, user_id)
        report_path = generate_diagnosis_report(diagnosis, user)

    return send_file(report_path, as_attachment=True, download_name=f"DOC_AI_Report_{diagnosis_id}.pdf")


# ====================== DIAGNOSIS HISTORY ======================
@diagnosis_bp.route("/history", methods=["GET"])
@jwt_required()
def get_diagnosis_history():
    """Get user's diagnosis history with pagination"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)

    try:
        query = DiagnosisHistory.query.filter_by(user_id=user_id).order_by(DiagnosisHistory.created_at.desc())
        total = query.count()
        
        diagnoses = query.paginate(page=page, per_page=limit, error_out=False)
        
        return jsonify({
            "success": True,
            "data": [d.to_dict() for d in diagnoses.items],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
    except Exception as exc:
        ErrorLogger.log_error(exc, context="get_diagnosis_history", user_id=user_id)
        return jsonify({"error": "Failed to fetch history", "detail": str(exc)}), 500


@diagnosis_bp.route("/history/<int:diagnosis_id>", methods=["GET"])
@jwt_required()
def get_diagnosis_detail(diagnosis_id):
    """Get specific diagnosis details"""
    user_id = get_jwt_identity()
    
    try:
        diagnosis = DiagnosisHistory.query.filter_by(id=diagnosis_id, user_id=user_id).first()
        if not diagnosis:
            return jsonify({"error": "Diagnosis not found"}), 404
        
        return jsonify({
            "success": True,
            "data": diagnosis.to_dict()
        }), 200
    except Exception as exc:
        ErrorLogger.log_error(exc, context="get_diagnosis_detail", user_id=user_id)
        return jsonify({"error": "Failed to fetch diagnosis", "detail": str(exc)}), 500