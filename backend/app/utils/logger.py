"""
Structured logging setup for DOC AI 
"""

import logging
import logging.handlers
import os
import sys
from pathlib import Path

def setup_logging(app_name: str = "doc_ai", 
                 log_dir: str = "logs",
                 log_level: str = "INFO",
                 console_output: bool = True) -> logging.Logger:
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    logger.handlers.clear()

    log_format = (
        '[%(asctime)s] [%(name)s] [%(levelname)s] '
        '[%(filename)s:%(lineno)d in %(funcName)s()] '
        '%(message)s'
    )
    formatter = logging.Formatter(log_format)

    # Main log file
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Error-only log
    error_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, f"{app_name}_errors.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)

    # Console
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    # Attach Request ID filter to ALL handlers
    request_filter = RequestIdFilter()
    for handler in logger.handlers:
        handler.addFilter(request_filter)

    # Suppress noisy libraries
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('flask').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy').setLevel(logging.WARNING)

    return logger


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        try:
            from flask import g
            record.request_id = getattr(g, 'request_id', 'N/A')
        except (RuntimeError, AttributeError):
            record.request_id = 'N/A'
        return True


def setup_request_logging(app):
    @app.before_request
    def before_request():
        from flask import g, request
        import uuid
        g.request_id = str(uuid.uuid4())[:8]
        get_logger('doc_ai.request').info(f"Incoming: {request.method} {request.path}")

    @app.after_request
    def after_request(response):
        from flask import g, request
        logger = get_logger('doc_ai.request')
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(level, f"Response: {request.method} {request.path} -> {response.status_code}")
        return response


class PerformanceLogger:
    @staticmethod
    def log_operation(operation_name: str, duration_ms: float, status: str = "success", **kwargs):
        logger = get_logger('doc_ai.performance')
        msg = f"Operation: {operation_name} | Duration: {duration_ms:.2f}ms | Status: {status}"
        if kwargs:
            msg += " | " + " | ".join(f"{k}={v}" for k, v in kwargs.items())
        logger.warning(msg) if duration_ms > 1000 else logger.info(msg)

    @staticmethod
    def log_db_query(query: str, duration_ms: float):
        logger = get_logger('doc_ai.database')
        logger.warning(f"Slow DB query ({duration_ms:.2f}ms): {query[:150]}...") if duration_ms > 500 else logger.debug(f"DB query ({duration_ms:.2f}ms)")


class ErrorLogger:
    @staticmethod
    def log_error(error: Exception, context: str = None, user_id: int = None):
        get_logger('doc_ai.errors').exception(f"Error in {context or 'unknown'}: {str(error)}")

    @staticmethod
    def log_auth_failure(reason: str, user_email: str = None):
        msg = f"Authentication failed: {reason}"
        if user_email:
            msg += f" | Email: {user_email}"
        get_logger('doc_ai.security').warning(msg)

    @staticmethod
    def log_validation_error(field: str, value: str, reason: str):
        get_logger('doc_ai.validation').warning(f"Validation error - Field: {field} | Reason: {reason}")


class Timer:
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None

    def __enter__(self):
        from time import time
        self.start_time = time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        from time import time
        duration_ms = (time() - self.start_time) * 1000
        status = "error" if exc_type else "success"
        PerformanceLogger.log_operation(self.operation_name, duration_ms, status)
        return False


class BatchLogger:
    def __init__(self, batch_size: int = 100):
        self.batch_size = batch_size
        self.queue = []

    def add(self, message: str, level: str = 'INFO'):
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