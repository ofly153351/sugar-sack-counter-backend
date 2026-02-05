# Sugar Sack Counter AI Service

FastAPI-based AI service for detecting sugar sacks and boxes using YOLOv8 custom trained model.

## 🚀 Quick Start

### 1. Start the Service
```bash
./start.sh
```
Or manually:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

Service runs on: `http://localhost:8082`

### 2. Check Service Status
```bash
curl http://localhost:8082/health
```

## 📡 API Endpoints

### 🔍 Health Check
**GET** `/health`
```bash
curl http://localhost:8082/health
```
Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_classes": {
    "0": "box",
    "1": "sack"
  },
  "model_path": "best.pt",
  "minio_available": true,
  "minio_initialized": true
}
```

### 📊 Model Information
**GET** `/model-info`
```bash
curl http://localhost:8082/model-info
```
Response:
```json
{
  "model_path": "best.pt",
  "model_type": "YOLO",
  "framework": "PyTorch",
  "confidence_threshold": 0.2,
  "note": "Custom trained model may require lower confidence threshold",
  "classes": {
    "0": "box",
    "1": "sack"
  },
  "num_classes": 2
}
```

### 🖼️ Detect Objects (Sacks & Boxes)
**POST** `/detect`

Detect both sugar sacks and boxes in an image.

**Parameters (form-data):**
- `file`: Image file (required)
- `save_to_minio`: true/false (optional, default: false)
- `session_id`: Session ID for grouping (optional)

**Example:**
```bash
curl -X POST \
  -F "file=@image.jpg" \
  -F "save_to_minio=false" \
  -F "session_id=session_abc123" \
  http://localhost:8082/detect
```

**Response:**
```json
{
  "status": "success",
  "total_count": 5,
  "sack_count": 3,
  "box_count": 2,
  "annotated_image": "base64_encoded_image_string",
  "detections": [
    {
      "class": "sack",
      "confidence": 0.89,
      "bbox": [100.5, 150.2, 200.3, 300.1]
    },
    {
      "class": "box",
      "confidence": 0.78,
      "bbox": [250.0, 180.5, 350.2, 280.7]
    }
  ],
  "session_id": "session_abc123",
  "save_to_minio": false
}
```

### 🎯 Detect Only Sacks
**POST** `/detect-sacks`

Detect only sugar sacks (ignore boxes).

**Parameters (form-data):**
- `file`: Image file (required)
- `save_to_minio`: true/false (optional, default: false)
- `session_id`: Session ID for grouping (optional)

**Example:**
```bash
curl -X POST \
  -F "file=@image.jpg" \
  -F "save_to_minio=true" \
  -F "session_id=session_abc123" \
  http://localhost:8082/detect-sacks
```

**Response:**
```json
{
  "status": "success",
  "sack_count": 3,
  "annotated_image": "base64_encoded_image_string",
  "detections": [
    {
      "class": "sack",
      "confidence": 0.89,
      "bbox": [100.5, 150.2, 200.3, 300.1]
    }
  ],
  "session_id": "session_abc123",
  "save_to_minio": true,
  "storage": {
    "original_stored": true,
    "annotated_stored": true,
    "original_object_name": "original/sack/session_abc123/20250131_143022_a1b2c3d4.jpg",
    "annotated_object_name": "annotated/sack/session_abc123/20250131_143022_a1b2c3d4_annotated.jpg",
    "original_url": "http://localhost:9000/sugar-sack-images/...",
    "annotated_url": "http://localhost:9000/sugar-sack-images/...",
    "session_id": "session_abc123"
  }
}
```

### 💾 Save Images to MinIO (Manual)
**POST** `/save-to-minio`

Save images to MinIO storage after detection (for manual save workflow).

**Parameters (form-data):**
- `session_id`: Session ID (required)
- `original_image_base64`: Base64 encoded original image (optional)
- `annotated_image_base64`: Base64 encoded annotated image (optional)
- `original_filename`: Original filename (required if images provided)

**Example:**
```bash
curl -X POST \
  -F "session_id=session_abc123" \
  -F "annotated_image_base64=[base64_string]" \
  -F "original_filename=row_1.jpg" \
  http://localhost:8082/save-to-minio
```

**Response:**
```json
{
  "status": "success",
  "message": "Images saved to MinIO",
  "session_id": "session_abc123",
  "storage": {
    "original": {
      "object_name": "original/sack/session_abc123/20250131_143022_a1b2c3d4.jpg",
      "url": "http://localhost:9000/sugar-sack-images/...",
      "stored": true
    },
    "annotated": {
      "object_name": "annotated/sack/session_abc123/20250131_143022_a1b2c3d4_annotated.jpg",
      "url": "http://localhost:9000/sugar-sack-images/...",
      "stored": true
    }
  }
}
```

### 🔧 MinIO Status
**GET** `/minio-status`
```bash
curl http://localhost:8082/minio-status
```
Response:
```json
{
  "status": "connected",
  "bucket": "sugar-sack-images",
  "bucket_exists": true,
  "file_count": 10,
  "endpoint": "localhost:9000"
}
```

## 🗄️ Database Schema Integration

### Session & Row Structure
```
SackCountingSession (แม่)
├── id: session_abc123
├── vehicleId: รถบรรทุก
├── sugarTypeId: ประเภทน้ำตาล
├── userId: ผู้ใช้งาน
├── totalSacks: 120 (รวมจากทุก rows)
└── sackRows[] (ลูก)
    ├── SackRow 1
    │   ├── sessionId: session_abc123
    │   ├── rowNumber: 1
    │   ├── aiCount: 25
    │   ├── finalCount: 24
    │   ├── originalImagePath: "original/sack/session_abc123/..."
    │   └── annotatedImagePath: "annotated/sack/session_abc123/..."
    └── SackRow 2
        └── ...
```

### Box Session Structure
```
BoxCountingSession (แม่)
├── id: session_def456
├── vehicleId: รถบรรทุก
├── sugarTypeId: ประเภทน้ำตาล
├── userId: ผู้ใช้งาน
├── totalBoxes: 50 (รวมจากทุก rows)
└── boxRows[] (ลูก)
    ├── BoxRow 1
    │   ├── sessionId: session_def456
    │   ├── rowNumber: 1
    │   ├── aiCount: 12
    │   ├── finalCount: 12
    │   ├── originalImagePath: "original/box/session_def456/..."
    │   └── annotatedImagePath: "annotated/box/session_def456/..."
    └── BoxRow 2
        └── ...
```

## 🎯 Frontend Integration Guide

### Workflow 1: Auto-Save (Recommended)
```javascript
// 1. สร้าง session ใน database ก่อน
const session = await createSackCountingSession({
  vehicleId: "vehicle_001",
  sugarTypeId: "sugar_type_001",
  userId: "user_001"
});

// 2. อัปโหลดรูปและบันทึกทันที
const formData = new FormData();
formData.append('file', imageFile);
formData.append('save_to_minio', 'true');
formData.append('session_id', session.id);

const response = await fetch('http://localhost:8082/detect', {
  method: 'POST',
  body: formData
});

const result = await response.json();

// 3. บันทึก row ใน database
const row = await createSackRow({
  sessionId: session.id,
  rowNumber: 1,
  aiCount: result.sack_count,
  finalCount: result.sack_count,
  originalImagePath: result.storage?.original_object_name,
  annotatedImagePath: result.storage?.annotated_object_name
});

// 4. อัปเดต session total
await updateSessionTotal(session.id, result.sack_count);
```

### Workflow 2: Manual Save
```javascript
// 1. สร้าง session ใน database
const session = await createSackCountingSession({
  vehicleId: "vehicle_001",
  sugarTypeId: "sugar_type_001",
  userId: "user_001"
});

// 2. อัปโหลดรูป (ไม่บันทึกทันที)
const formData = new FormData();
formData.append('file', imageFile);
formData.append('save_to_minio', 'false');
formData.append('session_id', session.id);

const response = await fetch('http://localhost:8082/detect', {
  method: 'POST',
  body: formData
});

const result = await response.json();

// 3. แสดงผลให้ผู้ใช้เห็น
showDetectionResult(result);

// 4. เมื่อผู้ใช้กด "Save"
const saveFormData = new FormData();
saveFormData.append('session_id', session.id);
saveFormData.append('annotated_image_base64', result.annotated_image);
saveFormData.append('original_filename', imageFile.name);

const saveResponse = await fetch('http://localhost:8082/save-to-minio', {
  method: 'POST',
  body: saveFormData
});

const saveResult = await saveResponse.json();

// 5. บันทึก row ใน database
const row = await createSackRow({
  sessionId: session.id,
  rowNumber: 1,
  aiCount: result.sack_count,
  finalCount: result.sack_count,
  originalImagePath: saveResult.storage?.original?.object_name,
  annotatedImagePath: saveResult.storage?.annotated?.object_name
});
```

### Workflow สำหรับ Box
```javascript
// สำหรับกล่อง (box) ใช้ endpoint เดียวกัน แต่เก็บข้อมูลต่างกัน
const response = await fetch('http://localhost:8082/detect', {
  method: 'POST',
  body: formData
});

const result = await response.json();

// บันทึกเป็น BoxRow แทน SackRow
const boxRow = await createBoxRow({
  sessionId: boxSession.id,
  rowNumber: 1,
  aiCount: result.box_count,
  finalCount: result.box_count,
  originalImagePath: result.storage?.original_object_name,
  annotatedImagePath: result.storage?.annotated_object_name
});
```

## 📁 MinIO Storage Structure

```
sugar-sack-images/
├── original/
│   ├── sack/
│   │   ├── session_abc123/
│   │   │   ├── 20250131_143022_a1b2c3d4.jpg
│   │   │   └── 20250131_143025_e5f6g7h8.jpg
│   │   └── session_def456/
│   │       └── ...
│   └── box/
│       ├── session_ghi789/
│       │   ├── 20250131_143030_i9j0k1l2.jpg
│       │   └── ...
│       └── ...
└── annotated/
    ├── sack/
    │   ├── session_abc123/
    │   │   ├── 20250131_143022_a1b2c3d4_annotated.jpg
    │   │   └── 20250131_143025_e5f6g7h8_annotated.jpg
    │   └── ...
    └── box/
        ├── session_ghi789/
        │   ├── 20250131_143030_i9j0k1l2_annotated.jpg
        │   └── ...
        └── ...
```

## ⚙️ Configuration

### Environment Variables
Create `.env` file:
```env
# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET_NAME=sugar-sack-images

# AI Model Configuration
MODEL_PATH=best.pt
CONFIDENCE_THRESHOLD=0.2

# Server Configuration
HOST=0.0.0.0
PORT=8082
```

### Model Information
- **Model**: Custom trained YOLOv8
- **Classes**: `box` (0), `sack` (1)
- **Confidence Threshold**: 0.2 (adjustable)
- **Input Size**: 640×640 pixels
- **Output**: Bounding boxes with confidence scores

## 🐛 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check port 8082
   lsof -ti:8082 | xargs kill -9
   # Restart service
   python3 main.py
   ```

2. **Model not loading**
   - Ensure `best.pt` exists in the directory
   - Check file permissions
   - Verify model was trained with compatible YOLO version

3. **MinIO connection failed**
   - Check MinIO server is running: `docker ps | grep minio`
   - Verify credentials in `.env` file
   - Test connection: `curl http://localhost:9000/minio/health/live`

4. **Low detection accuracy**
   - Try lowering confidence threshold in code
   - Ensure good lighting and image quality
   - Verify model was trained on similar images

## 📞 Support

For issues with:
- **AI Detection**: Check model loading and confidence threshold
- **MinIO Storage**: Verify connection and bucket permissions
- **API Integration**: Review request/response formats above
- **Database**: Ensure proper session/row relationships

## 📄 License

MIT License - See LICENSE file for details.