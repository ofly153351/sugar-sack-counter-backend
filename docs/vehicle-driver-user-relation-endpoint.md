# Vehicle Driver User Relation (driverUserId)

## Goal
เปลี่ยนการเก็บคนขับรถจากข้อความ `driverName` เป็นการอ้างอิงผู้ใช้ในระบบด้วย `driverUserId`

## API Impact

### Create Vehicle
- Method: `POST`
- URL: `/api/vehicles`
- Required fields:
  - `vehicleCode` (string)
  - `licensePlate` (string)
  - `vehicleTypeId` (uuid)
  - `driverUserId` (uuid)  ← ใหม่
- Optional:
  - `status` (`active` | `inactive` | `maintenance`)

### Update Vehicle
- Method: `PATCH`
- URL: `/api/vehicles/:id`
- Optional fields includes:
  - `driverUserId` (uuid) ← ใหม่

## Request Example
```json
{
  "vehicleCode": "VH011",
  "licensePlate": "กข9999",
  "vehicleTypeId": "uuid-vehicle-type",
  "driverUserId": "uuid-user-driver",
  "status": "active"
}
```

## Response Behavior
- ระบบจะคำนวณ `driverName` ให้เองจาก user profile:
  - `firstName + lastName`
  - ถ้าไม่มีชื่อ จะ fallback เป็น `username`
- response ของ vehicle จะ include `driver` object กลับมาด้วย

## Error Cases
- `404 Not Found`:
  - `vehicleTypeId` ไม่พบ
  - `driverUserId` ไม่พบใน `users`
- `409 Conflict`:
  - `vehicleCode` ซ้ำ
  - `licensePlate` ซ้ำ
- `400 Bad Request`:
  - รูปแบบข้อมูลไม่ถูกต้อง (เช่น `driverUserId` ไม่ใช่ UUID)

## Database Change Required
ต้องเพิ่มคอลัมน์และ foreign key ก่อน deploy:

```sql
ALTER TABLE "vehicles"
ADD COLUMN IF NOT EXISTS "driver_user_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_driver_user_id_fkey'
      AND table_name = 'vehicles'
  ) THEN
    ALTER TABLE "vehicles"
    ADD CONSTRAINT "vehicles_driver_user_id_fkey"
    FOREIGN KEY ("driver_user_id")
    REFERENCES "users"("id")
    ON UPDATE CASCADE
    ON DELETE SET NULL;
  END IF;
END $$;
```

## Frontend Notes
- หน้า create/edit รถ ต้องเปลี่ยนจากช่องกรอกชื่อคนขับ เป็น dropdown/select ผู้ใช้
- แนะนำดึง list ผู้ใช้จาก endpoint users แล้ว map:
  - `value = user.id`
  - `label = firstName + lastName` หรือ fallback `username`
- ไม่ต้องส่ง `driverName` เองอีก

## Backward Compatibility
- `driverName` ยังอยู่ใน response เพื่อไม่ให้หน้าเดิมพังทันที
- แต่ฝั่งเขียนข้อมูลใหม่ให้ใช้ `driverUserId` เท่านั้น
