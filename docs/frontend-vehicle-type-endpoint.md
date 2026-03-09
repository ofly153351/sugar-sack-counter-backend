# Vehicle Type Endpoint (for Frontend)

## Purpose
ใช้ endpoint นี้เพื่อดึงรายการ `ประเภทรถ` สำหรับแสดงใน dropdown/select

## Endpoint
- Method: `GET`
- URL: `/vehicle-types/options`
- Auth: ต้องส่ง `Bearer token` ใน header `Authorization`

## Request Example
```bash
curl -X GET "http://localhost:3000/vehicle-types/options" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## Response Example (200)
```json
[
  {
    "id": "uuid-string",
    "name": "รถบรรทุก 10 ล้อ"
  },
  {
    "id": "uuid-string-2",
    "name": "รถบรรทุก 6 ล้อ"
  }
]
```

## Error Cases
- `401 Unauthorized` เมื่อไม่มี token หรือ token ไม่ถูกต้อง

## Frontend Mapping
สำหรับ component dropdown:
- `value` = `id`
- `label` = `name`

ตัวอย่าง options ที่ map แล้ว:
```json
[
  {
    "value": "uuid-string",
    "label": "รถบรรทุก 10 ล้อ"
  },
  {
    "value": "uuid-string-2",
    "label": "รถบรรทุก 6 ล้อ"
  }
]
```

## TypeScript Interface (Frontend)
```ts
export interface VehicleTypeOption {
  id: string;
  name: string;
}
```

## Axios Example
```ts
import axios from "axios";

export async function getVehicleTypeOptions(token: string) {
  const res = await axios.get<VehicleTypeOption[]>(
    "/vehicle-types/options",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
}
```

## Suggested Frontend Behavior
- โหลดข้อมูลตอนเปิดฟอร์มสร้าง/แก้ไขรถ
- แสดง loading state ระหว่างดึงข้อมูล
- ถ้า 401 ให้ redirect ไปหน้า login หรือ refresh token ตาม flow ที่ใช้อยู่
