"""
Rate limiting implementation for DOC AI.
Uses in-memory storage for simplicity; upgrade to Redis for production.
"""

import time
from functools import wraps
from collections import defaultdict
from flask import request, jsonify, current_app
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self):
        """Initialize rate limiter with empty state."""
        self.requests = defaultdict(list)  # {client_id: [timestamp, ...]}
        self.cleanup_threshold = 1000
        self.request_count = 0
    
    def get_client_id(self):
        """Get unique client identifier (JWT user or IP)."""
        from flask_jwt_extended import get_jwt_identity
        try:
            identity = get_jwt_identity()
            if identity:
                return f"user_{identity}"
        except:
            pass
        
        # Fallback to IP
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        return request.remote_addr or 'unknown'
    
    def is_allowed(self, client_id: str, max_requests: int, 
                  window_seconds: int) -> tuple:
        """
        Check if request is allowed under rate limit.
        Matches the existing test expectation (remaining decreases after first request).
        """
        now = time.time()
        cutoff_time = now - window_seconds
        
        # Clean old timestamps
        self.requests[client_id] = [
            ts for ts in self.requests[client_id] if ts > cutoff_time
        ]
        
        current_count = len(self.requests[client_id])
        
        # Allow if under limit
        allowed = current_count < max_requests
        
        if allowed:
            self.requests[client_id].append(now)
        
        # IMPORTANT CHANGE: remaining decreases immediately after allowing the request
        # This makes first request return remaining = 9 when limit=10
        remaining = max(0, max_requests - (current_count + 1))
        
        # Calculate reset time
        reset_in = 0
        if self.requests[client_id]:
            reset_in = int(self.requests[client_id][0] + window_seconds - now) + 1
        
        # Periodic cleanup
        self.request_count += 1
        if self.request_count % self.cleanup_threshold == 0:
            self._cleanup_old_clients()
        
        return allowed, remaining, reset_in
    
    def _cleanup_old_clients(self):
        """Remove inactive clients to prevent memory leak."""
        now = time.time()
        cutoff_time = now - 3600
        
        expired_clients = [
            cid for cid, ts_list in self.requests.items()
            if all(t < cutoff_time for t in ts_list)
        ]
        
        for cid in expired_clients:
            del self.requests[cid]
        
        if expired_clients:
            logger.debug(f"Cleaned up {len(expired_clients)} inactive clients")


# Global instance
_limiter = RateLimiter()


def rate_limit(max_requests: int = 100, window_seconds: int = 60, 
               error_message: str = None):
    """Rate limit decorator."""
    default_message = f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds."
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Skip rate limiting if disabled in config
            if not current_app.config.get('RATELIMIT_ENABLED', True):
                return f(*args, **kwargs)
            
            client_id = _limiter.get_client_id()
            allowed, remaining, reset_in = _limiter.is_allowed(
                client_id, max_requests, window_seconds
            )
            
            if not allowed:
                logger.warning(f"Rate limit exceeded for {client_id} on {request.path}")
                response = {
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": error_message or default_message,
                        "details": {
                            "retry_after": reset_in,
                            "limit": max_requests,
                            "window": window_seconds
                        }
                    }
                }
                return jsonify(response), 429
            
            # Call original function and add headers
            response = f(*args, **kwargs)
            
            # If response is tuple (body, status), convert to Response object
            if isinstance(response, tuple):
                body, status = response
                from flask import make_response
                response_obj = make_response(body, status)
            else:
                from flask import make_response
                response_obj = make_response(response)
            
            response_obj.headers['X-RateLimit-Limit'] = str(max_requests)
            response_obj.headers['X-RateLimit-Remaining'] = str(remaining)
            response_obj.headers['X-RateLimit-Reset'] = str(int(time.time()) + reset_in)
            
            return response_obj
        
        return decorated_function
    return decorator


# Pre-configured policies
POLICIES = {
    'strict': {'max_requests': 10, 'window_seconds': 60},
    'normal': {'max_requests': 100, 'window_seconds': 60},
    'permissive': {'max_requests': 1000, 'window_seconds': 60},
    'auth': {'max_requests': 5, 'window_seconds': 60},      # Important for login test
    'ml': {'max_requests': 20, 'window_seconds': 300},
}


def get_limiter():
    """Get global rate limiter instance."""
    return _limiter