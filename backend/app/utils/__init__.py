"""
Utility modules for DOC AI.
"""

from .error_handler import (
    APIError, ValidationError, AuthenticationError, 
    AuthorizationError, NotFoundError, ConflictError,
    RateLimitError, ServiceUnavailableError,
    error_response, handle_errors, register_error_handlers
)

from .sanitizer import (
    InputSanitizer, SanitizationError, validate_file_upload
)

from .rate_limiter import (
    RateLimiter, rate_limit, get_limiter, POLICIES
)

from .logger import (
    setup_logging, get_logger, RequestIdFilter,
    setup_request_logging, PerformanceLogger, ErrorLogger,
    Timer, BatchLogger
)

__all__ = [
    'APIError', 'ValidationError', 'AuthenticationError',
    'AuthorizationError', 'NotFoundError', 'ConflictError',
    'RateLimitError', 'ServiceUnavailableError',
    'error_response', 'handle_errors', 'register_error_handlers',
    'InputSanitizer', 'SanitizationError', 'validate_file_upload',
    'RateLimiter', 'rate_limit', 'get_limiter', 'POLICIES',
    'setup_logging', 'get_logger', 'RequestIdFilter',
    'setup_request_logging', 'PerformanceLogger', 'ErrorLogger',
    'Timer', 'BatchLogger'
]
