"""
Structured logging for DOC AI.
Supports both human-readable (development) and JSON (production) formats.
"""

import json
import logging
import logging.handlers
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from time import time


class JSONFormatter(logging.Formatter):
    """JSON log formatter for production — machine-parseable by log aggregators (ELK, Datadog, etc.)."""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request context if available
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'duration_ms'):
            log_entry["duration_ms"] = record.duration_ms
        if hasattr(record, 'status_code'):
            log_entry["status_code"] = record.status_code
        if hasattr(record, 'method'):
            log_entry["method"] = record.method
        if hasattr(record, 'path'):
            log_entry["path"] = record.path

        # Add exception info
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        # Add extra fields
        for key in ('details', 'event_type', 'component', 'operation'):
            if hasattr(record, key):
                log_entry[key] = getattr(record, key)

        return json.dumps(log_entry, default=str)


class RequestIdFilter(logging.Filter):
    """Injects Flask request context (request_id, user_id) into log records."""

    def filter(self, record):
        try:
            from flask import g
            record.request_id = getattr(g, 'request_id', 'N/A')
            record.user_id = getattr(g, 'user_id', None)
        except (RuntimeError, AttributeError):
            record.request_id = 'N/A'
            record.user_id = None
        return True


def setup_logging(app_name="doc_ai", log_dir="logs",
                  log_level="INFO", console_output=True,
                  json_format=None):
    """
    Configure structured logging.

    Args:
        app_name: Logger namespace
        log_dir: Directory for log files
        log_level: Minimum log level
        console_output: Enable console output
        json_format: Force JSON format. If None, auto-detect from FLASK_ENV.
    """
    Path(log_dir).mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    logger.handlers.clear()

    # Auto-detect JSON format for production
    if json_format is None:
        json_format = os.getenv('FLASK_ENV', 'development') == 'production'

    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '[%(asctime)s] [%(name)s] [%(levelname)s] '
            '[%(filename)s:%(lineno)d] [req:%(request_id)s] '
            '%(message)s'
        )

    request_filter = RequestIdFilter()

    # Main log file (rotating)
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}.log"),
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=10,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.addFilter(request_filter)
    logger.addHandler(file_handler)

    # Error-only log file
    error_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_errors.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    error_handler.addFilter(request_filter)
    logger.addHandler(error_handler)

    # Audit log file (security events)
    audit_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_audit.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding='utf-8'
    )
    audit_handler.setLevel(logging.INFO)
    audit_handler.setFormatter(formatter)
    audit_handler.addFilter(request_filter)
    audit_logger = logging.getLogger(f"{app_name}.audit")
    audit_logger.addHandler(audit_handler)
    audit_logger.setLevel(logging.INFO)

    # Console output
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.addFilter(request_filter)
        logger.addHandler(console_handler)

    # Suppress noisy libraries
    for lib in ('werkzeug', 'flask', 'sqlalchemy', 'urllib3', 'tensorflow'):
        logging.getLogger(lib).setLevel(logging.WARNING)

    return logger


def get_logger(name):
    """Get a named logger."""
    return logging.getLogger(name)


def setup_request_logging(app):
    """Setup request lifecycle logging with timing and request ID propagation."""

    @app.before_request
    def before_request():
        from flask import g, request
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4())[:8])
        g.request_start_time = time()

        # Extract user ID from JWT if present
        try:
            from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            g.user_id = get_jwt_identity()
        except Exception:
            g.user_id = None

        get_logger('doc_ai.request').info(
            f"Incoming: {request.method} {request.path}",
            extra={'method': request.method, 'path': request.path}
        )

    @app.after_request
    def after_request(response):
        from flask import g, request

        # Calculate duration
        duration_ms = 0
        if hasattr(g, 'request_start_time'):
            duration_ms = (time() - g.request_start_time) * 1000

        # Propagate request ID in response header
        request_id = getattr(g, 'request_id', 'N/A')
        response.headers['X-Request-ID'] = request_id

        # Log with structured context
        logger = get_logger('doc_ai.request')
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            level,
            f"{request.method} {request.path} -> {response.status_code} ({duration_ms:.1f}ms)",
            extra={
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration_ms, 2),
            }
        )

        return response


class PerformanceLogger:
    """Log performance metrics for operations."""

    @staticmethod
    def log_operation(operation_name, duration_ms, status="success", **kwargs):
        logger = get_logger('doc_ai.performance')
        extra = {'operation': operation_name, 'duration_ms': round(duration_ms, 2), **kwargs}
        msg = f"Operation: {operation_name} | Duration: {duration_ms:.2f}ms | Status: {status}"
        if kwargs:
            msg += " | " + " | ".join(f"{k}={v}" for k, v in kwargs.items())
        if duration_ms > 1000:
            logger.warning(msg, extra=extra)
        else:
            logger.info(msg, extra=extra)

    @staticmethod
    def log_db_query(query, duration_ms):
        logger = get_logger('doc_ai.database')
        if duration_ms > 500:
            logger.warning(f"Slow DB query ({duration_ms:.2f}ms): {query[:150]}...",
                           extra={'duration_ms': round(duration_ms, 2), 'operation': 'db_query'})
        else:
            logger.debug(f"DB query ({duration_ms:.2f}ms)",
                         extra={'duration_ms': round(duration_ms, 2)})

    @staticmethod
    def log_ml_inference(model_name, duration_ms, confidence=None, prediction=None):
        """Log ML model inference metrics."""
        logger = get_logger('doc_ai.ml')
        extra = {
            'operation': 'ml_inference',
            'component': model_name,
            'duration_ms': round(duration_ms, 2),
        }
        if confidence is not None:
            extra['confidence'] = confidence
        if prediction is not None:
            extra['prediction'] = prediction
        logger.info(
            f"ML Inference: {model_name} | {duration_ms:.1f}ms | confidence={confidence}",
            extra=extra
        )


class ErrorLogger:
    """Log errors with structured context."""

    @staticmethod
    def log_error(error, context=None, user_id=None):
        get_logger('doc_ai.errors').exception(
            f"Error in {context or 'unknown'}: {str(error)}",
            extra={'component': context, 'user_id': user_id}
        )

    @staticmethod
    def log_auth_failure(reason, user_email=None):
        msg = f"Authentication failed: {reason}"
        extra = {'event_type': 'auth_failure'}
        if user_email:
            msg += f" | Email: {user_email}"
            extra['email'] = user_email
        get_logger('doc_ai.security').warning(msg, extra=extra)

    @staticmethod
    def log_validation_error(field, value, reason):
        get_logger('doc_ai.validation').warning(
            f"Validation error - Field: {field} | Reason: {reason}",
            extra={'event_type': 'validation_error', 'details': {'field': field}}
        )


class AuditLogger:
    """Audit logger for security-sensitive operations."""

    @staticmethod
    def log(event_type, user_id=None, details=None, severity="INFO"):
        """Log an audit event."""
        logger = get_logger('doc_ai.audit')
        extra = {
            'event_type': event_type,
            'user_id': user_id,
            'details': details or {},
        }
        level = getattr(logging, severity.upper(), logging.INFO)
        logger.log(level, f"AUDIT: {event_type}", extra=extra)

    @staticmethod
    def log_login(user_id, email, success=True, ip_address=None):
        AuditLogger.log(
            'user_login' if success else 'user_login_failed',
            user_id=user_id,
            details={'email': email, 'ip': ip_address, 'success': success},
            severity='INFO' if success else 'WARNING'
        )

    @staticmethod
    def log_admin_access(user_id, action, resource=None):
        AuditLogger.log(
            'admin_access',
            user_id=user_id,
            details={'action': action, 'resource': resource},
            severity='INFO'
        )

    @staticmethod
    def log_data_export(user_id, export_type, record_count=None):
        AuditLogger.log(
            'data_export',
            user_id=user_id,
            details={'export_type': export_type, 'record_count': record_count},
            severity='INFO'
        )


class Timer:
    """Context manager for timing operations."""

    def __init__(self, operation_name, component=None):
        self.operation_name = operation_name
        self.component = component
        self.start_time = None
        self.duration_ms = None

    def __enter__(self):
        self.start_time = time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration_ms = (time() - self.start_time) * 1000
        status = "error" if exc_type else "success"
        PerformanceLogger.log_operation(
            self.operation_name, self.duration_ms, status,
            component=self.component or ''
        )
        return False


class BatchLogger:
    """Batch logger for high-frequency events."""

    def __init__(self, batch_size=100):
        self.batch_size = batch_size
        self.queue = []

    def add(self, message, level='INFO'):
        self.queue.append((message, level))
        if len(self.queue) >= self.batch_size:
            self.flush()

    def flush(self):
        if not self.queue:
            return
        logger = get_logger('doc_ai')
        for message, level in self.queue:
            logger.log(getattr(logging, level.upper(), logging.INFO), message)
        self.queue.clear()