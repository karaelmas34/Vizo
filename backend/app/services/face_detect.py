from typing import List, Dict, Any
from PIL import Image
import numpy as np
import os

# MediaPipe (optional; can be disabled by env)
try:
    import mediapipe as mp
    MP_AVAILABLE = os.environ.get('DISABLE_MEDIAPIPE_FACE','0') != '1'
except Exception:
    MP_AVAILABLE = False

# OpenCV Haar cascade (preferred)
try:
    import cv2
    CV_AVAILABLE = True
    HAAR_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
except Exception:
    CV_AVAILABLE = False
    HAAR_PATH = None

def _fallback_center(w: int, h: int):
    bw, bh = int(w*0.3), int(h*0.3)
    x = max(0, (w - bw)//2); y = max(0, (h - bh)//2)
    return [{
        "id":"face_1","name":"Character 1",
        "boundingBox":{"x":x,"y":y,"width":bw,"height":bh}
    }]

def detect_faces(image_path: str) -> List[Dict[str, Any]]:
    img = Image.open(image_path).convert("RGB")
    w, h = img.size

    # 1) OpenCV Haar first
    if CV_AVAILABLE and HAAR_PATH:
        try:
            gray = np.array(img.convert("L"))
            face_cascade = cv2.CascadeClassifier(HAAR_PATH)
            rects = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40,40))
            faces = []
            for i, (x,y,ww,hh) in enumerate(rects):
                faces.append({
                    "id": f"face_{i+1}",
                    "name": f"Character {i+1}",
                    "boundingBox": {"x": int(x), "y": int(y), "width": int(ww), "height": int(hh)}
                })
            if faces:
                return faces
        except Exception:
            pass

    # 2) MediaPipe fallback (if available)
    if MP_AVAILABLE:
        try:
            arr = np.array(img)
            mp_face = mp.solutions.face_detection
            with mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5) as fd:
                results = fd.process(arr)
                faces = []
                if results.detections:
                    for i, det in enumerate(results.detections):
                        bbox = det.location_data.relative_bounding_box
                        x = max(0, int(bbox.xmin * w))
                        y = max(0, int(bbox.ymin * h))
                        ww = max(1, int(bbox.width * w))
                        hh = max(1, int(bbox.height * h))
                        faces.append({
                            "id": f"face_{i+1}",
                            "name": f"Character {i+1}",
                            "boundingBox": {"x": x, "y": y, "width": ww, "height": hh}
                        })
                if faces:
                    return faces
        except Exception:
            pass

    # 3) Center fallback (never block the flow)
    return _fallback_center(w, h)

def choose_aspect_from_image(image_path: str) -> str:
    img = Image.open(image_path)
    w, h = img.size
    return "16:9" if w >= h else "9:16"
