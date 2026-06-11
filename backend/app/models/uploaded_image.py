from datetime import datetime
from ..extensions import db


class UploadedImage(db.Model):
    __tablename__ = "uploaded_images"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    diagnosis_id = db.Column(db.Integer, db.ForeignKey("diagnosis_history.id"), nullable=True, index=True)
    image_path = db.Column(db.String(512), nullable=False)
    image_type = db.Column(db.String(64), nullable=True)
    processed_status = db.Column(db.String(64), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", back_populates="uploaded_images")
    diagnosis = db.relationship("DiagnosisHistory", back_populates="uploaded_images")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "diagnosis_id": self.diagnosis_id,
            "image_path": self.image_path,
            "image_type": self.image_type,
            "processed_status": self.processed_status,
            "created_at": self.created_at.isoformat(),
        }
