# Admin Dashboard Summary (12 Months)

## Endpoint
- Method: `GET`
- URL: `/api/admin/dashboard/summary`
- Auth: `Bearer token` และต้องมี role `admin`

## Purpose
ใช้ดึงข้อมูลสรุป dashboard แบบรายเดือนย้อนหลัง 12 เดือน สำหรับ:
- กระสอบ (`sacks`)
- กล่อง (`boxes`)

## Response Shape
```json
{
  "sacks": {
    "thisMonth": 120,
    "last12Months": [
      { "month": "2025-04", "total": 420 },
      { "month": "2025-05", "total": 510 }
    ]
  },
  "boxes": {
    "thisMonth": 60,
    "last12Months": [
      { "month": "2025-04", "total": 260 },
      { "month": "2025-05", "total": 310 }
    ]
  },
  "totalUsers": 150,
  "totalVehicles": 25,
  "range": {
    "startMonth": "2025-04",
    "endMonth": "2026-03"
  }
}
```

## Field Details
- `sacks.thisMonth`: ยอดรวมกระสอบของเดือนปัจจุบัน
- `sacks.last12Months[]`: รายเดือนย้อนหลัง 12 เดือน (รวมเดือนปัจจุบัน)
- `boxes.thisMonth`: ยอดรวมกล่องของเดือนปัจจุบัน
- `boxes.last12Months[]`: รายเดือนย้อนหลัง 12 เดือน (รวมเดือนปัจจุบัน)
- `month` format: `YYYY-MM`
- `range.startMonth` / `range.endMonth`: ช่วงเดือนของข้อมูลใน response

## Frontend Mapping
- แกน X ของกราฟ: `month`
- แกน Y ของกราฟ: `total`
- series 1: `sacks.last12Months`
- series 2: `boxes.last12Months`

## Axios Example
```ts
import axios from "axios";

export async function getAdminDashboardSummary(token: string) {
  const res = await axios.get("/api/admin/dashboard/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}
```

## Error Cases
- `401 Unauthorized`: ไม่มี token หรือ token ไม่ถูกต้อง
- `403 Forbidden`: token ถูกต้องแต่ไม่ใช่ admin
