from datetime import datetime
from ..extensions import db


class NearbySearchCache(db.Model):
    __tablename__ = "nearby_search_cache"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    latitude = db.Column(db.Float, nullable=False, index=True)
    longitude = db.Column(db.Float, nullable=False, index=True)
    search_type = db.Column(db.String(64), nullable=False)
    response_json = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", back_populates="nearby_queries")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "search_type": self.search_type,
            "response_json": self.response_json,
            "created_at": self.created_at.isoformat(),
        }
