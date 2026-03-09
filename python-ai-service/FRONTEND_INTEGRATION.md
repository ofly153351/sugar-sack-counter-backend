# Frontend Integration Guide (bestTeacher.pt)

เอกสารนี้สรุปสิ่งที่ฝั่ง Frontend ต้องทำหลังเปลี่ยนโมเดลเป็น `bestTeacher.pt` โดย **response format เดิมยังเหมือนเดิม**

## 1. Backend Config ที่ต้องตรงกัน

ตั้งค่าใน `python-ai-service/.env`:

```env
MODEL_PATH=bestTeacher.pt
SACK_CLASS_NAME=bag
BOX_CLASS_NAME=bbox
CONFIDENCE_THRESHOLD=0.10
BOX_CONFIDENCE_THRESHOLD=0.10
```

หมายเหตุ:
- โมเดลใหม่มี class เช่น `bag`, `bbox`
- Backend จะ map อัตโนมัติ:
  - `bag` -> `sack`
  - `bbox` -> `box`
- ฝั่ง FE ยังคงใช้ field เดิม: `sack_count`, `box_count`, `detections[].class` (`sack`/`box`)

## 2. Flow ที่แนะนำสำหรับ FE

1. เรียก `GET /health` ตอนเปิดหน้า เพื่อเช็กว่าโมเดลพร้อมใช้งาน
2. อัปโหลดรูปด้วย `POST /detect` (`multipart/form-data`)
3. อ่านค่าจาก response เดิม:
   - `total_count`
   - `sack_count`
   - `box_count`
   - `annotated_image` (base64)
   - `detections`
4. แสดงภาพ annotated โดยแปลงเป็น `data:image/jpeg;base64,${annotated_image}`

## 3. API Contract ที่ FE ใช้

## `GET /health`

ตัวอย่าง response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_classes": {
    "0": "zone",
    "7": "bag",
    "9": "bbox"
  },
  "model_path": "bestTeacher.pt",
  "minio_available": true,
  "minio_initialized": true
}
```

## `POST /detect`

Request (`multipart/form-data`):
- `file` (required)
- `save_to_minio` (optional, `true/false`)
- `session_id` (optional)

Response (คงเดิม):

```json
{
  "status": "success",
  "total_count": 5,
  "sack_count": 3,
  "box_count": 2,
  "annotated_image": "base64...",
  "detections": [
    {
      "class": "sack",
      "confidence": 0.82,
      "bbox": [100.0, 120.0, 260.0, 420.0]
    },
    {
      "class": "box",
      "confidence": 0.74,
      "bbox": [300.0, 180.0, 450.0, 320.0]
    }
  ],
  "session_id": "abc12345",
  "save_to_minio": false
}
```

## 4. ตัวอย่างโค้ด Frontend (JS/TS)

```ts
const API_BASE = "http://localhost:8082";

export async function detectImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("save_to_minio", "false");

  const res = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Detect failed");
  }

  const data = await res.json();

  return {
    totalCount: data.total_count ?? 0,
    sackCount: data.sack_count ?? 0,
    boxCount: data.box_count ?? 0,
    detections: Array.isArray(data.detections) ? data.detections : [],
    annotatedImageUrl: data.annotated_image
      ? `data:image/jpeg;base64,${data.annotated_image}`
      : "",
    sessionId: data.session_id || "",
  };
}
```

## 5. Troubleshooting (เจอบ่อย)

- `sack_count = 0` และ `box_count = 0` ทั้งที่เห็นวัตถุในรูป
  - เช็ก `.env` ว่ามี `SACK_CLASS_NAME=bag` และ `BOX_CLASS_NAME=bbox`
  - ลด threshold ชั่วคราวเป็น `0.10`
- `AI model not available`
  - เช็กไฟล์ `bestTeacher.pt` อยู่ใน `python-ai-service/`
  - เช็ก `MODEL_PATH` ให้ถูกต้อง
- รูปไม่ขึ้น
  - ต้องต่อ prefix: `data:image/jpeg;base64,` ก่อนนำไปใส่ `<img src=...>`

