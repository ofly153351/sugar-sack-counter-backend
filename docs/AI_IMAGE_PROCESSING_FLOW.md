# AI Image Processing Flow - Frontend Integration Guide

## 📋 Overview

This document outlines the complete workflow for processing images through the AI service, storing them in MinIO, and integrating with the backend API. The recommended approach is to **upload images to MinIO first**, then send only the image paths to the backend.

## 🚀 Recommended Workflow

### 1. **Image Upload & AI Detection Flow**
```
Frontend → Python AI Service → MinIO → Backend
```

### 2. **Step-by-Step Process**

#### **Step 1: Capture/Select Image**
- User captures image using camera or selects from gallery
- Image should be in JPEG/PNG format
- Recommended max size: 1920x1080px (for faster processing)

#### **Step 2: Send to AI Service for Detection**
```javascript
// Example 1: For Sack Counting (use /detect-sacks)
const formData = new FormData();
formData.append('image', imageFile); // Send as file, not base64

// For sack counting sessions
const response = await fetch('http://localhost:8082/detect-sacks', {
  method: 'POST',
  body: formData,
  headers: {
    'X-Auto-Save': 'true',
    'X-Session-Id': countingSessionId,
    'X-Row-Number': rowNumber.toString(),
    'X-Detection-Type': 'sack', // Specify sack detection
  },
});

// Example 2: For Box Counting (use /detect-boxes)
const response = await fetch('http://localhost:8082/detect-boxes', {
  method: 'POST',
  body: formData,
  headers: {
    'X-Auto-Save': 'true',
    'X-Session-Id': countingSessionId,
    'X-Row-Number': rowNumber.toString(),
    'X-Detection-Type': 'box', // Specify box detection
  },
});

// Example 3: For Both (use /detect)
const response = await fetch('http://localhost:8082/detect', {
  method: 'POST',
  body: formData,
  headers: {
    'X-Auto-Save': 'true',
    'X-Session-Id': countingSessionId,
    'X-Row-Number': rowNumber.toString(),
  },
});

const aiResult = await response.json();
// Response for /detect-sacks: { sacks: 15, annotated_image_base64: "...", original_image_path: "...", annotated_image_path: "..." }
// Response for /detect-boxes: { boxes: 3, annotated_image_base64: "...", original_image_path: "...", annotated_image_path: "..." }
// Response for /detect: { sacks: 15, boxes: 3, annotated_image_base64: "...", original_image_path: "...", annotated_image_path: "..." }
```

#### **Step 3: Save Images to MinIO (via AI Service)**
```javascript
// The AI service automatically saves images when X-Auto-Save header is true
// Response includes MinIO paths based on detection type

// Example response for sack detection:
const sackResult = {
  sacks: 15,
  original_image_path: "sugar-sacks/original/sack/{session_id}/{timestamp}_{uuid}.jpg",
  annotated_image_path: "sugar-sacks/annotated/sack/{session_id}/{timestamp}_{uuid}_annotated.jpg",
  detection_type: "sack"
};

// Example response for box detection:
const boxResult = {
  boxes: 8,
  original_image_path: "sugar-sacks/original/box/{session_id}/{timestamp}_{uuid}.jpg",
  annotated_image_path: "sugar-sacks/annotated/box/{session_id}/{timestamp}_{uuid}_annotated.jpg",
  detection_type: "box"
};

// Example response for both detection:
const bothResult = {
  sacks: 15,
  boxes: 3,
  original_image_path: "sugar-sacks/original/sack/{session_id}/{timestamp}_{uuid}.jpg",
  annotated_image_path: "sugar-sacks/annotated/sack/{session_id}/{timestamp}_{uuid}_annotated.jpg",
  detection_type: "both"
};
```

#### **Step 4: Send Data to Backend**
```javascript
// Send only paths to backend (NOT base64 images!)

// Example 1: For Sack Row
const sackPayload = {
  countingSessionId: countingSessionId,
  rowNumber: rowNumber,
  weightType: "50kg", // Required for sack rows: "50kg", "100kg", or "custom"
  aiCount: aiResult.sacks, // from AI service
  finalCount: confirmedCount, // user confirmed count
  originalImagePath: aiResult.original_image_path, // from MinIO
  annotatedImagePath: aiResult.annotated_image_path, // from MinIO
};

const sackResponse = await fetch('http://localhost:3001/api/sack-rows/by-counting-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(sackPayload),
});

// Example 2: For Box Row (NO weightType field!)
const boxPayload = {
  countingSessionId: countingSessionId,
  rowNumber: rowNumber,
  aiCount: aiResult.boxes, // from AI service
  finalCount: confirmedCount, // user confirmed count
  originalImagePath: aiResult.original_image_path, // from MinIO
  annotatedImagePath: aiResult.annotated_image_path, // from MinIO
};

const boxResponse = await fetch('http://localhost:3001/api/box-rows/by-counting-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify(boxPayload),
});
```

## 🔧 API Endpoints

### **Python AI Service (Port 8082)**
| Endpoint | Method | Description | Headers |
|----------|--------|-------------|---------|
| `/detect` | POST | Detect both sacks and boxes | `X-Auto-Save: true` (optional) |
| `/detect-sacks` | POST | Detect only sacks | `X-Session-Id: {id}` (for auto-save) |
| `/detect-boxes` | POST | Detect only boxes | `X-Session-Id: {id}` (for auto-save) |
| `/save-to-minio` | POST | Manual save to MinIO | `X-Row-Number: {number}` (for auto-save) |
| `/health` | GET | Service health check | - |
| `/model-info` | GET | AI model information | - |
| `/minio-status` | GET | MinIO connection status | - |

### **Backend API (Port 3001)**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sack-rows/by-counting-session` | POST | Create sack row with image paths |
| `/api/box-rows/by-counting-session` | POST | Create box row with image paths |
| `/api/counting-sessions` | POST | Create counting session |

## 📦 Payload Examples

### **Create Sack Row (Recommended)**
```json
{
  "countingSessionId": "51b59227-5b08-42f6-8f0e-101a9e972579",
  "rowNumber": 1,
  "weightType": "50kg", // REQUIRED: must be "50kg", "100kg", or "custom"
  "aiCount": 15, // from AI service (/detect-sacks endpoint)
  "finalCount": 14, // user confirmed count
  "originalImagePath": "sugar-sacks/original/sack/51b59227-5b08-42f6-8f0e-101a9e972579/1737542400000_uuid.jpg",
  "annotatedImagePath": "sugar-sacks/annotated/sack/51b59227-5b08-42f6-8f0e-101a9e972579/1737542400000_uuid_annotated.jpg"
}
```

### **Create Box Row**
```json
{
  "countingSessionId": "51b59227-5b08-42f6-8f0e-101a9e972579",
  "rowNumber": 1,
  // NO weightType field for box rows!
  "aiCount": 8, // from AI service (/detect-boxes endpoint)
  "finalCount": 8, // user confirmed count
  "originalImagePath": "sugar-sacks/original/box/51b59227-5b08-42f6-8f0e-101a9e972579/1737542400000_uuid.jpg",
  "annotatedImagePath": "sugar-sacks/annotated/box/51b59227-5b08-42f6-8f0e-101a9e972579/1737542400000_uuid_annotated.jpg"
}
```

### **Key Differences:**
- **Sack Rows:** Require `weightType` field, use `/detect-sacks` AI endpoint
- **Box Rows:** NO `weightType` field, use `/detect-boxes` AI endpoint
- **Image Paths:** Different folder structure (`sack/` vs `box/`)

### **Create Counting Session**
```json
{
  "sessionType": "sack",
  "userId": "user-uuid",
  "vehicleId": "vehicle-uuid",
  "sugarTypeId": "sugar-type-uuid",
  "totalCount": 0,
  "status": "in_progress"
}
// Note: DO NOT include totalWeight field
```

## 🗂️ MinIO Storage Structure

```
sugar-sacks/
├── original/
│   ├── sack/{session_id}/{timestamp}_{uuid}.jpg
│   └── box/{session_id}/{timestamp}_{uuid}.jpg
└── annotated/
    ├── sack/{session_id}/{timestamp}_{uuid}_annotated.jpg
    └── box/{session_id}/{timestamp}_{uuid}_annotated.jpg
```

## ⚠️ Common Issues & Solutions

### **Error 413: Request Entity Too Large**
**Problem:** Sending base64 images directly to backend
**Solution:** Use MinIO storage and send only paths

### **Error 404: Endpoint Not Found**
**Problem:** Wrong API endpoint
**Solution:** Use correct endpoints:
- Sack rows: `/api/sack-rows/by-counting-session` (requires weightType)
- Box rows: `/api/box-rows/by-counting-session` (NO weightType field)
- Counting sessions: `/api/counting-sessions` (NO ID in URL for POST, NO totalWeight field)

### **Error 400: Validation Errors**
**Problem:** Invalid payload fields
**Solution:** Ensure:
- No `bagWeight` field
- No `totalWeight` field for counting sessions
- `weightType` is one of: `"50kg"`, `"100kg"`, `"custom"` (for sack rows only)
- Box rows should NOT include `weightType` field
- All required fields are present

## 🎯 Best Practices

### **DO:**
1. ✅ Upload images to MinIO via AI service
2. ✅ Send only image paths to backend
3. ✅ Use `X-Auto-Save` header for automatic storage
4. ✅ Validate `weightType` values for sack rows
5. ✅ Omit `weightType` for box rows
6. ✅ Include session ID and row number in headers for auto-save
7. ✅ Use correct AI endpoint: `/detect-sacks` for sack counting, `/detect-boxes` for box counting

### **DON'T:**
1. ❌ Send base64 images to backend API
2. ❌ Include `bagWeight` field in payload
3. ❌ Include `totalWeight` field for counting sessions
4. ❌ Include `weightType` field for box rows
5. ❌ Use `POST /counting-sessions/{id}` (endpoint doesn't exist)
6. ❌ Skip image compression before sending to AI service
7. ❌ Use wrong AI endpoint (use /detect-sacks for sacks, /detect-boxes for boxes)

## 🔍 Testing Checklist

### **Frontend Integration Test**
- [ ] Image capture/selection works
- [ ] AI service detection returns correct counts
- [ ] Images saved to MinIO successfully
- [ ] Backend API accepts payload with image paths
- [ ] Error handling for failed uploads
- [ ] Progress indicators during processing

### **API Test**
- [ ] `POST /api/sack-rows/by-counting-session` with valid payload
- [ ] `POST /api/box-rows/by-counting-session` with valid payload
- [ ] `POST /api/counting-sessions` without `totalWeight`
- [ ] Authentication works with JWT tokens
- [ ] Image paths are stored correctly in database

## 📞 Support & Troubleshooting

### **Backend Issues**
- Check NestJS logs on port 3001
- Verify database connection
- Check Prisma migrations

### **AI Service Issues**
- Check Python service logs on port 8082
- Verify MinIO connection
- Check AI model loading

### **MinIO Issues**
- Access MinIO console: http://localhost:9001
- Default credentials: minioadmin / minioadmin
- Verify bucket exists: `sugar-sacks`

## 📈 Performance Tips

1. **Image Optimization:** Compress images before sending to AI service
2. **Parallel Processing:** Process multiple rows concurrently if needed
3. **Caching:** Cache AI results for similar images
4. **Batch Operations:** Consider batch API for multiple rows

---

**Last Updated:** February 2, 2026  
**Contact:** Backend Team / AI Integration Team