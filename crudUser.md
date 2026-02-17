# CRUD User (Admin)

Global prefix ของระบบคือ `/api`

อ้างอิง: `src/main.ts:22`

## User CRUD Endpoints

1. **Create User**
- Method: `POST`
- URL: `/api/users`
- อ้างอิง: `src/modules/user/user.controller.ts:30`
- Payload (Body):
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "employeeCode": "ADM001",
  "phone": "0923322145",
  "title": "Mr."
}
```
- Required fields: `email`, `password`, `username`, `firstName`, `lastName`
- Optional fields: `employeeCode`, `phone`, `title`
- Validation/constraints:
  - `email` ต้องเป็นรูปแบบอีเมล
  - `password` อย่างน้อย 6 ตัวอักษร
  - `phone` ยาวไม่เกิน 10 ตัวอักษร (ตรวจใน service)
- DTO อ้างอิง: `src/modules/user/dto/create-user.dto.ts:9`

2. **Read Users (All)**
- Method: `GET`
- URL: `/api/users`
- อ้างอิง: `src/modules/user/user.controller.ts:67`
- Payload (Body): ไม่มี

3. **Read User By ID**
- Method: `GET`
- URL: `/api/users/:id`
- อ้างอิง: `src/modules/user/user.controller.ts:139`
- Path Params:
  - `id` (string)
- Payload (Body): ไม่มี

4. **Update User**
- Method: `PATCH`
- URL: `/api/users/:id`
- อ้างอิง: `src/modules/user/user.controller.ts:176`
- Path Params:
  - `id` (string)
- Payload (Body) - ส่งเฉพาะ field ที่ต้องการแก้:
```json
{
  "email": "updated@example.com",
  "username": "john.doe",
  "firstName": "John",
  "lastName": "Doe",
  "employeeCode": "ADM002",
  "phone": "0912345678",
  "title": "Mr."
}
```
- ทุก field เป็น optional
- Validation/constraints:
  - ถ้าส่ง `email` ต้องเป็นรูปแบบอีเมล
  - `phone` และ `employeeCode` ห้ามซ้ำกับคนอื่น
- DTO อ้างอิง: `src/modules/user/dto/update-user.dto.ts:4`

5. **Delete User**
- Method: `DELETE`
- URL: `/api/users/:id`
- อ้างอิง: `src/modules/user/user.controller.ts:225`
- Path Params:
  - `id` (string)
- Payload (Body): ไม่มี

## Admin Endpoints ที่เกี่ยวกับ User/Role

1. **Get Users (Admin)**
- Method: `GET`
- URL: `/api/admin/users`
- อ้างอิง: `src/modules/admin/admin.controller.ts:94`
- Payload (Body): ไม่มี

2. **Promote User to Admin**
- Method: `PATCH`
- URL: `/api/admin/users/:id/make-admin`
- อ้างอิง: `src/modules/admin/admin.controller.ts:133`
- Path Params:
  - `id` (string)
- Payload (Body): ไม่มี

3. **Update User Role**
- Method: `PATCH`
- URL: `/api/admin/users/:id/role`
- อ้างอิง: `src/modules/admin/admin.controller.ts:168`
- Path Params:
  - `id` (string)
- Payload (Body):
```json
{
  "role": "operator"
}
```
- Allowed values ของ `role`: `admin`, `user`, `operator`, `viewer`
- DTO อ้างอิง: `src/modules/admin/dto/update-user-role.dto.ts:6`

## หมายเหตุเรื่องสิทธิ์

- เส้นทาง `admin/*` บังคับสิทธิ์ admin ด้วย `JwtAuthGuard + RolesGuard + @Roles('admin')`
  - อ้างอิง: `src/modules/admin/admin.controller.ts:12`
- เส้นทาง `users/*` ปัจจุบันบังคับแค่ login (`JwtAuthGuard`) และยังไม่ได้บังคับ role admin โดยตรง
  - อ้างอิง: `src/modules/user/user.controller.ts:31`
