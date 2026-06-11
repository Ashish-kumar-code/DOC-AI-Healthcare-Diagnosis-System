"""
Comprehensive import verification script for DOC AI.
Tests all required modules and libraries to ensure they are properly installed.
"""

import sys
sys.path.insert(0, '.')

print("=" * 70)
print("DOC AI - COMPREHENSIVE IMPORT VERIFICATION")
print("=" * 70)

# Track results
results = {
    "successful": [],
    "failed": [],
    "warnings": []
}

# Test categories
imports_to_test = {
    "Flask Core": [
        ("flask", "Flask"),
        ("flask_cors", "CORS"),
        ("flask_jwt_extended", "JWTManager"),
        ("flask_sqlalchemy", "SQLAlchemy"),
        ("flask_migrate", "Migrate"),
    ],
    "Database & ORM": [
        ("sqlalchemy", "create_engine"),
        ("sqlalchemy.orm", "sessionmaker"),
    ],
    "Data Processing": [
        ("pandas", "DataFrame"),
        ("numpy", "array"),
        ("joblib", "load"),
    ],
    "Machine Learning": [
        ("sklearn.ensemble", "RandomForestClassifier"),
        ("sklearn.preprocessing", "StandardScaler"),
        ("tensorflow", "keras"),
        ("tensorflow.keras", "layers"),
        ("PIL", "Image"),
        ("cv2", "imread"),
    ],
    "Validation & Serialization": [
        ("marshmallow", "Schema"),
        ("pydantic", "BaseModel"),
    ],
    "Utilities": [
        ("dotenv", "load_dotenv"),
        ("requests", "get"),
        ("reportlab.pdfgen", "canvas"),
        ("psutil", "cpu_percent"),
        ("pytest", "fixture"),
    ],
    "Application Utils": [
        ("app.utils.error_handler", "ValidationError, AuthenticationError, AuthorizationError"),
        ("app.utils.sanitizer", "InputSanitizer"),
        ("app.utils.rate_limiter", "RateLimiter"),
        ("app.utils.logger", "get_logger"),
    ],
    "Application Models": [
        ("app.models", "User, DiagnosisHistory"),
        ("app.routes.auth", "auth_bp"),
        ("app.routes.diagnosis", "diagnosis_bp"),
        ("app.routes.admin", "admin_bp"),
    ]
}

# Test imports
for category, modules in imports_to_test.items():
    print(f"\n📦 {category}:")
    for module_path, import_item in modules:
        try:
            exec(f"from {module_path} import {import_item}")
            results["successful"].append(f"{module_path}.{import_item}")
            print(f"  ✅ {module_path}")
        except ImportError as e:
            results["failed"].append(f"{module_path}.{import_item}")
            print(f"  ❌ {module_path}")
            print(f"     Error: {str(e)[:60]}...")
        except Exception as e:
            results["warnings"].append(f"{module_path}.{import_item}")
            print(f"  ⚠️  {module_path}")
            print(f"     Warning: {str(e)[:60]}...")

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"✅ Successful: {len(results['successful'])}")
print(f"❌ Failed: {len(results['failed'])}")
print(f"⚠️  Warnings: {len(results['warnings'])}")

if results["failed"]:
    print("\n❌ FAILED IMPORTS:")
    for item in results["failed"]:
        print(f"  - {item}")

if results["warnings"]:
    print("\n⚠️  WARNINGS:")
    for item in results["warnings"]:
        print(f"  - {item}")

if not results["failed"] and not results["warnings"]:
    print("\n✨ All imports verified successfully!")
else:
    print("\n⚠️  Some imports need attention!")

print("=" * 70)
