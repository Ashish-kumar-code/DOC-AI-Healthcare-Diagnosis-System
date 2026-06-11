import os
from app import create_app
from app.config import DevelopmentConfig, ProductionConfig

config_class = ProductionConfig if os.getenv("FLASK_ENV") == "production" else DevelopmentConfig
app = create_app(config_class)

if __name__ == "__main__":
    debug_mode = app.config.get("DEBUG", False)
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
