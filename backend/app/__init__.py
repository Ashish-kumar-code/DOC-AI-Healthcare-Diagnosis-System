from flask import Flask, jsonify, request as flask_request
from flask_cors import CORS
from .config import Config
from .extensions import db, migrate, jwt
from .utils.error_handler import register_error_handlers
from .utils.logger import setup_logging, setup_request_logging
from .utils.metrics import setup_metrics_middleware, MetricsCollector
import logging
import os


def create_app(config_class=Config):
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object(config_class)

    # Setup logging
    logger = setup_logging(
        app_name="doc_ai",
        log_dir=app.config.get('LOG_DIR', 'logs'),
        log_level=app.config.get('LOG_LEVEL', 'INFO'),
        console_output=app.config.get('DEBUG', False)
    )
    logger.info(f"DOC AI starting in {app.config.get('ENV', 'development')} mode")

    allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    CORS(app, resources={"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register error handlers
    register_error_handlers(app)

    # Setup request logging
    setup_request_logging(app)

    # Setup metrics collection
    metrics = setup_metrics_middleware(app)

    # Security headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return jsonify({"error": "Missing authorization header"}), 401

    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return jsonify({"error": "Invalid token"}), 422

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.diagnosis import diagnosis_bp
    from .routes.chat import chat_bp
    from .routes.location import location_bp
    from .routes.report import report_bp
    from .routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(diagnosis_bp, url_prefix="/api/diagnosis")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(location_bp, url_prefix="/api/location")
    app.register_blueprint(report_bp, url_prefix="/api/report")
    app.register_blueprint(admin_bp)

    # ---- Health & Readiness Probes ----

    @app.route("/api/health")
    def health_liveness():
        """Liveness probe — is the process running?"""
        return jsonify({
            "status": "ok",
            "message": "DOC AI backend alive",
            "version": "2.0.0",
            "uptime": MetricsCollector().get_uptime_seconds(),
        }), 200

    @app.route("/api/health/ready")
    def health_readiness():
        """Readiness probe — can the app serve traffic? Checks DB connectivity."""
        checks = {}
        overall_ok = True

        # Database check
        try:
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            db.session.commit()
            checks["database"] = {"status": "ok"}
        except Exception as e:
            checks["database"] = {"status": "error", "message": str(e)}
            overall_ok = False

        # ML model check — text model
        try:
            text_model_path = app.config.get('TEXT_MODEL_PATH', 'app/ml/text_model.joblib')
            checks["text_model"] = {
                "status": "ok" if os.path.exists(text_model_path) else "missing"
            }
        except Exception:
            checks["text_model"] = {"status": "error"}

        # ML model check — image model
        try:
            image_model_path = os.getenv('IMAGE_MODEL_PATH', 'app/ml/image_model.h5')
            checks["image_model"] = {
                "status": "ok" if os.path.exists(image_model_path) else "missing"
            }
        except Exception:
            checks["image_model"] = {"status": "error"}

        # Disk space check
        try:
            import shutil
            total, used, free = shutil.disk_usage('/')
            free_gb = free / (1024**3)
            checks["disk"] = {
                "status": "ok" if free_gb > 1.0 else "warning",
                "free_gb": round(free_gb, 2)
            }
            if free_gb < 0.5:
                checks["disk"]["status"] = "critical"
                overall_ok = False
        except Exception:
            checks["disk"] = {"status": "unknown"}

        status_code = 200 if overall_ok else 503
        return jsonify({
            "status": "ready" if overall_ok else "not_ready",
            "checks": checks,
            "version": "2.0.0",
        }), status_code

    @app.route("/api/health/metrics")
    def health_metrics():
        """Application metrics endpoint (JSON)."""
        return jsonify(MetricsCollector().get_summary()), 200

    @app.route("/api/health/metrics/prometheus")
    def health_metrics_prometheus():
        """Prometheus-compatible metrics endpoint."""
        from flask import Response
        return Response(
            MetricsCollector().get_prometheus_text(),
            mimetype="text/plain; version=0.0.4; charset=utf-8"
        )

    logger.info("DOC AI initialized successfully")
    return app
