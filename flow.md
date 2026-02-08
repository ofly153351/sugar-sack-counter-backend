# Sugar Sack Counter System - Workflow Documentation (Updated)

## Overview
ระบบนับถุงน้ำตาล (Sugar Sack Counter) เป็นระบบสำหรับบันทึกและจัดการการนับถุงน้ำตาลจากรถบรรทุก แบ่งออกเป็น 2 ประเภทหลัก:
1. **การนับถุง (Sack Counting)** - นับเป็นถุง
2. **การนับกล่อง (Box Counting)** - นับเป็นกล่อง

## Core Entities
- **User** - ผู้ใช้งานระบบ (admin, operator, viewer)
- **Vehicle** - รถบรรทุกที่ขนส่งน้ำตาล
- **SugarType** - ประเภทน้ำตาล (ทรายขาว, ทรายแดง, ฯลฯ)
- **CountingSession** - เซสชันการนับหลัก
- **SackCountingSession** - เซสชันการนับถุง (ถ้ามี)
- **BoxCountingSession** - เซสชันการนับกล่อง (ถ้ามี)

## Authentication Flow
```
Frontend → POST /api/auth/login → Verify Credentials → Generate JWT → Set Cookie
```

## Main Workflows

### 1. การสร้าง Counting Session (เริ่มต้นการนับ)
```
Frontend → POST /api/counting-sessions → Create CountingSession + SackCountingSession → Return CountingSession ID
```

**ระบบจะทำอัตโนมัติ:**
- สร้าง CountingSession พร้อม sessionType
- สร้าง SackCountingSession หรือ BoxCountingSession ตาม sessionType
- เชื่อมโยงทั้งสองตารางด้วย foreign key

**Request Body:**
```json
{
  "sessionType": "sack",
  "userId": "uuid",
  "vehicleId": "uuid", 
  "sugarTypeId": "uuid",
  "countingDate": "2024-01-01T10:00:00.000Z",
  "status": "in_progress",
  "totalCount": 0
}
```

**Response:**
```json
{
  "id": "counting-session-uuid",
  "sessionType": "sack",
  "sackSessionId": "sack-session-uuid",
  // ... other fields
}
```

### 2. การนับถุงน้ำตาล (Sack Counting Workflow) - แบบใหม่
```
1. สร้าง CountingSession (sessionType: 'sack') → ได้ countingSessionId
2. สร้าง SackRow โดยใช้ countingSessionId (2 วิธี):
   วิธี A: POST /api/sack-rows/by-counting-session
   วิธี B: ดึง sackSessionId ก่อน → POST /api/sack-rows
3. ระบบอัพเดท totals อัตโนมัติใน SackCountingSession และ CountingSession
4. เปลี่ยนสถานะเป็น 'completed'
```

**วิธี A (แนะนำ): ใช้ countingSessionId โดยตรง**
```javascript
POST /api/sack-rows/by-counting-session
{
  "countingSessionId": "counting-session-uuid",
  "rowNumber": 1,
  "weightType": "50kg",
  "finalCount": 24
}
```

**วิธี B: ดึง sackSessionId ก่อน**
```javascript
// 1. ดึง sackSessionId
GET /api/counting-sessions/{countingSessionId}/sack-session-id

// 2. สร้าง SackRow
POST /api/sack-rows
{
  "sessionId": "sack-session-uuid-from-response",
  "rowNumber": 1,
  "weightType": "50kg",
  "finalCount": 24
}
```

### 3. การนับกล่องน้ำตาล (Box Counting Workflow)  
```
1. สร้าง CountingSession (sessionType: 'box') → ได้ countingSessionId
2. สร้าง BoxRow โดยใช้ countingSessionId
3. ระบบอัพเดท totals อัตโนมัติ
4. เปลี่ยนสถานะเป็น 'completed'
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ข้อมูลผู้ใช้ปัจจุบัน

### Users
- `GET /api/users/me` - ข้อมูลผู้ใช้ปัจจุบัน
- `GET /api/users` - รายการผู้ใช้ทั้งหมด
- `GET /api/users/:id` - ข้อมูลผู้ใช้ตาม ID
- `PATCH /api/users/:id` - อัพเดทข้อมูลผู้ใช้
- `DELETE /api/users/:id` - ลบผู้ใช้

### Vehicles
- `GET /api/vehicles` - รายการรถทั้งหมด
- `GET /api/vehicles/active` - รถที่ใช้งานอยู่
- `GET /api/vehicles/:id` - ข้อมูลรถตาม ID
- `POST /api/vehicles` - สร้างรถใหม่
- `PATCH /api/vehicles/:id` - อัพเดทข้อมูลรถ
- `DELETE /api/vehicles/:id` - ลบรถ

### Vehicle Types
- `GET /api/vehicle-types` - ประเภทรถทั้งหมด
- `POST /api/vehicle-types` - สร้างประเภทรถใหม่

### Sugar Types
- `GET /api/sugar-types` - ประเภทน้ำตาลทั้งหมด
- `GET /api/sugar-types/active` - ประเภทน้ำตาลที่ใช้งานอยู่
- `POST /api/sugar-types` - สร้างประเภทน้ำตาลใหม่
- `PATCH /api/sugar-types/:id` - อัพเดทประเภทน้ำตาล
- `DELETE /api/sugar-types/:id` - ลบประเภทน้ำตาล

### Counting Sessions
- `GET /api/counting-sessions` - เซสชันการนับทั้งหมด
- `GET /api/counting-sessions/type/:sessionType` - เซสชันตามประเภท
- `GET /api/counting-sessions/user/:userId` - เซสชันตามผู้ใช้
- `GET /api/counting-sessions/vehicle/:vehicleId` - เซสชันตามรถ
- `POST /api/counting-sessions` - สร้างเซสชันใหม่ (สร้าง sack/box session อัตโนมัติ)
- `PATCH /api/counting-sessions/:id` - อัพเดทเซสชัน
- `DELETE /api/counting-sessions/:id` - ลบเซสชัน
- `GET /api/counting-sessions/:id/sack-session-id` - ดึง sackSessionId
- `GET /api/counting-sessions/:id/box-session-id` - ดึง boxSessionId

## Data Relationships
```
CountingSession
├── user (User)
├── vehicle (Vehicle)
├── sugarType (SugarType)
├── sackSession (SackCountingSession) [optional]
│   └── sackRows (SackRow[])
└── boxSession (BoxCountingSession) [optional]
    └── boxRows (BoxRow[])
```

## Status Flow
```
in_progress → counting → reviewing → completed
           ↘ cancelled
```

## Error Handling
- **400** - Bad Request (ข้อมูลไม่ถูกต้อง)
- **401** - Unauthorized (ไม่มีสิทธิ์)
- **404** - Not Found (ไม่พบข้อมูล) - เช่น "Sack counting session with ID ... not found"
- **409** - Conflict (ข้อมูลซ้ำ)
- **500** - Internal Server Error (เซิร์ฟเวอร์ผิดพลาด)

**ข้อผิดพลาดที่พบบ่อย:**
- `404: Sack counting session with ID ... not found` → ใช้ countingSessionId แทนที่จะเป็น sackSessionId
- **แก้ไข:** ใช้ `POST /api/sack-rows/by-counting-session` แทน `POST /api/sack-rows`

## Security
- JWT Authentication สำหรับทุก endpoint
- CORS configured สำหรับ frontend
- Cookie-based session management
- Input validation ด้วย class-validator

## Development Notes
1. เริ่มต้นด้วยการ seed database (`npm run seed`)
2. รัน development server (`npm run start:dev`)
3. ทดสอบผ่าน Swagger UI (`http://localhost:3000/api`)
4. ใช้ environment variables จาก `.env` file

## Deployment
1. Build production: `npm run build`
2. Run migrations: `npm run migration:run`
3. Start server: `npm run start:prod`

## Frontend Integration
- Base URL: `http://localhost:3000/api`
- Authentication: JWT token ใน Authorization header
- CORS: อนุญาต `http://localhost:3001`
- Error handling: ตรวจสอบ status code และ error messages

**Workflow สำหรับ Frontend Developer:**

### การนับถุงน้ำตาล:
```javascript
// 1. สร้าง CountingSession
const countingSession = await axios.post('/api/counting-sessions', {
  sessionType: 'sack',
  userId: 'user-uuid',
  vehicleId: 'vehicle-uuid',
  sugarTypeId: 'sugar-type-uuid',
  status: 'in_progress',
  totalCount: 0
});

const countingSessionId = countingSession.data.id;

// 2. สร้าง SackRow (วิธีแนะนำ)
await axios.post('/api/sack-rows/by-counting-session', {
  countingSessionId: countingSessionId,
  rowNumber: 1,
  weightType: '50kg',
  finalCount: 24
});

// 3. อัพเดทสถานะเมื่อเสร็จสิ้น
await axios.patch(`/api/counting-sessions/${countingSessionId}`, {
  status: 'completed'
});
```

**หมายเหตุสำคัญ:** อย่าส่ง countingSessionId ไปที่ `POST /api/sack-rows` (ต้องใช้ sackSessionId) ให้ใช้ `POST /api/sack-rows/by-counting-session` แทน