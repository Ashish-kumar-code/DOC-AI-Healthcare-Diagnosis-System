from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .extensions import db, migrate, jwt
from .utils.error_handler import register_error_handlers
from .utils.logger import setup_logging, setup_request_logging
import logging


def create_app(config_class=Config):
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.from_object(config_class)

    # Setup logging
    logger = setup_logging(
        app_name="doc_ai",
        log_dir="logs",
        log_level=app.config.get('LOG_LEVEL', 'INFO'),
        console_output=app.config.get('DEBUG', False)
    )
    logger.info(f"DOC AI starting in {app.config.get('ENV', 'development')} mode")

    CORS(app, resources={"/api/*": {"origins": "*"}}, supports_credentials=True)

    # initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register error handlers
    register_error_handlers(app)

    # Setup request logging
    setup_request_logging(app)

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

    # register blueprints
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

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "message": "DOC AI backend healthy",
            "version": "1.0.0"
        }), 200

    logger.info("DOC AI initialized successfully")
    return app
