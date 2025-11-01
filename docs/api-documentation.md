# Sugar Sack Counter API Documentation

## ภาพรวม (Overview)

API สำหรับระบบนับกระสอบน้ำตาลด้วย AI ประกอบด้วยระบบการยืนยันตัวตน การจัดการผู้ใช้งาน และการนับกระสอบน้ำตาล

## Base URL

```
http://localhost:3000
```

## การใช้งาน Swagger

สามารถดูและทดสอบ API ได้ที่: `http://localhost:3000/api`

## Authentication

ระบบใช้ JWT (JSON Web Token) สำหรับการยืนยันตัวตน

### ขั้นตอนการใช้งาน

1. **สมัครสมาชิก** - สร้างบัญชีผู้ใช้งานใหม่
2. **เข้าสู่ระบบ** - รับ JWT token
3. **ใช้ Token** - ส่งใน Header ของคำขอที่ต้องการการยืนยันตัวตน

### Header สำหรับการยืนยันตัวตน

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Authentication (`/auth`)

#### 1.1 สมัครสมาชิก
- **Method:** `POST`
- **URL:** `/auth/register`
- **Authentication:** ไม่ต้องใช้
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "access_token": "jwt-token-string"
}
```

#### 1.2 เข้าสู่ระบบ
- **Method:** `POST`
- **URL:** `/auth/login`
- **Authentication:** ไม่ต้องใช้
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "access_token": "jwt-token-string"
}
```

#### 1.3 ดูข้อมูลโปรไฟล์
- **Method:** `GET`
- **URL:** `/auth/profile`
- **Authentication:** ต้องใช้ JWT Token
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
```

#### 1.4 รีเฟรชโทเคน
- **Method:** `POST`
- **URL:** `/auth/refresh`
- **Authentication:** ต้องใช้ JWT Token
- **Response:**
```json
{
  "access_token": "new-jwt-token-string"
}
```

### 2. User Management (`/users`)

**หมายเหตุ:** Endpoints นี้ต้องใช้สิทธิ์แอดมิน

#### 2.1 สร้างผู้ใช้งานใหม่
- **Method:** `POST`
- **URL:** `/users`
- **Authentication:** ต้องใช้ JWT Token (แอดมินเท่านั้น)
- **Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### 2.2 ดึงข้อมูลผู้ใช้งานทั้งหมด
- **Method:** `GET`
- **URL:** `/users`
- **Authentication:** ต้องใช้ JWT Token (แอดมินเท่านั้น)
- **Response:**
```json
[
  {
    "id": "uuid-string",
    "email": "user1@example.com",
    "name": "John Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-string-2",
    "email": "user2@example.com",
    "name": "Jane Smith",
    "role": "admin",
    "created_at": "2024-01-02T00:00:00.000Z"
  }
]
```

#### 2.3 ดึงข้อมูลผู้ใช้งานตาม ID
- **Method:** `GET`
- **URL:** `/users/:id`
- **Authentication:** ต้องใช้ JWT Token
- **Parameters:**
  - `id` (path): ID ของผู้ใช้งาน
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### 2.4 อัพเดทข้อมูลผู้ใช้งาน
- **Method:** `PATCH`
- **URL:** `/users/:id`
- **Authentication:** ต้องใช้ JWT Token
- **Parameters:**
  - `id` (path): ID ของผู้ใช้งาน
- **Body:**
```json
{
  "email": "updated@example.com",
  "name": "Updated Name"
}
```
- **Response:**
```json
{
  "id": "uuid-string",
  "email": "updated@example.com",
  "name": "Updated Name",
  "role": "user",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### 2.5 ลบผู้ใช้งาน
- **Method:** `DELETE`
- **URL:** `/users/:id`
- **Authentication:** ต้องใช้ JWT Token (แอดมินเท่านั้น)
- **Parameters:**
  - `id` (path): ID ของผู้ใช้งาน
- **Response:**
```json
{
  "message": "ลบผู้ใช้งานสำเร็จ"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["error message"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

## ตัวอย่างการใช้งาน

### 1. การสมัครสมาชิกและเข้าสู่ระบบ

```javascript
// สมัครสมาชิก
const registerResponse = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe'
  })
});

// เข้าสู่ระบบ
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token } = await loginResponse.json();

// ใช้ token สำหรับคำขออื่นๆ
const profileResponse = await fetch('http://localhost:3000/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  }
});
```

### 2. การจัดการผู้ใช้งาน (สำหรับแอดมิน)

```javascript
// ดึงข้อมูลผู้ใช้งานทั้งหมด
const usersResponse = await fetch('http://localhost:3000/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  }
});
```

## หมายเหตุ

1. **รหัสผ่าน** ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
2. **อีเมล** ต้องเป็นรูปแบบที่ถูกต้องและไม่ซ้ำกัน
3. **JWT Token** จะหมดอายุหลังจากระยะเวลาหนึ่ง ใช้ endpoint `/auth/refresh` เพื่อขอ token ใหม่
4. **สิทธิ์การเข้าถึง** Endpoints บางอย่างต้องการสิทธิ์แอดมินเท่านั้น
5. **CORS** เปิดใช้งานแล้วสำหรับการพัฒนา

## การพัฒนาเพิ่มเติม

ระบบนี้รองรับการขยายฟังก์ชันการทำงานต่อไปนี้:
- การจัดการรถขนส่ง
- การนับกระสอบน้ำตาล
- การนับกล่อง
- การอัปโหลดภาพและประมวลผลด้วย AI
- Dashboard สำหรับแอดมิน