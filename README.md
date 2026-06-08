# Sugar Sack Counter Backend

Backend API สำหรับระบบนับกระสอบและกล่องน้ำตาล สร้างด้วย NestJS, Prisma, PostgreSQL และ MinIO โดยรองรับการจัดการผู้ใช้, สิทธิ์ผู้ใช้, รถ, ประเภทรถ, ประเภทน้ำตาล, เซสชันการนับ, รายละเอียดการนับรายแถว และการเรียก AI detector สำหรับประมวลผลรูปภาพ

## Tech Stack

- Node.js / TypeScript
- NestJS 10
- Prisma ORM
- PostgreSQL
- MinIO object storage
- JWT authentication ผ่าน cookie `access_token` หรือ `Authorization: Bearer <token>`
- Swagger UI

## Quick Start

```bash
npm install
cp env.template .env
npm run start:dev
```

ค่าเริ่มต้น API จะรันที่:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api`

> หมายเหตุ: `src/main.ts` ตั้ง global prefix เป็น `/api` ดังนั้นทุก endpoint ด้านล่างต้องเรียกด้วย prefix `/api`

## Environment Variables

ตัวอย่างค่าที่ต้องมีใน `.env` ดูได้จาก `env.template`

```env
DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=sugar-sacks
```

ถ้าใช้ `docker-compose.yml` สำหรับ PostgreSQL และ MinIO ให้ตั้งค่า `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, และ `MINIO_BUCKET` เพิ่มใน `.env`

## Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start NestJS app |
| `npm run start:dev` | Start development server with watch mode |
| `npm run start:prod` | Run compiled app from `dist/main` |
| `npm run build` | Build project |
| `npm run test` | Run Jest tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format TypeScript files |
| `npm run seed` | Seed database from `scripts/seed-database.js` |
| `npm run start:dev:seed` | Seed database then start dev server |

## File Structure

```text
.
├── src/
│   ├── main.ts                         # App bootstrap, global /api prefix, CORS, Swagger
│   ├── app.module.ts                   # Root module
│   ├── app.controller.ts               # Root and health endpoints
│   ├── app.service.ts
│   ├── common/
│   │   ├── decorators/roles.decorator.ts
│   │   └── guards/                     # JWT, local auth, role guards
│   ├── config/                         # App, database, Swagger config
│   ├── database/                       # Prisma database module/service
│   ├── modules/
│   │   ├── admin/                      # Admin dashboard and user role/password management
│   │   ├── ai-detector/                # AI image detection proxy
│   │   ├── auth/                       # Register, login, logout, token validation
│   │   ├── box-row/                    # Box row CRUD
│   │   ├── counting-session/           # Unified sack/box counting sessions
│   │   ├── minio/                      # MinIO health/config
│   │   ├── operator/                   # Controller exists but is not imported in AppModule
│   │   ├── sack-row/                   # Sack row CRUD
│   │   ├── sugar-type/                 # Sugar/product type CRUD
│   │   ├── user/                       # User CRUD/profile
│   │   ├── vehicle/                    # Vehicle CRUD/search
│   │   └── vehicle-type/               # Vehicle type CRUD/search
│   └── utils/                          # Logger and password helpers
├── prisma/
│   └── schema.prisma                   # Prisma models and database mapping
├── scripts/
│   └── seed-database.js                # Seed roles/users/master data
├── init-db/                            # SQL init scripts for Docker PostgreSQL
├── seed/                               # Seed SQL files
├── docs/                               # Additional project documentation
├── python-ai-service/                  # Separate Python AI detector service
├── docker-compose.yml                  # PostgreSQL and MinIO services
├── env.template                        # Environment variable template
├── package.json
└── tsconfig.json
```

## NestJS Module Structure

โปรเจกต์นี้แยก code ออกเป็น module ตาม business domain เพื่อให้อ่านง่าย แก้ง่าย และลดผลกระทบเวลาแก้ feature ใด feature หนึ่ง แต่ละ module จะมีหน้าที่ของตัวเอง เช่น controller รับ request, service จัดการ business logic และ dto กำหนดรูปแบบ input/output

แนวคิดหลักของการแยก module:

- `auth` ดูแล login, register, token และ cookie เท่านั้น
- `user` ดูแลข้อมูลผู้ใช้และ profile
- `admin` ดูแล endpoint ที่ต้องใช้ role admin เช่น dashboard, reset password, update role
- `vehicle` และ `vehicle-type` แยกข้อมูลรถออกจาก master data ประเภทรถ
- `sugar-type` ดูแล master data ประเภทน้ำตาล/สินค้า และเปิด alias path เป็น `/products`
- `counting-session` เป็นตัวกลางของการนับทั้งแบบกระสอบและกล่อง
- `sack-row` และ `box-row` แยก logic รายแถวของกระสอบและกล่องออกจากกัน เพราะ field และ workflow ไม่เหมือนกันทั้งหมด
- `ai-detector` เป็น proxy จาก NestJS ไปยัง Python AI service
- `minio` ดูแลการตรวจสอบ config และ health ของ object storage
- `database` รวม Prisma service เพื่อให้ module อื่นเรียก database ผ่าน dependency injection ได้

รูปแบบนี้ช่วยให้เวลาแก้ endpoint เช่น `/vehicles` สามารถไปดูเฉพาะ `src/modules/vehicle/` ได้ทันที ไม่ต้องไล่ code ทั้งโปรเจกต์ และถ้าต้องเพิ่ม feature ใหม่ก็ควรเพิ่มใน module ที่ตรงกับ domain หรือสร้าง module ใหม่ถ้าเป็น domain ใหม่จริง ๆ

## Authentication

Protected endpoints use `JwtAuthGuard`. หลัง login ระบบจะตั้ง cookie `access_token` และบาง endpoint ยังอ่าน token จาก `Authorization: Bearer <token>` ได้ด้วย

Admin-only endpoints ใช้ `RolesGuard` พร้อม role `admin`

## API Endpoints

ทุก endpoint ด้านล่างอยู่ใต้ base path `/api`

### App

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | ตรวจสอบว่า API ทำงานอยู่ |
| `GET` | `/health` | No | Health check พร้อม timestamp |

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | สมัครผู้ใช้ใหม่ |
| `POST` | `/auth/login` | No | เข้าสู่ระบบและตั้ง cookie `access_token` |
| `POST` | `/auth/logout` | No | ออกจากระบบและล้าง cookie |
| `GET` | `/auth/profile` | JWT | ดึง profile ของผู้ใช้ปัจจุบัน |
| `POST` | `/auth/refresh` | JWT | refresh token |
| `GET` | `/auth/test-cookie` | No | ทดสอบการตั้ง cookie |
| `GET` | `/auth/check-role` | JWT | ตรวจสอบ role จาก JWT |
| `POST` | `/auth/verify` | No | ตรวจสอบ token จาก body, cookie หรือ Authorization header |
| `GET` | `/auth/verify-token` | No | debug การอ่าน token |
| `GET` | `/auth/debug-token` | No | debug headers, cookies และ user ที่อ่านได้ |

### Users

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/users` | JWT | สร้างผู้ใช้ใหม่ |
| `GET` | `/users` | JWT | ดึงรายการผู้ใช้ทั้งหมด |
| `GET` | `/users/me` | JWT | ดึงข้อมูลผู้ใช้ปัจจุบัน |
| `GET` | `/users/:id` | JWT | ดึงข้อมูลผู้ใช้ตาม ID |
| `PATCH` | `/users/:id` | JWT | อัปเดตข้อมูลผู้ใช้ |
| `DELETE` | `/users/:id` | JWT | ลบผู้ใช้ |

### Admin

ทุก endpoint ในกลุ่มนี้ต้องเป็น JWT และ role `admin`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/admin/dashboard` | ดึงข้อมูล dashboard แบบ mock/static |
| `GET` | `/admin/dashboard/summary` | ดึง summary ยอดนับ 12 เดือน, ยอดเดือนนี้, จำนวนผู้ใช้และรถ |
| `GET` | `/admin/users` | ดึงรายการผู้ใช้แบบ mock/static |
| `PATCH` | `/admin/users/:id/make-admin` | เปลี่ยนผู้ใช้เป็น admin |
| `PATCH` | `/admin/users/:id/role` | เปลี่ยน role ผู้ใช้ |
| `PATCH` | `/admin/users/:id/password` | reset password ผู้ใช้ |

### Vehicles

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/vehicles` | JWT | สร้างรถใหม่ |
| `GET` | `/vehicles` | JWT | ดึงรถทั้งหมด รองรับ query `status` |
| `GET` | `/vehicles/active` | JWT | ดึงรถสถานะ active |
| `GET` | `/vehicles/:id` | JWT | ดึงรถตาม ID |
| `PATCH` | `/vehicles/:id` | JWT | อัปเดตรถ |
| `DELETE` | `/vehicles/:id` | JWT | ลบรถ |
| `GET` | `/vehicles/code/:vehicleCode` | JWT | ค้นหารถตามรหัสรถ |
| `GET` | `/vehicles/license/:licensePlate` | JWT | ค้นหารถตามป้ายทะเบียน |

### Vehicle Types

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/vehicle-types` | JWT | สร้างประเภทรถ |
| `GET` | `/vehicle-types` | JWT | ดึงประเภทรถทั้งหมด รองรับ query `search` |
| `GET` | `/vehicle-types/:id` | JWT | ดึงประเภทรถตาม ID |
| `GET` | `/vehicle-types/:id/vehicles` | JWT | ดึงประเภทรถพร้อมรถที่เกี่ยวข้อง |
| `PATCH` | `/vehicle-types/:id` | JWT | อัปเดตประเภทรถ |
| `DELETE` | `/vehicle-types/:id` | JWT | ลบประเภทรถ |
| `GET` | `/vehicle-types/name/:name` | JWT | ค้นหาประเภทรถตามชื่อ |

### Sugar Types / Products

Controller นี้ผูกไว้ 2 path คือ `/sugar-types` และ `/products` ดังนั้น endpoint ชุดเดียวกันสามารถเรียกได้ทั้ง 2 prefix

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/sugar-types` หรือ `/products` | JWT | สร้างประเภทน้ำตาล/สินค้า |
| `GET` | `/sugar-types` หรือ `/products` | JWT | ดึงทั้งหมด รองรับ query `search` |
| `GET` | `/sugar-types/active` หรือ `/products/active` | JWT | ดึงรายการที่มีการใช้งาน |
| `GET` | `/sugar-types/:id` หรือ `/products/:id` | JWT | ดึงตาม ID |
| `GET` | `/sugar-types/:id/sessions` หรือ `/products/:id/sessions` | JWT | ดึงพร้อมเซสชันที่เกี่ยวข้อง |
| `PATCH` | `/sugar-types/:id` หรือ `/products/:id` | JWT | อัปเดต |
| `DELETE` | `/sugar-types/:id` หรือ `/products/:id` | JWT | ลบ |
| `GET` | `/sugar-types/name/:name` หรือ `/products/name/:name` | JWT | ค้นหาตามชื่อ |

### Counting Sessions

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/counting-sessions` | JWT | สร้าง counting session ใหม่ |
| `GET` | `/counting-sessions` | JWT | ดึง counting session ทั้งหมด |
| `GET` | `/counting-sessions/type/:sessionType` | JWT | ดึงตามประเภท `sack` หรือ `box` รองรับ query `status` |
| `GET` | `/counting-sessions/user/:userId` | JWT | ดึงตามผู้ใช้ |
| `GET` | `/counting-sessions/vehicle/:vehicleId` | JWT | ดึงตามรถ |
| `GET` | `/counting-sessions/:id` | JWT | ดึงตาม ID |
| `PATCH` | `/counting-sessions/:id` | JWT | อัปเดต counting session |
| `DELETE` | `/counting-sessions/type/:sessionType` | JWT | ลบหลายรายการตามประเภท รองรับ query `status`; ใช้ `all` เพื่อลบทุกสถานะ |
| `DELETE` | `/counting-sessions/:id` | JWT | ลบตาม ID |
| `GET` | `/counting-sessions/:id/sack-session-id` | JWT | ดึง sack session ID จาก counting session |
| `GET` | `/counting-sessions/:id/box-session-id` | JWT | ดึง box session ID จาก counting session |

### Sack Rows

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/sack-rows` | JWT | สร้างแถวกระสอบด้วย `sackSessionId` |
| `POST` | `/sack-rows/by-counting-session` | JWT | สร้างแถวกระสอบด้วย `countingSessionId` |
| `GET` | `/sack-rows/session/:sessionId` | JWT | ดึงแถวทั้งหมดของ sack counting session |
| `GET` | `/sack-rows/:id` | JWT | ดึงแถวกระสอบตาม ID |
| `PATCH` | `/sack-rows/:id` | JWT | อัปเดตแถวกระสอบ |
| `DELETE` | `/sack-rows/:id` | JWT | ลบแถวกระสอบ |
| `DELETE` | `/sack-rows/session/:sessionId/all` | JWT | ลบแถวทั้งหมดของ session |

### Box Rows

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/box-rows` | JWT | สร้างแถวกล่องด้วย `boxSessionId` |
| `POST` | `/box-rows/by-counting-session` | JWT | สร้างแถวกล่องด้วย `countingSessionId` |
| `GET` | `/box-rows/session/:sessionId` | JWT | ดึงแถวทั้งหมดของ box counting session |
| `GET` | `/box-rows/:id` | JWT | ดึงแถวกล่องตาม ID |
| `PATCH` | `/box-rows/:id` | JWT | อัปเดตแถวกล่อง |
| `DELETE` | `/box-rows/:id` | JWT | ลบแถวกล่อง |
| `DELETE` | `/box-rows/session/:sessionId/all` | JWT | ลบแถวทั้งหมดของ session |

### AI Detector

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/ai/detect` | No | ส่งรูปภาพ field `image` แบบ `multipart/form-data` ไปตรวจจับด้วย AI service |

## Python AI Service

AI service อยู่ในโฟลเดอร์ `python-ai-service/` และเป็น service แยกจาก NestJS backend โดยใช้ FastAPI + YOLO ผ่าน `ultralytics` สำหรับตรวจจับกระสอบและกล่องจากรูปภาพ

เหตุผลที่แยก AI service ออกจาก NestJS:

- งาน AI ใช้ Python ecosystem เช่น OpenCV, NumPy, PIL และ YOLO ได้เหมาะกว่า
- NestJS ทำหน้าที่เป็น backend หลักสำหรับ auth, database และ business workflow
- AI service ทำหน้าที่ประมวลผลรูปและส่งผลลัพธ์กลับมา ทำให้แก้ model หรือ threshold ได้โดยไม่กระทบ API หลัก
- สามารถ scale หรือ deploy แยกจาก backend หลักได้ในอนาคต

### AI Service Quick Start

```bash
cd python-ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

หรือใช้ script:

```bash
cd python-ai-service
./start.sh
```

ค่าเริ่มต้น service จะรันที่:

- AI Service: `http://localhost:8082`
- Health check: `http://localhost:8082/health`

### AI Service Environment

ตัวอย่าง config อยู่ที่ `python-ai-service/env.example`

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_SECURE=false
MINIO_BUCKET_NAME=sugar-sacks
MODEL_PATH=best.pt
CONFIDENCE_THRESHOLD=0.45
BOX_CONFIDENCE_THRESHOLD=0.2
HOST=0.0.0.0
PORT=8082
```

`MODEL_PATH` ใช้กำหนดไฟล์โมเดล YOLO เช่น `best.pt` หรือ `bestTeacher.pt` ส่วน `CONFIDENCE_THRESHOLD` และ `BOX_CONFIDENCE_THRESHOLD` ใช้ปรับความมั่นใจขั้นต่ำก่อนนับผลลัพธ์

### AI Detection Flow

1. Client หรือ NestJS ส่งรูปแบบ `multipart/form-data`
2. FastAPI validate ว่าไฟล์เป็นรูปภาพ
3. Decode รูปด้วย OpenCV
4. รัน YOLO model เพื่อตรวจจับ object
5. normalize class name ให้เป็น `sack` หรือ `box`
6. filter ด้วย confidence threshold
7. วาด bounding box ลงบนรูป annotated
8. แปลง annotated image เป็น base64
9. ถ้า `save_to_minio=true` จะบันทึกรูป original และ annotated ลง MinIO
10. ส่งผลลัพธ์กลับเป็น JSON เช่น count, detections, bbox และ base64 image

### AI Service Endpoints

endpoint เหล่านี้เป็นของ Python AI service โดยตรง ไม่ได้อยู่ใต้ `/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | ตรวจสอบสถานะ service, model และ MinIO |
| `GET` | `/model-info` | ดูรายละเอียด model, class และ threshold |
| `POST` | `/detect` | ตรวจจับทั้งกระสอบและกล่อง รับ form field `file`, `save_to_minio`, `session_id` |
| `POST` | `/detect-sacks` | ตรวจจับเฉพาะกระสอบ |
| `POST` | `/detect-boxes` | ตรวจจับเฉพาะกล่อง |
| `POST` | `/save-to-minio` | บันทึกรูป base64 ลง MinIO ภายหลัง |
| `GET` | `/minio-status` | ตรวจสอบ connection และ bucket ของ MinIO |

### NestJS Integration With AI Service

NestJS มี module `src/modules/ai-detector/` สำหรับ proxy request ไปยัง Python AI service

- NestJS endpoint: `POST /api/ai/detect`
- รับ field รูปภาพชื่อ `image`
- ส่งต่อไป Python AI service endpoint: `POST http://localhost:8082/detect`
- Python AI service รับ field รูปภาพชื่อ `file`
- response จะมีข้อมูล count, detections และ annotated image

หมายเหตุ: ใน `src/modules/ai-detector/ai-detector.service.ts` URL ของ AI service ถูกกำหนดเป็น `http://localhost:8082/detect` หาก deploy จริงควรย้ายค่านี้ไปเป็น environment variable เพื่อเปลี่ยน host/port ได้โดยไม่ต้องแก้ code

### MinIO

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/minio/health` | JWT | ตรวจสอบ connection health ของ MinIO |
| `GET` | `/minio/config` | JWT | ดึง config ปัจจุบันของ MinIO |

## Controller ที่ยังไม่ถูกเปิดใช้งาน

ไฟล์ `src/modules/operator/operator.controller.ts` มี route ต่อไปนี้ แต่ `OperatorController`/`OperatorModule` ไม่ได้ถูก import ใน `src/app.module.ts` จึงยังไม่พร้อมใช้งานในแอปปัจจุบัน

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/operator/counting-sessions` | `operator`, `admin` | ดึงข้อมูล counting sessions แบบ mock/static |
| `GET` | `/operator/dashboard` | `operator`, `admin` | ดึง dashboard operator แบบ mock/static |

## Main Data Models

โมเดลหลักใน `prisma/schema.prisma`

- `Role`, `User`, `UserProfile`
- `VehicleType`, `Vehicle`
- `SugarType`
- `CountingSession`
- `SackCountingSession`, `SackRow`
- `BoxCountingSession`, `BoxRow`

## Notes

- Global validation เปิด `whitelist`, `forbidNonWhitelisted` และ `transform`
- ใน development (`NODE_ENV=development`) app จะพยายาม seed database ตอน startup
- เอกสารเพิ่มเติมอยู่ใน `docs/`
- Python AI service แยกอยู่ใน `python-ai-service/`


tricker
