# Backend Summary: Vehicle Sack/Bag Row Config

เอกสารสรุปการเพิ่ม Backend สำหรับเก็บค่า "จำนวนกระสอบต่อแถวของรถ" ลงฐานข้อมูล

## สิ่งที่เพิ่มในระบบ

- เพิ่มคอลัมน์ `vehicle_row_conf` ในตาราง `vehicles`
- รองรับ payload ได้ทั้ง `sackRows` และ `bagRows` (alias)
- รองรับ item ได้ทั้ง `sackCount` และ `bagCount` (alias)
- API กลุ่ม `vehicles` คืนค่า
  - `sackRows`
  - `bagRows` (alias)
  - `totalSacks`

## โครงสร้าง DB

เพิ่มคอลัมน์ในตาราง `vehicles`:

- `vehicle_row_conf` (`JSONB`, `NOT NULL`, default `[]`)

ตัวอย่างค่าในคอลัมน์:

```json
[
  { "rowNumber": 1, "sackCount": 20 },
  { "rowNumber": 2, "sackCount": 18 }
]
```

## Prisma

- เพิ่มฟิลด์ `vehicleRowConf` ใน model `Vehicle`

## API ที่เปลี่ยน

## `POST /vehicles`

รองรับ field เพิ่ม:

- `sackRows?: [{ rowNumber, sackCount }]`
- `bagRows?: [{ rowNumber, bagCount }]` (alias)

ตัวอย่าง request:

```json
{
  "vehicleCode": "VH001",
  "licensePlate": "กข1234",
  "vehicleTypeId": "uuid-string",
  "maxLoadWeightTon": 30,
  "driverUserId": "uuid-string",
  "status": "active",
  "sackRows": [
    { "rowNumber": 1, "sackCount": 20 },
    { "rowNumber": 2, "sackCount": 18 }
  ]
}
```

หรือ alias:

```json
{
  "vehicleCode": "VH001",
  "licensePlate": "กข1234",
  "vehicleTypeId": "uuid-string",
  "maxLoadWeightTon": 30,
  "driverUserId": "uuid-string",
  "status": "active",
  "bagRows": [
    { "rowNumber": 1, "bagCount": 20 },
    { "rowNumber": 2, "bagCount": 18 }
  ]
}
```

## `PATCH /vehicles/:id`

รองรับอัปเดต:

- `maxLoadWeightTon`
- `sackRows` (replace ทั้งชุด)
- `bagRows` (alias ของ `sackRows`)

ตัวอย่าง request:

```json
{
  "maxLoadWeightTon": 35,
  "sackRows": [
    { "rowNumber": 1, "sackCount": 22 },
    { "rowNumber": 2, "sackCount": 19 },
    { "rowNumber": 3, "sackCount": 17 }
  ]
}
```

## `GET /vehicles`
## `GET /vehicles/active`
## `GET /vehicles/:id`
## `GET /vehicles/code/:vehicleCode`
## `GET /vehicles/license/:licensePlate`

คืนค่าเพิ่ม:

- `sackRows` (sort by `rowNumber` asc)
- `bagRows` (alias)
- `totalSacks` (sum จาก `sackCount`)

ตัวอย่าง response:

```json
{
  "id": "uuid-string",
  "vehicleCode": "VH001",
  "licensePlate": "กข1234",
  "vehicleTypeId": "uuid-string",
  "maxLoadWeightTon": 30,
  "vehicleType": {
    "id": "uuid-string",
    "name": "รถบรรทุก 10 ล้อ"
  },
  "sackRows": [
    { "rowNumber": 1, "sackCount": 20 },
    { "rowNumber": 2, "sackCount": 18 }
  ],
  "bagRows": [
    { "rowNumber": 1, "bagCount": 20 },
    { "rowNumber": 2, "bagCount": 18 }
  ],
  "totalSacks": 38
}
```

## Logic ฝั่ง Service

1. normalize payload:
   - `bagRows` -> `sackRows`
   - `bagCount` -> `sackCount`
2. validate:
   - `rowNumber` เป็น integer > 0
   - `sackCount` เป็น integer >= 0
   - ห้าม `rowNumber` ซ้ำ
3. ตอน create/update:
   - เก็บค่า normalized ลง `vehicles.vehicle_row_conf`
   - ถ้า PATCH ไม่ส่ง `sackRows/bagRows` จะไม่แก้ค่าปัจจุบัน
4. response format:
   - คืน `sackRows`, `bagRows`, `totalSacks` เสมอ

## Error Handling

- `400 Bad Request`
  - รูปแบบ `sackRows/bagRows` ไม่ถูกต้อง
  - ค่าไม่ผ่านเงื่อนไข
  - `rowNumber` ซ้ำ
- `404 Not Found`
  - รถหรือ entity ที่อ้างอิงไม่พบ
- `409 Conflict`
  - conflict จาก unique constraint ระดับ DB (กรณี race condition)

## ไฟล์ที่แก้หลัก

- `prisma/schema.prisma`
- `prisma/migrations/20260321090000_add_vehicle_sack_row_configs/migration.sql`
- `src/modules/vehicle/dto/vehicle-sack-row-input.dto.ts`
- `src/modules/vehicle/dto/create-vehicle.dto.ts`
- `src/modules/vehicle/dto/update-vehicle.dto.ts`
- `src/modules/vehicle/vehicle.service.ts`
- `src/modules/vehicle/vehicle.controller.ts`
