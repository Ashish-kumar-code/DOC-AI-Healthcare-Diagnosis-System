"""
Pytest configuration and fixtures for DOC AI tests.
"""

import pytest
from app import create_app, db


@pytest.fixture(scope="session")
def app():
    """Create and configure a test app instance."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-secret-key-for-testing",
        "SECRET_KEY": "test-secret-key",
    })
    return app


@pytest.fixture(scope="session")
def client(app, init_database):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture(scope="session")
def init_database(app):
    """Initialize the database."""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()