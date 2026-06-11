import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.ml.image_model import train_image_model

if __name__ == '__main__':
    print("Starting full image model retraining (5 epochs) with class weights...")
    result = train_image_model(train_dir="datasets/images/train", epochs=5)
    print("Retraining completed:", result)
