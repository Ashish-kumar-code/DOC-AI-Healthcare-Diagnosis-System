import os
import numpy as np
from tensorflow import keras
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image

model = keras.models.load_model('app/ml/image_model.h5')

def pred(path):
    img = Image.open(path).convert('RGB').resize((224, 224))
    arr = np.expand_dims(keras.preprocessing.image.img_to_array(img), axis=0)
    arr = preprocess_input(arr)
    return model.predict(arr, verbose=0)[0].tolist()

print('Normal image:')
print(pred('datasets/images/test/NORMAL/IM-0001-0001.jpeg'))
print('Pneumonia image:')
print(pred('datasets/images/test/PNEUMONIA/person100_bacteria_475.jpeg'))
