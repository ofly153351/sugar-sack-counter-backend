# Sugar Sack Counter Backend - API Documentation

## Overview
ระบบนับถุงน้ำตาล (Sugar Sack Counter) เป็นระบบสำหรับบันทึกและจัดการการนับถุงน้ำตาลจากรถบรรทุก แบ่งออกเป็น 2 ประเภทหลัก:
1. **การนับถุง (Sack Counting)** - นับเป็นถุง
2. **การนับกล่อง (Box Counting)** - นับเป็นกล่อง

## Base URL
```
http://localhost:3000/api
```

## Authentication
ทุก endpoint ต้องใช้ JWT token (ยกเว้น login/register) โดยส่งในรูปแบบ:
- **Cookie:** `access_token=eyJhbGciOiJIUzI1NiIs...`
- **Authorization Header:** `Bearer eyJhbGciOiJIUzI1NiIs...`

## API Endpoints

### Authentication
#### POST `/auth/login`
เข้าสู่ระบบ

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### POST `/auth/logout`
ออกจากระบบ

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### POST `/auth/register`
สมัครสมาชิกใหม่

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0812345678",
  "position": "Warehouse Staff",
  "employeeCode": "EMP001"
}
```

#### GET `/auth/profile`
ข้อมูลผู้ใช้ปัจจุบัน

**Response:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "admin"
}
```

#### POST `/auth/verify`
ตรวจสอบ JWT token

**Request Body (optional):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "admin"
  }
}
```

### Users
#### GET `/users/me`
ข้อมูลผู้ใช้ปัจจุบัน (เหมือน `/auth/profile`)

#### GET `/users`
รายการผู้ใช้ทั้งหมด

**Response:**
```json
[
  {
    "id": "uuid-string",
    "username": "johndoe",
    "email": "john@example.com",
    "role": {
      "name": "admin"
    },
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "0812345678",
      "position": "Warehouse Staff"
    }
  }
]
```

#### GET `/users/:id`
ข้อมูลผู้ใช้ตาม ID

#### PATCH `/users/:id`
อัพเดทข้อมูลผู้ใช้

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "firstName": "NewFirstName",
  "lastName": "NewLastName",
  "phone": "0898765432"
}
```

**หมายเหตุ:** ไม่สามารถอัพเดท password ผ่าน endpoint นี้ได้

#### DELETE `/users/:id`
ลบผู้ใช้

### Vehicles
#### GET `/vehicles`
รายการรถทั้งหมด

**Query Parameters:**
- `status` (optional): filter ตามสถานะ (active, inactive, maintenance)
- `search` (optional): ค้นหาตาม vehicle code หรือ license plate

**Response:**
```json
[
  {
    "id": "uuid-string",
    "vehicleCode": "VH001",
    "licensePlate": "กข1234",
    "vehicleType": {
      "name": "รถบรรทุก 10 ล้อ"
    },
    "driverName": "สมชาย ใจดี",
    "status": "active"
  }
]
```

#### GET `/vehicles/active`
รถที่ใช้งานอยู่

#### GET `/vehicles/:id`
ข้อมูลรถตาม ID

#### POST `/vehicles`
สร้างรถใหม่

**Request Body:**
```json
{
  "vehicleCode": "VH009",
  "licensePlate": "กข9999",
  "vehicleTypeId": "uuid-string",
  "driverName": "สมชาย ใจดี",
  "status": "active"
}
```

#### PATCH `/vehicles/:id`
อัพเดทข้อมูลรถ

#### DELETE `/vehicles/:id`
ลบรถ

### Vehicle Types
#### GET `/vehicle-types`
ประเภทรถทั้งหมด

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "รถบรรทุก 10 ล้อ",
    "description": "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล"
  }
]
```

#### POST `/vehicle-types`
สร้างประเภทรถใหม่

**Request Body:**
```json
{
  "name": "รถบรรทุก 12 ล้อ",
  "description": "รถบรรทุกขนาดใหญ่พิเศษ"
}
```

### Sugar Types
#### GET `/sugar-types`
ประเภทน้ำตาลทั้งหมด

**Query Parameters:**
- `search` (optional): ค้นหาตามชื่อหรือคำอธิบาย

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "น้ำตาลทรายขาว",
    "description": "น้ำตาลทรายขาวบริสุทธิ์"
  }
]
```

#### GET `/sugar-types/active`
ประเภทน้ำตาลที่ใช้งานอยู่ (มีเซสชันการนับ)

#### POST `/sugar-types`
สร้างประเภทน้ำตาลใหม่

**Request Body:**
```json
{
  "name": "น้ำตาลทรายขาวพิเศษ",
  "description": "น้ำตาลทรายขาวเกรดพรีเมียม"
}
```

#### PATCH `/sugar-types/:id`
อัพเดทประเภทน้ำตาล

#### DELETE `/sugar-types/:id`
ลบประเภทน้ำตาล (ไม่สามารถลบประเภทที่มีเซสชันการนับได้)

### Counting Sessions
#### GET `/counting-sessions`
เซสชันการนับทั้งหมด

**Response:**
```json
[
  {
    "id": "uuid-string",
    "sessionType": "sack",
    "sackSessionId": "sack-session-uuid",
    "userId": "user-uuid",
    "vehicleId": "vehicle-uuid",
    "sugarTypeId": "sugar-type-uuid",
    "totalCount": 100,
    "totalWeight": 5000,
    "countingDate": "2024-01-01T10:00:00.000Z",
    "status": "completed",
    "user": {
      "id": "user-uuid",
      "username": "johndoe",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "vehicle": {
      "id": "vehicle-uuid",
      "vehicleCode": "V001",
      "licensePlate": "กข1234"
    },
    "sugarType": {
      "id": "sugar-type-uuid",
      "name": "น้ำตาลทรายขาว"
    },
    "sackSession": {
      "totalSacks": 100,
      "sackRows": [
        {
          "rowNumber": 1,
          "weightType": "50kg",
          "finalCount": 24
        }
      ]
    }
  }
]
```

#### GET `/counting-sessions/type/:sessionType`
เซสชันตามประเภท (sack หรือ box)

#### GET `/counting-sessions/user/:userId`
เซสชันตามผู้ใช้

#### GET `/counting-sessions/vehicle/:vehicleId`
เซสชันตามรถ

#### POST `/counting-sessions`
สร้างเซสชันใหม่

**Request Body:**
```json
{
  "sessionType": "sack",
  "userId": "user-uuid",
  "vehicleId": "vehicle-uuid",
  "sugarTypeId": "sugar-type-uuid",
  "countingDate": "2024-01-01T10:00:00.000Z",
  "status": "in_progress",
  "totalCount": 0
}
```

**ระบบจะทำอัตโนมัติ:**
- สร้าง SackCountingSession หรือ BoxCountingSession ตาม sessionType
- เชื่อมโยงกับ CountingSession

#### PATCH `/counting-sessions/:id`
อัพเดทเซสชัน

#### DELETE `/counting-sessions/:id`
ลบเซสชัน

#### GET `/counting-sessions/:id/sack-session-id`
ดึง sack session ID จาก counting session

**Response:**
```json
{
  "sackSessionId": "sack-session-uuid"
}
```

#### GET `/counting-sessions/:id/box-session-id`
ดึง box session ID จาก counting session

### Sack Rows
#### POST `/sack-rows`
สร้างแถวการนับถุง (ใช้ sackSessionId)

**Request Body:**
```json
{
  "sessionId": "sack-session-uuid",
  "rowNumber": 1,
  "weightType": "50kg",
  "aiCount": 25,
  "finalCount": 24,
  "imagePath": "uploads/sacks/session-uuid/row-1.jpg"
}
```

#### POST `/sack-rows/by-counting-session`
สร้างแถวการนับถุง (ใช้ countingSessionId - แนะนำ)

**Request Body:**
```json
{
  "countingSessionId": "counting-session-uuid",
  "rowNumber": 1,
  "weightType": "50kg",
  "finalCount": 24
}
```

#### GET `/sack-rows/session/:sessionId`
ดึงแถวทั้งหมดของ sack session

#### GET `/sack-rows/:id`
ดึงแถวตาม ID

#### PATCH `/sack-rows/:id`
อัพเดทแถว

#### DELETE `/sack-rows/:id`
ลบแถว

## Workflow Examples

### การนับถุงน้ำตาล (Sack Counting)
```
1. POST /counting-sessions → สร้าง counting session
2. POST /sack-rows/by-counting-session → สร้างแถวการนับ
3. PATCH /counting-sessions/:id → อัพเดทสถานะเป็น completed
```

### การนับกล่องน้ำตาล (Box Counting)
```
1. POST /counting-sessions → สร้าง counting session (sessionType: 'box')
2. สร้าง box rows (เมื่อมี endpoint)
3. PATCH /counting-sessions/:id → อัพเดทสถานะ
```

## Error Responses

### 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Bad Request"
}
```

### 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 409 - Conflict
```json
{
  "statusCode": 409,
  "message": "Resource already exists",
  "error": "Conflict"
}
```

### 500 - Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Data Models

### CountingSession
```typescript
{
  id: string;
  sessionType: 'sack' | 'box';
  sackSessionId?: string;
  boxSessionId?: string;
  userId: string;
  vehicleId: string;
  sugarTypeId: string;
  totalCount: number;
  totalWeight?: number;
  countingDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### SackRow
```typescript
{
  id: string;
  sessionId: string;
  rowNumber: number;
  weightType: '50kg' | '100kg' | 'custom';
  aiCount?: number;
  finalCount: number;
  imagePath?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Vehicle
```typescript
{
  id: string;
  vehicleCode: string;
  licensePlate: string;
  vehicleTypeId: string;
  driverName: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}
```

### SugarType
```typescript
{
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing with cURL

### Login
```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Counting Sessions
```bash
curl -X GET "http://localhost:3000/api/counting-sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Counting Session
```bash
curl -X POST "http://localhost:3000/api/counting-sessions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "sack",
    "userId": "user-uuid",
    "vehicleId": "vehicle-uuid",
    "sugarTypeId": "sugar-type-uuid",
    "status": "in_progress",
    "totalCount": 0
  }'
```

## Development Notes

1. **Environment Variables:** ต้องตั้งค่าใน `.env` file
2. **Database:** ใช้ PostgreSQL กับ Prisma ORM
3. **Seed Data:** รัน `npm run seed` เพื่อสร้างข้อมูลเริ่มต้น
4. **Swagger UI:** เข้าถึงได้ที่ `http://localhost:3000/api`
5. **CORS:** อนุญาต `http://localhost:3001` สำหรับ frontend

## Important Notes

1. **Authentication:** ทุก endpoint (ยกเว้น login/register) ต้องมี JWT token
2. **Session Types:** `sessionType` ต้องเป็น `'sack'` หรือ `'box'` เท่านั้น
3. **Weight Types:** `weightType` ต้องเป็น `'50kg'`, `'100kg'`, หรือ `'custom'`
4. **Data Integrity:** ไม่สามารถลบ sugar type ที่มี counting sessions ได้
5. **Automatic Creation:** เมื่อสร้าง counting session ระบบจะสร้าง sack/box session อัตโนมัติ