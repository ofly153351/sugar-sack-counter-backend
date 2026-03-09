# Vehicle Weight Capacity Update

ย้ายฟิลด์น้ำหนักบรรทุกจาก `vehicle_types` ไปอยู่ที่ `vehicles` แล้ว

ฟิลด์ใหม่:
- `maxLoadWeightTon` (หน่วย: ตัน)

## Database

เพิ่มคอลัมน์ในตาราง `vehicles`:
- `max_load_weight_ton` (`DOUBLE PRECISION`, `NOT NULL`, default `0`)

และลบคอลัมน์น้ำหนักที่เคยอยู่ใน `vehicle_types` (ถ้ามี)

Prisma model:

```prisma
model Vehicle {
  id               String  @id @default(uuid())
  vehicleCode      String  @unique @map("vehicle_code")
  licensePlate     String  @unique @map("license_plate")
  vehicleTypeId    String  @map("vehicle_type_id")
  maxLoadWeightTon Float   @map("max_load_weight_ton")
  ...
}
```

## API Changes

## `POST /vehicles`

Request body ต้องส่ง:

```json
{
  "vehicleCode": "VH001",
  "licensePlate": "กข1234",
  "vehicleTypeId": "uuid-string",
  "maxLoadWeightTon": 30,
  "driverUserId": "uuid-string",
  "status": "active"
}
```

## `PATCH /vehicles/:id`

อัปเดตได้:
- `maxLoadWeightTon`

ตัวอย่าง:

```json
{
  "maxLoadWeightTon": 35
}
```

## Vehicle response

ทุกเส้นของรถจะคืน `maxLoadWeightTon` ที่ root ของ `vehicle`:
- `POST /vehicles`
- `GET /vehicles`
- `GET /vehicles/active`
- `GET /vehicles/:id`
- `PATCH /vehicles/:id`
- `GET /vehicles/code/:vehicleCode`
- `GET /vehicles/license/:licensePlate`

ตัวอย่าง:

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
  }
}
```

## Frontend Impact

- ฟอร์มสร้าง/แก้ไขรถ ต้องส่ง `maxLoadWeightTon`
- dropdown `vehicle-types` จะเหลือ `id`, `name` ตามเดิม
- หน้ารายการรถ/รายละเอียดรถ ให้แสดงน้ำหนักจาก `vehicle.maxLoadWeightTon`

