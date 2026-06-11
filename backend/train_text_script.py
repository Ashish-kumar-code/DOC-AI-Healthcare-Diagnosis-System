import sys
import os

# Add the backend directory to sys.path so 'app' can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.ml.text_model import train_text_model

if __name__ == '__main__':
    print("Starting text model retraining...")
    result = train_text_model(force_retrain=True)
    print("Retraining completed:", result)
