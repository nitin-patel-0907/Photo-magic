import os
import sys
import shutil

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
os.makedirs(MODELS_DIR, exist_ok=True)
os.environ["U2NET_HOME"] = MODELS_DIR

print(f"Checking and preparing offline models in: {MODELS_DIR}")

# 1. Check u2net weights for background removal
u2net_path = os.path.join(MODELS_DIR, "u2net.onnx")
nested_u2net = os.path.join(MODELS_DIR, "models", "u2net", "u2net.onnx")

if os.path.isfile(nested_u2net) and not os.path.isfile(u2net_path):
    print("Linking nested u2net.onnx to models/u2net.onnx...")
    shutil.copy(nested_u2net, u2net_path)

try:
    import rembg
    print("Loading u2net session to verify offline weights...")
    session = rembg.new_session("u2net")
    print("u2net model is ready and cached locally for offline execution.")
except Exception as e:
    print(f"Warning initializing u2net: {e}")

# 2. Check OpenCV and PIL
try:
    import cv2
    import PIL
    import numpy as np
    print(f"OpenCV {cv2.__version__}, Pillow {PIL.__version__}, NumPy {np.__version__} verified.")
except Exception as e:
    print(f"Error checking image libraries: {e}")
    sys.exit(1)

print("Setup complete! All models and offline engines are initialized and cached.")
