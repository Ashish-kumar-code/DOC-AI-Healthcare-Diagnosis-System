from datetime import datetime
from ..extensions import db


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    messages_json = db.Column(db.JSON, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", back_populates="chat_sessions")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "messages_json": self.messages_json,
            "summary": self.summary,
            "created_at": self.created_at.isoformat(),
        }
