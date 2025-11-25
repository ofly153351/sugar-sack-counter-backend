import base64
import json
import os
from io import BytesIO
from typing import Dict, List

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

app = FastAPI(title="AI Person Detection Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
try:
    model = YOLO("yolov8n.pt")  # Will auto-download if not exists
    print("✅ YOLO model loaded successfully")
except Exception as e:
    print(f"❌ Failed to load YOLO model: {e}")
    model = None


class Detection:
    def __init__(self, class_name: str, confidence: float, bbox: List[float]):
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox  # [x1, y1, x2, y2]


def draw_bounding_boxes(image: np.ndarray, detections: List[Detection]) -> np.ndarray:
    """Draw bounding boxes and labels on image"""
    img_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)

    # Try to load font, fallback to default if not available
    try:
        font = ImageFont.truetype("Arial.ttf", 16)
    except:
        font = ImageFont.load_default()

    for detection in detections:
        x1, y1, x2, y2 = detection.bbox

        # Draw bounding box
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)

        # Draw label background
        label = f"{detection.class_name} {detection.confidence:.1%}"
        bbox = draw.textbbox((0, 0), label, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        draw.rectangle([x1, y1 - text_height - 5, x1 + text_width + 10, y1], fill="red")

        # Draw label text
        draw.text((x1 + 5, y1 - text_height - 2), label, fill="white", font=font)

    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)


def image_to_base64(image: np.ndarray) -> str:
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode(".jpg", image)
    return base64.b64encode(buffer).decode("utf-8")


@app.post("/detect")
async def detect_persons(file: UploadFile = File(...)):
    """Detect persons in uploaded image"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if model is None:
        raise HTTPException(status_code=500, detail="AI model not available")

    try:
        # Read image
        image_data = await file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Run YOLO detection
        results = model(image)

        detections = []
        person_count = 0

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    confidence = float(box.conf[0])

                    # Filter only person class (class_id 0 in COCO dataset)
                    if class_name == "person" and confidence > 0.5:
                        person_count += 1
                        x1, y1, x2, y2 = box.xyxy[0].tolist()

                        detections.append(
                            Detection(
                                class_name=class_name,
                                confidence=confidence,
                                bbox=[x1, y1, x2, y2],
                            )
                        )

        # Draw bounding boxes on original image
        annotated_image = draw_bounding_boxes(image.copy(), detections)
        base64_image = image_to_base64(annotated_image)

        # Convert detections to serializable format
        serializable_detections = [
            {"class": det.class_name, "confidence": det.confidence, "bbox": det.bbox}
            for det in detections
        ]

        return {
            "status": "success",
            "person_count": person_count,
            "annotated_image": base64_image,
            "detections": serializable_detections,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")
