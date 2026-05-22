# Upload Image to Complete Detection Flow (`/detect-sack`)

ไฟล์หลัก: [`main.py`](./main.py)  
Endpoint: `POST /detect-sack`

## 1) รับไฟล์อัปโหลดและ validate

- รับ `file` แบบ `multipart/form-data`
- เช็คว่าเป็นไฟล์รูป (`image/*`)
- เช็คว่าโมเดลพร้อมใช้งาน

```python
@app.post("/detect-sack")
async def detect_sacks_only(
    file: UploadFile = File(...),
    save_to_minio: bool = Form(False),
    session_id: Optional[str] = Form(None)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    if model is None:
        raise HTTPException(status_code=500, detail="AI model not available")
```

## 2) อ่านรูปและ decode เป็น OpenCV image

```python
try:
    image_data = await file.read()
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
```

## 3) รันโมเดล YOLO และคัดเฉพาะ `sack`

- รัน `results = model(image)`
- วนทุก bounding box
- normalize class name
- เก็บเฉพาะ class `sack` ที่ผ่าน threshold
- นับ `sack_count`

```python
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
```

## 4) วาดกรอบบนรูปและแปลงเป็น base64

```python
annotated_image = draw_bounding_boxes(image.copy(), detections)
base64_image = image_to_base64(annotated_image)
```

## 5) บันทึกรูปลง MinIO (optional)

จะทำเมื่อ `save_to_minio=True` และ `minio_client` พร้อมใช้งาน

```python
storage_info = {}
if save_to_minio and minio_client is not None:
    _, buffer_original = cv2.imencode(".jpg", image)
    success_original, original_obj_name, original_url = minio_client.upload_file(
        file_data=buffer_original.tobytes(),
        original_filename=f"original_{file.filename}",
        prefix=f"original/{session_id}",
        content_type="image/jpeg"
    )

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
```

## 6) ตอบกลับว่าเสร็จ (`status: success`)

```python
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
```

## 7) กรณี error

```python
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
```
