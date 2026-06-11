"""
Admin and debug endpoints for DOC AI.
Exposed only in development; protect with authentication in production.
"""

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from sqlalchemy import text
import psutil
import os
import sys
import joblib
from datetime import datetime

from app.models import User, DiagnosisHistory, UploadedImage, ChatSession, NearbySearchCache
from app.extensions import db
from app.utils.error_handler import handle_errors, AuthorizationError
from app.utils.rate_limiter import rate_limit
from ..ml.text_model import train_text_model, MODEL_PATH as TEXT_MODEL_PATH
from ..ml.image_model import train_image_model, MODEL_PATH as IMAGE_MODEL_PATH

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def require_admin(f):
    """Decorator to require admin role."""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In development, allow all. In production, check admin flag
        if not current_app.config.get('DEBUG'):
            # Would check user.is_admin flag here
            raise AuthorizationError("Admin access required")
        return f(*args, **kwargs)
    return decorated_function


# ============================================================
# System Health & Monitoring
# ============================================================

@admin_bp.route('/health', methods=['GET'])
@handle_errors
def system_health():
    """Get comprehensive system health status."""
    
    try:
        # CPU and memory
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        
        # Disk
        disk = psutil.disk_usage('/')
        
        # Database connectivity
        db_status = "ok"
        try:
            db.session.execute(text('SELECT 1'))
            db.session.commit()
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        # Get counts
        user_count = db.session.query(User).count()
        diagnosis_count = db.session.query(DiagnosisHistory).count()
        
        return jsonify({
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_gb": memory.available / (1024**3),
                "disk_percent": disk.percent,
                "disk_free_gb": disk.free / (1024**3)
            },
            "database": {
                "status": db_status,
                "users": user_count,
                "diagnoses": diagnosis_count,
                "images": db.session.query(UploadedImage).count(),
                "chats": db.session.query(ChatSession).count(),
                "location_cache": db.session.query(NearbySearchCache).count()
            },
            "application": {
                "version": "1.0.0",
                "environment": current_app.config.get('ENV'),
                "debug": current_app.config.get('DEBUG')
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@admin_bp.route('/metrics', methods=['GET'])
@handle_errors
def get_metrics():
    """Get application metrics."""
    
    # User metrics
    total_users = db.session.query(User).count()
    users_today = db.session.query(User).filter(
        User.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    
    # Diagnosis metrics
    total_diagnoses = db.session.query(DiagnosisHistory).count()
    diagnoses_today = db.session.query(DiagnosisHistory).filter(
        DiagnosisHistory.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    
    # Average confidence
    from sqlalchemy import func
    avg_confidence = db.session.query(
        func.avg(DiagnosisHistory.confidence_score)
    ).scalar() or 0
    
    return jsonify({
        "users": {
            "total": total_users,
            "today": users_today
        },
        "diagnoses": {
            "total": total_diagnoses,
            "today": diagnoses_today,
            "avg_confidence": float(avg_confidence)
        },
        "performance": {
            "uptime_seconds": datetime.utcnow().timestamp() - datetime.utcnow().timestamp()
        }
    }), 200


@admin_bp.route('/models/status', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def model_status():
    """Return current model training status."""
    text_path = os.getenv('TEXT_MODEL_PATH', TEXT_MODEL_PATH)
    image_path = os.getenv('IMAGE_MODEL_PATH', IMAGE_MODEL_PATH)

    text_status = 'untrained'
    text_accuracy = None
    if os.path.exists(text_path):
        text_status = 'trained'
        try:
            model_data = joblib.load(text_path)
            text_accuracy = model_data.get('accuracy')
        except Exception:
            text_accuracy = None

    image_status = 'trained' if os.path.exists(image_path) else 'untrained'

    return jsonify({
        'text_model': {
            'status': text_status,
            'accuracy': text_accuracy
        },
        'image_model': {
            'status': image_status
        }
    }), 200


@admin_bp.route('/models/train/text', methods=['POST'])
@jwt_required()
@require_admin
@handle_errors
def train_text_model_endpoint():
    """Train or reload the text diagnosis model."""
    request_data = request.get_json(silent=True) or {}
    force_retrain = str(request.args.get('force', request_data.get('force', False))).lower() in ('true', '1', 'yes')

    result = train_text_model(force_retrain=force_retrain)

    return jsonify({
        'status': 'success',
        'model': 'text',
        'result': result,
        'message': 'Text model training completed successfully.'
    }), 200


@admin_bp.route('/models/train/image', methods=['POST'])
@jwt_required()
@require_admin
@handle_errors
def train_image_model_endpoint():
    """Train or reload the image classification model."""
    request_data = request.get_json(silent=True) or {}
    epochs = int(request_data.get('epochs', request.args.get('epochs', 5)))
    train_dir = os.getenv('IMAGE_TRAIN_DIR', 'datasets/images/train')

    result = train_image_model(train_dir=train_dir, epochs=epochs)

    return jsonify({
        'status': 'success',
        'model': 'image',
        'result': result,
        'message': 'Image model training completed successfully.'
    }), 200


@admin_bp.route('/models/train/all', methods=['POST'])
@jwt_required()
@require_admin
@handle_errors
def train_all_models_endpoint():
    """Train both the text and image models."""
    request_data = request.get_json(silent=True) or {}
    epochs = int(request_data.get('epochs', request.args.get('epochs', 5)))
    train_dir = os.getenv('IMAGE_TRAIN_DIR', 'datasets/images/train')

    text_result = train_text_model(force_retrain=True)
    image_result = train_image_model(train_dir=train_dir, epochs=epochs)

    return jsonify({
        'status': 'success',
        'model': 'all',
        'result': {
            'text': text_result,
            'image': image_result
        },
        'message': 'All models retrained successfully.'
    }), 200


# ============================================================
# Database Management
# ============================================================

@admin_bp.route('/db/info', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def db_info():
    """Get database information."""
    
    from app.extensions import db
    
    # Get database URL (hide password)
    db_url = str(current_app.config.get('SQLALCHEMY_DATABASE_URI'))
    if '@' in db_url:
        db_url = db_url.split('@')[0] + '@***:***@' + db_url.split('@')[1]
    
    return jsonify({
        "database_url": db_url,
        "engine": db.engine.dialect.name,
        "tables": list(db.metadata.tables.keys()),
        "row_counts": {
            table: db.session.query(model).count()
            for table, model in [
                ('users', User),
                ('diagnosis_history', DiagnosisHistory),
                ('uploaded_images', UploadedImage),
                ('chat_sessions', ChatSession),
                ('nearby_search_cache', NearbySearchCache)
            ]
        }
    }), 200


@admin_bp.route('/db/reset', methods=['POST'])
@jwt_required()
@require_admin
@handle_errors
def reset_database():
    """
    Reset database (development only).
    WARNING: Deletes all data!
    """
    
    if not current_app.config.get('DEBUG'):
        raise AuthorizationError("Database reset only allowed in development")
    
    try:
        # Clear all tables
        for model in [DiagnosisHistory, UploadedImage, ChatSession, NearbySearchCache, User]:
            db.session.query(model).delete()
        
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Database reset successfully"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@admin_bp.route('/db/backup', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def backup_database():
    """Create database backup."""
    
    import shutil
    from datetime import datetime
    
    backup_dir = 'backups'
    os.makedirs(backup_dir, exist_ok=True)
    
    db_file = current_app.config.get('SQLALCHEMY_DATABASE_URI', '').replace('sqlite:///', '')
    
    if not os.path.exists(db_file):
        return jsonify({"error": "SQLite database file not found"}), 404
    
    backup_file = os.path.join(
        backup_dir,
        f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    )
    
    try:
        shutil.copy2(db_file, backup_file)
        return jsonify({
            "status": "success",
            "backup_file": backup_file,
            "size_mb": os.path.getsize(backup_file) / (1024*1024)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# Configuration & Environment
# ============================================================

@admin_bp.route('/config', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def get_config():
    """Get application configuration (sensitive values masked)."""
    
    config = {}
    
    for key, value in current_app.config.items():
        # Mask sensitive values
        if any(s in key.upper() for s in ['SECRET', 'PASSWORD', 'KEY', 'TOKEN']):
            value = '***' if value else None
        
        config[key] = value
    
    return jsonify(config), 200


@admin_bp.route('/env', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def get_environment():
    """Get environment information."""
    
    return jsonify({
        "python_version": sys.version,
        "platform": sys.platform,
        "cwd": os.getcwd(),
        "env_vars": {
            k: v if 'SECRET' not in k.upper() else '***'
            for k, v in os.environ.items()
            if k.startswith('DOCAI_') or k.startswith('FLASK_')
        }
    }), 200


# ============================================================
# User Management
# ============================================================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def list_users():
    """List all users with basic info."""
    
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    
    users = User.query.paginate(page=page, per_page=limit)
    
    return jsonify({
        "total": users.total,
        "page": page,
        "pages": users.pages,
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "age": u.age,
                "created_at": u.created_at.isoformat(),
                "diagnosis_count": len(u.diagnosis_history)
            }
            for u in users.items
        ]
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def get_user_details(user_id):
    """Get detailed user information."""
    
    user = User.query.get_or_404(user_id)
    
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "age": user.age,
        "gender": user.gender,
        "created_at": user.created_at.isoformat(),
        "diagnosis_history": [
            {
                "id": d.id,
                "prediction": d.final_prediction,
                "confidence": d.confidence_score,
                "created_at": d.created_at.isoformat()
            }
            for d in user.diagnosis_history
        ],
        "chat_sessions": len(user.chat_sessions),
        "uploaded_images": len(user.uploaded_images)
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_admin
@handle_errors
def delete_user(user_id):
    """Delete user and related data."""
    
    if not current_app.config.get('DEBUG'):
        raise AuthorizationError("User deletion only allowed in development")
    
    user = User.query.get_or_404(user_id)
    
    try:
        db.session.delete(user)  # Cascade deletes related records
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": f"User {user_id} deleted"
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================================
# Diagnosis Analytics
# ============================================================

@admin_bp.route('/diagnoses/stats', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def diagnosis_stats():
    """Get diagnosis statistics."""
    
    from sqlalchemy import func
    
    total = DiagnosisHistory.query.count()
    
    # Most common predictions
    top_predictions = db.session.query(
        DiagnosisHistory.final_prediction,
        func.count(DiagnosisHistory.id).label('count')
    ).group_by(DiagnosisHistory.final_prediction).limit(10).all()
    
    # Average confidence by prediction
    avg_confidence = db.session.query(
        DiagnosisHistory.final_prediction,
        func.avg(DiagnosisHistory.confidence_score).label('avg_confidence')
    ).group_by(DiagnosisHistory.final_prediction).all()
    
    return jsonify({
        "total_diagnoses": total,
        "top_predictions": {
            pred: count for pred, count in top_predictions
        },
        "avg_confidence_by_prediction": {
            pred: float(conf) for pred, conf in avg_confidence
        }
    }), 200


# ============================================================
# Rate Limiter Status
# ============================================================

@admin_bp.route('/rate-limits', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
def get_rate_limits():
    """Get current rate limiter status."""
    
    from app.utils.rate_limiter import get_limiter
    
    limiter = get_limiter()
    
    return jsonify({
        "total_clients": len(limiter.requests),
        "policies": {
            "strict": "10/min",
            "normal": "100/min",
            "permissive": "1000/min",
            "auth": "5/min",
            "ml": "20/5min"
        }
    }), 200


# ============================================================
# Debug Endpoints
# ============================================================

@admin_bp.route('/logs', methods=['GET'])
@jwt_required()
@require_admin
@handle_errors
@rate_limit(max_requests=50, window_seconds=60)
def get_logs():
    """Get recent log entries."""
    
    lines = request.args.get('lines', 100, type=int)
    log_file = 'logs/doc_ai.log'
    
    if not os.path.exists(log_file):
        return jsonify({"logs": []}), 200
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:]
        
        return jsonify({"logs": recent_lines}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/ping', methods=['GET'])
def ping():
    """Simple health check endpoint."""
    return jsonify({"status": "pong", "timestamp": datetime.utcnow().isoformat()}), 200


@admin_bp.route('/routes', methods=['GET'])
@handle_errors
def list_routes():
    """List all available routes."""
    
    routes = []
    
    for rule in current_app.url_map.iter_rules():
        routes.append({
            "endpoint": rule.endpoint,
            "methods": list(rule.methods),
            "path": str(rule)
        })
    
    return jsonify({"routes": sorted(routes, key=lambda x: x['path'])}), 200
