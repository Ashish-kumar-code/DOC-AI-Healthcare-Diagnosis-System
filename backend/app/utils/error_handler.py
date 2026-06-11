"""
Enhanced error handling utilities for DOC AI.
Provides consistent error responses, custom exceptions, and error tracking.
"""

import traceback
import logging
from functools import wraps
from flask import jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception for API-specific errors."""
    
    def __init__(self, message, status_code=500, error_code=None, details=None):
        """
        Initialize APIError.
        
        Args:
            message: Error message shown to user
            status_code: HTTP status code (default 500)
            error_code: Machine-readable error code
            details: Additional error details for logging
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}


class ValidationError(APIError):
    """Raised when input validation fails."""
    def __init__(self, message, failed_field=None, value=None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details={"field": failed_field, "value": value}
        )


class AuthenticationError(APIError):
    """Raised when authentication fails."""
    def __init__(self, message):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_FAILED"
        )


class AuthorizationError(APIError):
    """Raised when user lacks permissions."""
    def __init__(self, message):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN"
        )


class NotFoundError(APIError):
    """Raised when resource not found."""
    def __init__(self, resource_type, resource_id=None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" (ID: {resource_id})"
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource_type}
        )


class ConflictError(APIError):
    """Raised on resource conflict."""
    def __init__(self, message, conflicting_field=None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details={"field": conflicting_field}
        )


class RateLimitError(APIError):
    """Raised when rate limit exceeded."""
    def __init__(self, message="Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED"
        )


class ServiceUnavailableError(APIError):
    """Raised when external service fails."""
    def __init__(self, service_name, retry_after=None):
        message = f"{service_name} is temporarily unavailable"
        super().__init__(
            message=message,
            status_code=503,
            error_code="SERVICE_UNAVAILABLE",
            details={"service": service_name, "retry_after": retry_after}
        )


def error_response(error):
    """
    Convert exception to JSON response.
    
    Args:
        error: Exception object
        
    Returns:
        Tuple of (dict, status_code)
    """
    if isinstance(error, APIError):
        response = {
            "error": {
                "code": error.error_code,
                "message": error.message,
                "details": error.details
            }
        }
        return response, error.status_code
    
    elif isinstance(error, HTTPException):
        response = {
            "error": {
                "code": "HTTP_ERROR",
                "message": error.description or str(error),
                "details": {}
            }
        }
        return response, error.code or 500
    
    else:
        # Log unexpected errors
        logger.error(f"Unexpected error: {str(error)}\n{traceback.format_exc()}")
        response = {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {}
            }
        }
        return response, 500


def handle_errors(f):
    """
    Decorator to handle errors in route handlers.
    Catches exceptions and returns JSON error responses.
    
    Usage:
        @app.route('/api/endpoint')
        @handle_errors
        def my_endpoint():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError as e:
            logger.warning(
                f"API Error: {e.error_code} - {e.message}",
                extra={"details": e.details}
            )
            response, status_code = error_response(e)
            return jsonify(response), status_code
        except HTTPException as e:
            response, status_code = error_response(e)
            return jsonify(response), status_code
        except Exception as e:
            logger.exception(f"Unhandled exception in {f.__name__}")
            response, status_code = error_response(e)
            return jsonify(response), status_code
    
    return decorated_function


def register_error_handlers(app):
    """
    Register error handlers with Flask app.
    
    Args:
        app: Flask application instance
    """
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response, status_code = error_response(error)
        return jsonify(response), status_code
    
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        response, status_code = error_response(error)
        return jsonify(response), status_code
    
    @app.errorhandler(404)
    def handle_404(error):
        response = {
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested resource was not found",
                "details": {"path": request.path}
            }
        }
        return jsonify(response), 404
    
    @app.errorhandler(500)
    def handle_500(error):
        logger.error(f"500 Error: {error}")
        response = {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred",
                "details": {}
            }
        }
        return jsonify(response), 500
