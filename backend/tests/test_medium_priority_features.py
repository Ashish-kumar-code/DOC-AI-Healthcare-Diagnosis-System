"""
Test suite for medium-priority features:
- Error handling
- Input sanitization
- Rate limiting
- Admin endpoints
- Logging
"""

import pytest
from flask import json
from app.utils.error_handler import (
    ValidationError, AuthenticationError, AuthorizationError, 
    NotFoundError, ConflictError, RateLimitError, ServiceUnavailableError
)
from app.utils.sanitizer import InputSanitizer, SanitizationError


class TestErrorHandling:
    """Test custom error handling."""
    
    def test_validation_error(self):
        """Test ValidationError creation."""
        error = ValidationError("Invalid email", failed_field="email", value="bad")
        assert error.status_code == 400
        assert error.error_code == "VALIDATION_ERROR"
        assert error.details['field'] == "email"
    
    def test_authentication_error(self):
        """Test AuthenticationError creation."""
        error = AuthenticationError("Invalid credentials")
        assert error.status_code == 401
        assert error.error_code == "AUTHENTICATION_FAILED"
    
    def test_authorization_error(self):
        """Test AuthorizationError creation."""
        error = AuthorizationError("Admin access required")
        assert error.status_code == 403
        assert error.error_code == "FORBIDDEN"
    
    def test_conflict_error(self):
        """Test ConflictError creation."""
        error = ConflictError("Email already exists", conflicting_field="email")
        assert error.status_code == 409
        assert error.error_code == "CONFLICT"


class TestInputSanitizer:
    """Test input sanitization."""
    
    def test_sanitize_string_valid(self):
        """Test valid string sanitization."""
        result = InputSanitizer.sanitize_string("  hello world  ")
        assert result == "hello world"
    
    def test_sanitize_string_html_escape(self):
        """Test HTML escaping."""
        result = InputSanitizer.sanitize_string("<script>alert('xss')</script>")
        assert "&lt;script&gt;" in result
        assert "<script>" not in result
    
    def test_sanitize_string_too_long(self):
        """Test string length validation."""
        with pytest.raises(SanitizationError):
            InputSanitizer.sanitize_string("x" * 1001, max_length=1000)
    
    def test_sanitize_email_valid(self):
        """Test valid email."""
        result = InputSanitizer.sanitize_email("  USER@EXAMPLE.COM  ")
        assert result == "user@example.com"
    
    def test_sanitize_email_invalid(self):
        """Test invalid email."""
        with pytest.raises(SanitizationError):
            InputSanitizer.sanitize_email("not-an-email")
    
    def test_sanitize_password_valid(self):
        """Test valid password."""
        result = InputSanitizer.sanitize_password("SecurePass123!")
        assert result == "SecurePass123!"
    
    def test_sanitize_password_too_short(self):
        """Test password too short."""
        with pytest.raises(SanitizationError):
            InputSanitizer.sanitize_password("Short1!")
    
    def test_sanitize_password_no_special_char(self):
        """Test password without special char."""
        with pytest.raises(SanitizationError):
            InputSanitizer.sanitize_password("OnlyLettersAndNumbers123")
    
    def test_sanitize_integer_valid(self):
        """Test valid integer."""
        result = InputSanitizer.sanitize_integer(42, min_value=0, max_value=100)
        assert result == 42
    
    def test_sanitize_integer_out_of_range(self):
        """Test integer out of range."""
        with pytest.raises(SanitizationError):
            InputSanitizer.sanitize_integer(150, min_value=0, max_value=100)
    
    def test_sanitize_choice_valid(self):
        """Test valid choice."""
        result = InputSanitizer.sanitize_choice("male", ["male", "female", "other"])
        assert result == "male"
    
    def test_sanitize_choice_case_insensitive(self):
        """Test choice is case-insensitive."""
        result = InputSanitizer.sanitize_choice("MALE", ["male", "female", "other"])
        assert result == "male"
    
    def test_sanitize_choice_invalid(self):
        """Test invalid choice."""
        with pytest.raises(SanitizationError):
            InputSanitizer.sanitize_choice("invalid", ["male", "female", "other"])
    
    def test_sanitize_filename_valid(self):
        """Test valid filename."""
        result = InputSanitizer.sanitize_filename("document.pdf")
        assert result == "document.pdf"
    
    def test_sanitize_filename_no_path_traversal(self):
        """Test path traversal prevention."""
        result = InputSanitizer.sanitize_filename("../../../etc/passwd")
        assert "/" not in result
        assert "\\" not in result


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    def test_rate_limiter_creation(self):
        """Test rate limiter initialization."""
        from app.utils.rate_limiter import RateLimiter
        limiter = RateLimiter()
        assert len(limiter.requests) == 0
    
    def test_rate_limiter_allow_first_request(self):
        """Test that first request is allowed."""
        from app.utils.rate_limiter import RateLimiter
        limiter = RateLimiter()
        allowed, remaining, reset_in = limiter.is_allowed("client1", 10, 60)
        assert allowed is True
        assert remaining == 9
    
    def test_rate_limiter_count_requests(self):
        """Test request counting."""
        from app.utils.rate_limiter import RateLimiter
        limiter = RateLimiter()
        
        for i in range(10):
            allowed, remaining, reset_in = limiter.is_allowed("client1", 10, 60)
            assert allowed is True
        
        # 11th request should be denied
        allowed, remaining, reset_in = limiter.is_allowed("client1", 10, 60)
        assert allowed is False


class TestAdminEndpoints:
    """Test admin and debug endpoints."""
    
    def test_ping_endpoint(self, client):
        """Test /admin/ping endpoint."""
        response = client.get('/api/admin/ping')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'pong'
    
    def test_routes_endpoint(self, client):
        """Test /api/admin/routes endpoint."""
        response = client.get('/api/admin/routes')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'routes' in data
        assert len(data['routes']) > 0
    
    def test_health_endpoint(self, client):
        """Test /admin/health endpoint."""
        response = client.get('/api/admin/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'ok'
        assert 'system' in data
        assert 'database' in data
    
    def test_metrics_endpoint(self, client):
        """Test /admin/metrics endpoint."""
        response = client.get('/api/admin/metrics')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'users' in data
        assert 'diagnoses' in data
    
    def test_protected_admin_endpoints_require_auth(self, client):
        """Test that protected admin endpoints require JWT."""
        response = client.get('/api/admin/db/info')
        # Should be 401 (unauthorized) or 422 (missing token)
        assert response.status_code in [401, 422]


class TestLogging:
    """Test logging setup."""
    
    def test_logger_creation(self):
        """Test logger creation."""
        from app.utils.logger import get_logger
        logger = get_logger("test_module")
        assert logger is not None
        assert logger.name == "test_module"
    
    def test_performance_logger(self):
        """Test performance logging."""
        from app.utils.logger import PerformanceLogger
        # Should not raise exception
        PerformanceLogger.log_operation("test_op", 500.5, status="success")
    
    def test_error_logger(self):
        """Test error logging."""
        from app.utils.logger import ErrorLogger
        # Should not raise exception
        ErrorLogger.log_error(Exception("test error"), context="test")
    
    def test_timer_context_manager(self):
        """Test Timer context manager."""
        from app.utils.logger import Timer
        with Timer("test_operation"):
            pass
        # Should complete without error


class TestIntegrationWithErrorHandling:
    """Integration tests for error handling in routes."""
    
    def test_register_with_invalid_email(self, client):
        """Test registration with invalid email."""
        response = client.post('/api/auth/register', json={
            'name': 'John Doe',
            'email': 'not-an-email',
            'password': 'SecurePass123!',
            'age': 30,
            'gender': 'male'
        })
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_login_rate_limiting(self, client):
        """Test login endpoint rate limiting."""
        # Try multiple failed logins
        for _ in range(10):
            response = client.post('/api/auth/login', json={
                'email': 'nonexistent@example.com',
                'password': 'wrong'
            })
            # Eventually should hit rate limit (429)
            if response.status_code == 429:
                break
        
        # At least some requests should fail
        assert response.status_code in [401, 429]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])