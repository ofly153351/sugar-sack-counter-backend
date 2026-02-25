# Admin Reset User Password Endpoint (for Frontend)

## Purpose
ใช้ endpoint นี้เมื่อแอดมินต้องการเปลี่ยนรหัสผ่านให้ผู้ใช้งาน

## Endpoint
- Method: `PATCH`
- URL: `/admin/users/:id/password`
- Full URL (with global prefix): `/api/admin/users/:id/password`
- Auth: ต้องส่ง `Bearer token` ของผู้ใช้ที่มี role `admin`

## Path Params
- `id` (string, required): user id ของผู้ใช้ที่ต้องการเปลี่ยนรหัสผ่าน

## Request Body
```json
{
  "newPassword": "newpassword123"
}
```

## Validation
- `newPassword` ต้องเป็น string
- `newPassword` ต้องมีความยาวอย่างน้อย 6 ตัวอักษร

## Request Example (cURL)
```bash
curl -X PATCH "http://localhost:3000/api/admin/users/<USER_ID>/password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -d '{
    "newPassword": "newpassword123"
  }'
```

## Success Response (200)
```json
{
  "message": "User password updated successfully"
}
```

## Error Cases
- `400 Bad Request`: body ไม่ถูกต้อง หรือรหัสผ่านสั้นกว่า 6 ตัว
- `401 Unauthorized`: ไม่มี token หรือ token ไม่ถูกต้อง
- `403 Forbidden`: token ถูกต้องแต่ไม่ใช่ admin
- `404 Not Found`: ไม่พบ user ตาม `id`

## Axios Example
```ts
import axios from "axios";

type ResetUserPasswordPayload = {
  newPassword: string;
};

type ResetUserPasswordResponse = {
  message: string;
};

export async function adminResetUserPassword(
  userId: string,
  payload: ResetUserPasswordPayload,
  token: string
) {
  const res = await axios.patch<ResetUserPasswordResponse>(
    `/api/admin/users/${userId}/password`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}
```

## Suggested Frontend UX
- ใส่ confirm dialog ก่อน submit
- ตรวจความยาวรหัสผ่านขั้นต่ำที่หน้า UI ก่อนยิง API
- เมื่อสำเร็จให้แสดง toast `เปลี่ยนรหัสผ่านเรียบร้อย`
- ถ้า `403` ให้แสดงว่าไม่มีสิทธิ์ใช้งานฟีเจอร์นี้
