#!/usr/bin/env python
"""
DOC AI - Database Initialization & Migration Helper
Uses modern Flask CLI (no more MigrateCommand)
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from flask_migrate import Migrate

app = create_app()
migrate = Migrate(app, db)

if __name__ == '__main__':
    with app.app_context():
        if len(sys.argv) > 1:
            command = sys.argv[1].lower()
            
            if command == "reset":
                print("🗑️  Dropping all tables...")
                db.drop_all()
                print("✅ All tables dropped.")
                
                print("🔨 Creating all tables...")
                db.create_all()
                print("✅ Database tables created successfully!")
                print("🎉 Database reset complete.")
                
            elif command == "create":
                db.create_all()
                print("✅ Database tables created.")
                
            elif command == "drop":
                db.drop_all()
                print("✅ All tables dropped.")
                
            else:
                print(f"Unknown command: {command}")
                print("Available commands: reset, create, drop")
        else:
            print("Usage: python db_init.py <command>")
            print("Commands: reset | create | drop")