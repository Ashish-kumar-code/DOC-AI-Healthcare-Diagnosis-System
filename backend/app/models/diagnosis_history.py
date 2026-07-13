from datetime import datetime
from ..extensions import db


class DiagnosisHistory(db.Model):
    __tablename__ = "diagnosis_history"
    __table_args__ = (
        db.Index('ix_diagnosis_user_created', 'user_id', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    symptom_text = db.Column(db.Text, nullable=False)
    structured_symptoms_json = db.Column(db.JSON, nullable=False)
    text_prediction = db.Column(db.JSON, nullable=True)
    image_prediction = db.Column(db.JSON, nullable=True)
    final_prediction = db.Column(db.String(256), nullable=True)
    confidence_score = db.Column(db.Float, nullable=True)
    advice = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True, index=True)

    user = db.relationship("User", back_populates="diagnosis_history")
    uploaded_images = db.relationship("UploadedImage", back_populates="diagnosis", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "symptom_text": self.symptom_text,
            "structured_symptoms_json": self.structured_symptoms_json,
            "text_prediction": self.text_prediction,
            "image_prediction": self.image_prediction,
            "final_prediction": self.final_prediction,
            "confidence_score": self.confidence_score,
            "advice": self.advice,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
        }
