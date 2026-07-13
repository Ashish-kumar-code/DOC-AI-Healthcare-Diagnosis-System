"""
DOC AI - Medical Image Classification Model
Improved version with Transfer Learning (MobileNetV2) for Chest X-Ray (Normal vs Pneumonia)
"""

import os
import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.getenv("IMAGE_MODEL_PATH", "app/ml/image_model.h5")

# Updated for 2 classes (Normal vs Pneumonia)
CLASS_NAMES = ['Normal', 'Pneumonia']


def build_image_model(num_classes=2):
    """Build improved model with MobileNetV2 transfer learning"""
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    
    # Unfreeze last 30 layers for better fine-tuning
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.1),
        layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0005),  # Lower LR for fine-tuning
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def train_image_model(train_dir, val_dir=None, num_classes=2, epochs=10, batch_size=32, save_path=None):
    """Train the image model"""
    if save_path is None:
        save_path = MODEL_PATH

    # Data augmentation
    train_datagen = keras.preprocessing.image.ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        shear_range=0.1,
        zoom_range=0.1,
        horizontal_flip=True,
        validation_split=0.2
    )

    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='sparse',
        subset='training',
        shuffle=True
    )

    val_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='sparse',
        subset='validation',
        shuffle=False
    )

    from sklearn.utils.class_weight import compute_class_weight
    class_weights = compute_class_weight(
        'balanced',
        classes=np.unique(train_generator.classes),
        y=train_generator.classes
    )
    class_weight_dict = dict(enumerate(class_weights))
    logger.info(f"Using class weights: {class_weight_dict}")

    model = build_image_model(num_classes)

    print(f"Training on {train_generator.samples} images | Validating on {val_generator.samples} images")

    history = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=epochs,
        class_weight=class_weight_dict,
        verbose=1
    )

    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    model.save(save_path)

    logger.info(f"✅ Image model trained and saved to {save_path}")
    return {
        "status": "trained",
        "model_path": save_path,
        "history": history.history,
        "train_samples": train_generator.samples,
        "val_samples": val_generator.samples
    }


def predict_image(file_path):
    """Predict from medical image"""
    if not os.path.exists(MODEL_PATH):
        logger.warning("Image model not found. Using fallback placeholder prediction.")
        return {
            "predicted_class": "Unknown",
            "class_index": None,
            "confidence": 0.0,
            "all_probabilities": {name: 0.0 for name in CLASS_NAMES},
            "error": "Image model not trained. Run train_image_model() first."
        }

    try:
        model = load_model(MODEL_PATH)

        # Preprocess
        img = Image.open(file_path).convert("RGB")
        img = img.resize((224, 224))
        img_array = keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        preds = model.predict(img_array, verbose=0)
        
        class_idx = int(np.argmax(preds[0]))
        confidence = float(preds[0][class_idx]) * 100

        return {
            "predicted_class": CLASS_NAMES[class_idx],
            "class_index": class_idx,
            "confidence": round(confidence, 2),
            "all_probabilities": {
                CLASS_NAMES[i]: round(float(preds[0][i]) * 100, 2) 
                for i in range(len(CLASS_NAMES))
            }
        }

    except Exception as e:
        logger.error(f"Image prediction error: {e}")
        return {
            "predicted_class": "Unknown",
            "class_index": None,
            "confidence": 0.0,
            "all_probabilities": {name: 0.0 for name in CLASS_NAMES},
            "error": str(e)
        }


# For backward compatibility with dummy model (if needed)
def create_dummy_model():
    """Create a simple dummy model if needed"""
    pass