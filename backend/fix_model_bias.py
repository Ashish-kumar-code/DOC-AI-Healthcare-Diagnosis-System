import os
import numpy as np
from tensorflow import keras
from sklearn.utils.class_weight import compute_class_weight

MODEL_PATH = 'app/ml/image_model.h5'
TRAIN_DIR = 'datasets/images/train'

# Load model
model = keras.models.load_model(MODEL_PATH)

# Freeze all layers except the last dense layer
for layer in model.layers[:-1]:
    layer.trainable = False
model.layers[-1].trainable = True

# Recompile
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.005), # Higher LR for fast convergence on just the last layer
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Prepare fast generator
train_datagen = keras.preprocessing.image.ImageDataGenerator(
    preprocessing_function=keras.applications.mobilenet_v2.preprocess_input
)

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(224, 224),
    batch_size=64,
    class_mode='sparse',
    shuffle=True
)

# Compute class weights to fix the severe imbalance (1341 Normal vs 3875 Pneumonia)
class_weights = compute_class_weight(
    'balanced',
    classes=np.unique(train_generator.classes),
    y=train_generator.classes
)
class_weight_dict = dict(enumerate(class_weights))
print("Computed Class Weights:", class_weight_dict)

# Train only the last layer for 2 epochs to rapidly fix the bias
model.fit(
    train_generator,
    epochs=2,
    class_weight=class_weight_dict,
    verbose=1
)

# Save corrected model
model.save(MODEL_PATH)
print("Model bias corrected and saved.")
