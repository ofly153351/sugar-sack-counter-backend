import base64
import json
import os
import tempfile
from collections import Counter
from io import BytesIO
from typing import Dict, List, Optional

import cv2
import numpy as np
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

# Import MinIO client
try:
    from minio_client import get_minio_client
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False
    print("⚠️ MinIO client not available. Install with: pip install minio")

app = FastAPI(title="AI Sugar Sack and Box Detection Service with MinIO Storage")

# CORS middleware
# If CORS_ORIGINS="*", do not allow credentials (browser disallows "*"+credentials).
# If set to a list, credentials are allowed.
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
allow_credentials = cors_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load confidence thresholds from environment variables
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))
BOX_CONFIDENCE_THRESHOLD = float(os.getenv("BOX_CONFIDENCE_THRESHOLD", "0.2"))
MODEL_PATH = os.getenv("MODEL_PATH", "bestStudent.pt")
SACK_CLASS_NAME = os.getenv("SACK_CLASS_NAME", "bag").strip().lower()
BOX_CLASS_NAME = os.getenv("BOX_CLASS_NAME", "bbox").strip().lower()
CLASS_ALIASES = {
    "sack": "sack",
    "box": "box",
    SACK_CLASS_NAME: "sack",
    BOX_CLASS_NAME: "box",
}
print(f"📊 Using confidence thresholds - Sack: {CONFIDENCE_THRESHOLD}, Box: {BOX_CONFIDENCE_THRESHOLD}")

# Load custom YOLO model
try:
    model = YOLO(MODEL_PATH)  # Use custom trained model
    print("✅ Custom YOLO model loaded successfully")

    # Display model classes for debugging
    if hasattr(model, 'names'):
        print(f"📋 Model classes: {model.names}")
        try:
            print(f"📋 Class 0: '{model.names[0]}'")
        except Exception:
            pass
        try:
            print(f"📋 Class 1: '{model.names[1]}'")
        except Exception:
            pass
        print(f"🧭 Class mapping: {SACK_CLASS_NAME} -> sack, {BOX_CLASS_NAME} -> box")
        print(f"⚠️ Note: Model may have low confidence scores. Using thresholds - Sack: {CONFIDENCE_THRESHOLD}, Box: {BOX_CONFIDENCE_THRESHOLD}")
    else:
        print("⚠️ Model classes information not available")

except Exception as e:
    print(f"❌ Failed to load custom YOLO model: {e}")
    model = None

# Initialize MinIO client if available
minio_client = None
if MINIO_AVAILABLE:
    try:
        minio_client = get_minio_client()
        print("✅ MinIO client initialized successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize MinIO client: {e}")
        minio_client = None
else:
    print("⚠️ MinIO storage disabled")


class Detection:
    def __init__(self, class_name: str, confidence: float, bbox: List[float]):
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = bbox  # [x1, y1, x2, y2]


class DetectionResult:
    """Enhanced detection result with storage information"""
    def __init__(
        self,
        detections: List[Detection],
        total_count: int,
        sack_count: int,
        box_count: int,
        annotated_image: np.ndarray,
        original_image: np.ndarray,
        original_filename: str,
        session_id: Optional[str] = None
    ):
        self.detections = detections
        self.total_count = total_count
        self.sack_count = sack_count
        self.box_count = box_count
        self.annotated_image = annotated_image
        self.original_image = original_image
        self.original_filename = original_filename
        self.session_id = session_id or str(uuid.uuid4())[:8]
        self.original_stored = False
        self.annotated_stored = False
        self.original_object_name = ""
        self.annotated_object_name = ""
        self.original_url = ""
        self.annotated_url = ""


import uuid


def normalize_class_name(raw_class_name: str) -> Optional[str]:
    """Map model class names to canonical API classes: sack/box."""
    return CLASS_ALIASES.get(raw_class_name.strip().lower())


def class_threshold(canonical_class_name: str) -> float:
    if canonical_class_name == "sack":
        return CONFIDENCE_THRESHOLD
    if canonical_class_name == "box":
        return BOX_CONFIDENCE_THRESHOLD
    return 1.0


def draw_bounding_boxes(image: np.ndarray, detections: List[Detection]) -> np.ndarray:
    """Draw bounding boxes and labels on image with different colors for each class"""
    img_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)

    # Try to load font, fallback to default if not available
    try:
        font = ImageFont.truetype("Arial.ttf", 16)
    except:
        font = ImageFont.load_default()

    # Define colors for different classes
    class_colors = {
        "sack": "red",
        "box": "blue",
        "person": "green"  # Keep for compatibility if needed
    }

    for detection in detections:
        x1, y1, x2, y2 = detection.bbox

        # Get color for this class, default to red if not found
        color = class_colors.get(detection.class_name.lower(), "red")

        # Draw bounding box
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

        # Draw label background
        label = f"{detection.class_name} {detection.confidence:.1%}"
        bbox = draw.textbbox((0, 0), label, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        draw.rectangle([x1, y1 - text_height - 5, x1 + text_width + 10, y1], fill=color)

        # Draw label text
        draw.text((x1 + 5, y1 - text_height - 2), label, fill="white", font=font)

    # Summary text at top-left: class counts from current detections
    class_counter = Counter(det.class_name for det in detections)
    summary_lines = [f"{class_name}: {count}" for class_name, count in sorted(class_counter.items())]
    if not summary_lines:
        summary_lines = ["no detections"]

    text_padding = 8
    line_gap = 4
    max_width = 0
    total_height = text_padding
    for line in summary_lines:
        line_bbox = draw.textbbox((0, 0), line, font=font)
        line_width = line_bbox[2] - line_bbox[0]
        line_height = line_bbox[3] - line_bbox[1]
        max_width = max(max_width, line_width)
        total_height += line_height + line_gap

    box_x1, box_y1 = 10, 10
    box_x2 = box_x1 + max_width + (text_padding * 2)
    box_y2 = box_y1 + total_height + text_padding - line_gap

    draw.rectangle([box_x1, box_y1, box_x2, box_y2], fill=(0, 0, 0, 160))

    text_y = box_y1 + text_padding
    for line in summary_lines:
        draw.text((box_x1 + text_padding, text_y), line, fill="white", font=font)
        line_bbox = draw.textbbox((0, 0), line, font=font)
        line_height = line_bbox[3] - line_bbox[1]
        text_y += line_height + line_gap

    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)


def image_to_base64(image: np.ndarray) -> str:
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode(".jpg", image)
    return base64.b64encode(buffer).decode("utf-8")


@app.post("/detect")
async def detect_objects(
    file: UploadFile = File(...),
    save_to_minio: bool = Form(False),
    session_id: Optional[str] = Form(None)
):
    """
    Detect sugar sacks and boxes in uploaded image

    Parameters:
    - file: Image file to process
    - save_to_minio: Whether to save images to MinIO immediately (default: False)
    - session_id: Optional session ID for grouping related images
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if model is None:
        raise HTTPException(status_code=500, detail="AI model not available")

    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())[:8]

    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())[:8]

    try:
        # Read image
        image_data = await file.read()
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        print(f"📏 Image size: {image.shape}")

        # Run YOLO detection
        results = model(image)

        print(f"🔍 Detection results: {len(results)}")

        detections = []
        sack_count = 0
        box_count = 0
        total_count = 0

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    raw_class_name = model.names[class_id]
                    class_name = normalize_class_name(raw_class_name)
                    confidence = float(box.conf[0])

                    if class_name is None:
                        continue

                    # Filter with different confidence thresholds for sack and box
                    if confidence > class_threshold(class_name):
                        x1, y1, x2, y2 = box.xyxy[0].tolist()

                        # Count objects by canonical class names
                        if class_name == "sack":
                            sack_count += 1
                        elif class_name == "box":
                            box_count += 1

                        total_count += 1

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

        # Create detection result object
        detection_result = DetectionResult(
            detections=detections,
            total_count=total_count,
            sack_count=sack_count,
            box_count=box_count,
            annotated_image=annotated_image,
            original_image=image,
            original_filename=file.filename,
            session_id=session_id
        )

        # Save to MinIO if requested
        storage_info = {}
        if save_to_minio and minio_client is not None:
            try:
                # Save original image
                _, buffer_original = cv2.imencode(".jpg", image)
                success_original, original_obj_name, original_url = minio_client.upload_file(
                    file_data=buffer_original.tobytes(),
                    original_filename=f"original_{file.filename}",
                    prefix=f"original/{session_id}",
                    content_type="image/jpeg"
                )

                # Save annotated image
                _, buffer_annotated = cv2.imencode(".jpg", annotated_image)
                success_annotated, annotated_obj_name, annotated_url = minio_client.upload_file(
                    file_data=buffer_annotated.tobytes(),
                    original_filename=f"annotated_{file.filename}",
                    prefix=f"annotated/{session_id}",
                    content_type="image/jpeg"
                )

                if success_original and success_annotated:
                    storage_info = {
                        "storage": {
                            "original_stored": True,
                            "annotated_stored": True,
                            "original_object_name": original_obj_name,
                            "annotated_object_name": annotated_obj_name,
                            "original_url": original_url,
                            "annotated_url": annotated_url,
                            "session_id": session_id
                        }
                    }
                    print(f"💾 Images saved to MinIO: {original_obj_name}, {annotated_obj_name}")
                else:
                    print("⚠️ Failed to save images to MinIO")

            except Exception as e:
                print(f"⚠️ Error saving to MinIO: {e}")

        # Convert detections to serializable format
        serializable_detections = [
            {"class": det.class_name, "confidence": det.confidence, "bbox": det.bbox}
            for det in detections
        ]

        print(f"📊 Detection summary: {total_count} total, {sack_count} sacks, {box_count} boxes")

        response_data = {
            "status": "success",
            "total_count": total_count,
            "sack_count": sack_count,
            "box_count": box_count,
            "annotated_image": base64_image,
            "detections": serializable_detections,
            "session_id": session_id,
            "save_to_minio": save_to_minio,
            **storage_info
        }

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/detect-sacks")
async def detect_sacks_only(
    file: UploadFile = File(...),
    save_to_minio: bool = Form(False),
    session_id: Optional[str] = Form(None)
):
    """Detect only sugar sacks in uploaded image"""
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
        sack_count = 0

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    raw_class_name = model.names[class_id]
                    class_name = normalize_class_name(raw_class_name)
                    confidence = float(box.conf[0])

                    # Filter only sacks with confidence threshold
                    if class_name == "sack" and confidence > class_threshold("sack"):
                        sack_count += 1
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

        # Save to MinIO if requested
        storage_info = {}
        if save_to_minio and minio_client is not None:
            try:
                # Save original image
                _, buffer_original = cv2.imencode(".jpg", image)
                success_original, original_obj_name, original_url = minio_client.upload_file(
                    file_data=buffer_original.tobytes(),
                    original_filename=f"original_{file.filename}",
                    prefix=f"original/{session_id}",
                    content_type="image/jpeg"
                )

                # Save annotated image
                _, buffer_annotated = cv2.imencode(".jpg", annotated_image)
                success_annotated, annotated_obj_name, annotated_url = minio_client.upload_file(
                    file_data=buffer_annotated.tobytes(),
                    original_filename=f"annotated_{file.filename}",
                    prefix=f"annotated/{session_id}",
                    content_type="image/jpeg"
                )

                if success_original and success_annotated:
                    storage_info = {
                        "storage": {
                            "original_stored": True,
                            "annotated_stored": True,
                            "original_object_name": original_obj_name,
                            "annotated_object_name": annotated_obj_name,
                            "original_url": original_url,
                            "annotated_url": annotated_url,
                            "session_id": session_id
                        }
                    }
                    print(f"💾 Images saved to MinIO: {original_obj_name}, {annotated_obj_name}")
                else:
                    print("⚠️ Failed to save images to MinIO")

            except Exception as e:
                print(f"⚠️ Error saving to MinIO: {e}")

        # Convert detections to serializable format
        serializable_detections = [
            {"class": det.class_name, "confidence": det.confidence, "bbox": det.bbox}
            for det in detections
        ]

        return {
            "status": "success",
            "sack_count": sack_count,
            "annotated_image": base64_image,
            "detections": serializable_detections,
            "session_id": session_id,
            "save_to_minio": save_to_minio,
            **storage_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.post("/detect-boxes")
async def detect_boxes_only(
    file: UploadFile = File(...),
    save_to_minio: bool = Form(False),
    session_id: Optional[str] = Form(None)
):
    """Detect only sugar boxes in uploaded image"""
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
        box_count = 0

        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    raw_class_name = model.names[class_id]
                    class_name = normalize_class_name(raw_class_name)
                    confidence = float(box.conf[0])

                    # Filter only boxes with confidence threshold (20% for boxes)
                    if class_name == "box" and confidence > class_threshold("box"):
                        box_count += 1
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

        # Save to MinIO if requested
        storage_info = {}
        if save_to_minio and minio_client is not None:
            try:
                # Save original image
                _, buffer_original = cv2.imencode(".jpg", image)
                success_original, original_obj_name, original_url = minio_client.upload_file(
                    file_data=buffer_original.tobytes(),
                    original_filename=f"original_{file.filename}",
                    prefix=f"original/{session_id}",
                    content_type="image/jpeg"
                )

                # Save annotated image
                _, buffer_annotated = cv2.imencode(".jpg", annotated_image)
                success_annotated, annotated_obj_name, annotated_url = minio_client.upload_file(
                    file_data=buffer_annotated.tobytes(),
                    original_filename=f"annotated_{file.filename}",
                    prefix=f"annotated/{session_id}",
                    content_type="image/jpeg"
                )

                if success_original and success_annotated:
                    storage_info = {
                        "storage": {
                            "original_stored": True,
                            "annotated_stored": True,
                            "original_object_name": original_obj_name,
                            "annotated_object_name": annotated_obj_name,
                            "original_url": original_url,
                            "annotated_url": annotated_url,
                            "session_id": session_id
                        }
                    }
                    print(f"💾 Images saved to MinIO: {original_obj_name}, {annotated_obj_name}")
                else:
                    print("⚠️ Failed to save images to MinIO")

            except Exception as e:
                print(f"⚠️ Error saving to MinIO: {e}")

        # Convert detections to serializable format
        serializable_detections = [
            {"class": det.class_name, "confidence": det.confidence, "bbox": det.bbox}
            for det in detections
        ]

        return {
            "status": "success",
            "box_count": box_count,
            "annotated_image": base64_image,
            "detections": serializable_detections,
            "session_id": session_id,
            "save_to_minio": save_to_minio,
            **storage_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_info = {}
    if model is not None and hasattr(model, 'names'):
        model_info = {
            "model_loaded": True,
            "model_classes": model.names,
            "model_path": MODEL_PATH
        }
    else:
        model_info = {
            "model_loaded": model is not None,
            "model_path": MODEL_PATH
        }

    # Add MinIO status
    minio_status = {
        "minio_available": MINIO_AVAILABLE,
        "minio_initialized": minio_client is not None
    }

    return {"status": "healthy", **model_info, **minio_status}


@app.get("/model-info")
async def model_info():
    """Get detailed model information"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    info = {
        "model_path": MODEL_PATH,
        "model_type": "YOLO",
        "framework": "PyTorch",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "box_confidence_threshold": BOX_CONFIDENCE_THRESHOLD,
        "note": f"Custom trained model. Confidence thresholds - General: {CONFIDENCE_THRESHOLD}, Box: {BOX_CONFIDENCE_THRESHOLD}",
    }

    if hasattr(model, 'names'):
        info["classes"] = model.names
        info["num_classes"] = len(model.names)

    return info


@app.post("/save-to-minio")
async def save_to_minio_endpoint(
    session_id: str = Form(...),
    original_image_base64: str = Form(None),
    annotated_image_base64: str = Form(None),
    original_filename: str = Form("unknown.jpg")
):
    """
    Save images to MinIO after detection

    This endpoint allows saving images to MinIO after the initial detection,
    useful for manual save workflows.
    """
    if minio_client is None:
        raise HTTPException(status_code=500, detail="MinIO client not available")

    try:
        storage_info = {}

        # Save original image if provided
        if original_image_base64:
            original_data = base64.b64decode(original_image_base64)
            success_original, original_obj_name, original_url = minio_client.upload_file(
                file_data=original_data,
                original_filename=f"original_{original_filename}",
                prefix=f"original/{session_id}",
                content_type="image/jpeg"
            )

            if success_original:
                storage_info["original"] = {
                    "object_name": original_obj_name,
                    "url": original_url,
                    "stored": True
                }

        # Save annotated image if provided
        if annotated_image_base64:
            annotated_data = base64.b64decode(annotated_image_base64)
            success_annotated, annotated_obj_name, annotated_url = minio_client.upload_file(
                file_data=annotated_data,
                original_filename=f"annotated_{original_filename}",
                prefix=f"annotated/{session_id}",
                content_type="image/jpeg"
            )

            if success_annotated:
                storage_info["annotated"] = {
                    "object_name": annotated_obj_name,
                    "url": annotated_url,
                    "stored": True
                }

        return {
            "status": "success",
            "message": "Images saved to MinIO",
            "session_id": session_id,
            "storage": storage_info
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save to MinIO: {str(e)}")


@app.get("/minio-status")
async def minio_status():
    """Check MinIO connection and bucket status"""
    if minio_client is None:
        return {
            "status": "disabled",
            "message": "MinIO client not initialized"
        }

    try:
        # Check bucket exists
        bucket_exists = minio_client.client.bucket_exists(minio_client.bucket_name)

        # Try to list a few objects
        files = minio_client.list_files()

        return {
            "status": "connected",
            "bucket": minio_client.bucket_name,
            "bucket_exists": bucket_exists,
            "file_count": len(files),
            "endpoint": minio_client.endpoint
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")
