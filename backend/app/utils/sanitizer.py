"""
Input sanitization and validation utilities.
Prevents injection attacks and enforces data quality.
"""

import re
import html
from typing import Any, Optional, Dict, List
import logging

logger = logging.getLogger(__name__)


# Sanitization patterns
EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
USERNAME_PATTERN = r'^[a-zA-Z0-9_-]{3,50}$'
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRES_SPECIAL = True  # Requires at least one special char


class SanitizationError(ValueError):
    """Raised when sanitization fails."""
    pass


class InputSanitizer:
    """Sanitizes and validates user input."""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000, 
                       allow_html: bool = False) -> str:
        """
        Sanitize string input.
        
        Args:
            value: Input string
            max_length: Maximum allowed length
            allow_html: Whether to allow HTML (if False, escapes HTML)
            
        Returns:
            Sanitized string
            
        Raises:
            SanitizationError: If input invalid
        """
        if not isinstance(value, str):
            raise SanitizationError("Input must be string")
        
        value = value.strip()
        
        if len(value) == 0:
            raise SanitizationError("Input cannot be empty")
        
        if len(value) > max_length:
            raise SanitizationError(f"Input exceeds maximum length of {max_length}")
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Escape HTML if not allowed
        if not allow_html:
            value = html.escape(value)
        
        return value
    
    @staticmethod
    def sanitize_email(email: str) -> str:
        """
        Sanitize and validate email address.
        
        Args:
            email: Email address
            
        Returns:
            Lowercased, trimmed email
            
        Raises:
            SanitizationError: If email invalid
        """
        email = email.strip().lower()
        
        if not re.match(EMAIL_PATTERN, email):
            raise SanitizationError("Invalid email address format")
        
        if len(email) > 254:  # RFC 5321
            raise SanitizationError("Email address too long")
        
        return email
    
    @staticmethod
    def sanitize_password(password: str) -> str:
        """
        Validate password strength.
        
        Args:
            password: Password string
            
        Returns:
            Password (unchanged if valid)
            
        Raises:
            SanitizationError: If password too weak
        """
        if not isinstance(password, str):
            raise SanitizationError("Password must be string")
        
        if len(password) < PASSWORD_MIN_LENGTH:
            raise SanitizationError(
                f"Password must be at least {PASSWORD_MIN_LENGTH} characters"
            )
        
        if PASSWORD_REQUIRES_SPECIAL:
            if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
                raise SanitizationError(
                    "Password must contain at least one special character"
                )
        
        if len(password) > 128:
            raise SanitizationError("Password too long (max 128 characters)")
        
        return password
    
    @staticmethod
    def sanitize_integer(value: Any, min_value: Optional[int] = None,
                        max_value: Optional[int] = None) -> int:
        """
        Sanitize and validate integer input.
        
        Args:
            value: Input value
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            
        Returns:
            Validated integer
            
        Raises:
            SanitizationError: If input invalid
        """
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise SanitizationError("Input must be a valid integer")
        
        if min_value is not None and int_value < min_value:
            raise SanitizationError(
                f"Value cannot be less than {min_value}"
            )
        
        if max_value is not None and int_value > max_value:
            raise SanitizationError(
                f"Value cannot be greater than {max_value}"
            )
        
        return int_value
    
    @staticmethod
    def sanitize_float(value: Any, min_value: Optional[float] = None,
                      max_value: Optional[float] = None) -> float:
        """
        Sanitize and validate float input.
        
        Args:
            value: Input value
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            
        Returns:
            Validated float
            
        Raises:
            SanitizationError: If input invalid
        """
        try:
            float_value = float(value)
        except (ValueError, TypeError):
            raise SanitizationError("Input must be a valid number")
        
        if min_value is not None and float_value < min_value:
            raise SanitizationError(
                f"Value cannot be less than {min_value}"
            )
        
        if max_value is not None and float_value > max_value:
            raise SanitizationError(
                f"Value cannot be greater than {max_value}"
            )
        
        return float_value
    
    @staticmethod
    def sanitize_choice(value: str, allowed_values: List[str]) -> str:
        """
        Validate choice from allowed list.
        
        Args:
            value: Input value
            allowed_values: List of allowed values
            
        Returns:
            Validated choice
            
        Raises:
            SanitizationError: If value not in allowed list
        """
        value = str(value).strip().lower()
        
        if value not in [v.lower() for v in allowed_values]:
            raise SanitizationError(
                f"Invalid choice. Must be one of: {', '.join(allowed_values)}"
            )
        
        # Return actual value from allowed_values (preserves case)
        return next(v for v in allowed_values if v.lower() == value)
    
    @staticmethod
    def sanitize_boolean(value: Any) -> bool:
        """
        Sanitize boolean input.
        
        Args:
            value: Input value
            
        Returns:
            Boolean value
            
        Raises:
            SanitizationError: If input invalid
        """
        if isinstance(value, bool):
            return value
        
        if isinstance(value, str):
            if value.lower() in ('true', '1', 'yes', 'on'):
                return True
            elif value.lower() in ('false', '0', 'no', 'off'):
                return False
        
        raise SanitizationError("Invalid boolean value")
    
    @staticmethod
    def sanitize_filename(filename: str, max_length: int = 255) -> str:
        """
        Sanitize filename to prevent directory traversal.
        
        Args:
            filename: Input filename
            max_length: Maximum length
            
        Returns:
            Sanitized filename
            
        Raises:
            SanitizationError: If filename invalid
        """
        # Remove path separators
        filename = filename.replace('\\', '').replace('/', '')
        
        # Remove dangerous characters
        filename = re.sub(r'[<>:"|?*\x00-\x1f]', '', filename)
        
        # Remove leading dots (hidden files, parent dir refs)
        filename = filename.lstrip('.')
        
        if not filename or len(filename) > max_length:
            raise SanitizationError("Invalid filename")
        
        return filename
    
    @staticmethod
    def sanitize_json_data(data: Dict, allowed_keys: Optional[List[str]] = None,
                          max_string_length: int = 1000) -> Dict:
        """
        Sanitize JSON data object.
        
        Args:
            data: Input dictionary
            allowed_keys: If set, only these keys allowed
            max_string_length: Maximum length for string values
            
        Returns:
            Sanitized dictionary
            
        Raises:
            SanitizationError: If data invalid
        """
        if not isinstance(data, dict):
            raise SanitizationError("Input must be dictionary")
        
        sanitized = {}
        
        for key, value in data.items():
            # Validate key
            if not isinstance(key, str):
                raise SanitizationError("Dictionary keys must be strings")
            
            if allowed_keys and key not in allowed_keys:
                raise SanitizationError(f"Unexpected field: {key}")
            
            # Sanitize value based on type
            if isinstance(value, str):
                sanitized[key] = InputSanitizer.sanitize_string(
                    value, max_length=max_string_length
                )
            elif isinstance(value, (int, float, bool)):
                sanitized[key] = value
            elif value is None:
                sanitized[key] = None
            else:
                raise SanitizationError(
                    f"Unsupported data type for field {key}: {type(value)}"
                )
        
        return sanitized


def validate_file_upload(filename: str, allowed_extensions: List[str],
                        max_size_mb: int = 8) -> bool:
    """
    Validate uploaded file.
    
    Args:
        filename: Upload filename
        allowed_extensions: List of allowed file extensions (e.g., ['jpg', 'png'])
        max_size_mb: Maximum file size in megabytes
        
    Returns:
        True if valid
        
    Raises:
        SanitizationError: If file invalid
    """
    if not filename:
        raise SanitizationError("Filename cannot be empty")
    
    # Get extension
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    
    if ext not in allowed_extensions:
        raise SanitizationError(
            f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Size validation happens in Flask config (MAX_CONTENT_LENGTH)
    
    return True
