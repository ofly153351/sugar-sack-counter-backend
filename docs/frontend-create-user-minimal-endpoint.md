# Create User (Minimal Payload) Endpoint

## Purpose
ใช้ endpoint นี้สำหรับสร้างผู้ใช้ใหม่โดยส่งข้อมูลขั้นต่ำแค่ `username` และ `password`

## Endpoint
- Method: `POST`
- URL: `/api/users`
- Auth: ต้องส่ง `Bearer token` (ตาม guard ปัจจุบันของระบบ)

## Minimal Request Body
```json
{
  "username": "newuser01",
  "password": "password123"
}
```

## Optional Fields
สามารถส่งเพิ่มได้ (ไม่บังคับ):
- `email`
- `firstName`
- `lastName`
- `employeeCode`
- `phone`
- `title`

## Backend Default Behavior
ถ้าไม่ส่ง `email`:
- ระบบจะสร้างอัตโนมัติจาก `username` เช่น `newuser01@local.user`
- ถ้า email ที่ generate ซ้ำ จะเติมเลขต่อท้าย เช่น `newuser011@local.user`

ถ้าไม่ส่งข้อมูล profile:
- `firstName = "Unknown"`
- `lastName = "User"`
- `title = "Mr."`
- `position = "User"`

## cURL Example
```bash
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "username": "newuser01",
    "password": "password123"
  }'
```

## Success Response (201) Example
```json
{
  "id": "uuid-string",
  "roleId": "uuid-role",
  "username": "newuser01",
  "email": "newuser01@local.user",
  "createdAt": "2026-02-25T00:00:00.000Z",
  "updatedAt": "2026-02-25T00:00:00.000Z"
}
```

## Error Cases
- `400 Bad Request`: payload ไม่ผ่าน validation (เช่น password < 6 ตัว)
- `401 Unauthorized`: ไม่มี token หรือ token ไม่ถูกต้อง
- `409 Conflict`: `username` ซ้ำ, `email` ซ้ำ, หรือข้อมูลที่ต้อง unique ซ้ำ

## Axios Example
```ts
import axios from "axios";

type CreateUserMinimalPayload = {
  username: string;
  password: string;
};

export async function createUserMinimal(
  payload: CreateUserMinimalPayload,
  token: string
) {
  const res = await axios.post("/api/users", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}
```
