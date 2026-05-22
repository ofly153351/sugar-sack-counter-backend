# 🧂 Sugar Sack Counter Backend — อธิบายโค้ดทุก Module แบบละเอียด

> NestJS + Prisma + PostgreSQL | อธิบายภาษาไทย พร้อมตัวอย่างการทำงาน

---

## 🗂️ โครงสร้างโปรเจค

```
src/
├── main.ts                         # จุดเริ่มต้น NestJS
├── app.module.ts                   # Root module — import ทุก module
├── app.controller.ts / service.ts  # Controller/Service หลัก
├── config/                         # ตั้งค่า app, database, swagger
├── common/
│   ├── guards/                     # JWT Guard, Roles Guard
│   └── decorators/                 # @Roles decorator
├── database/
│   └── database.service.ts         # PrismaClient wrapper
└── modules/
    ├── auth/                       # 🔐 ระบบ Authentication
    ├── user/                       # 👤 จัดการผู้ใช้งาน
    ├── admin/                      # 🛡️ Admin Dashboard
    ├── vehicle/                    # 🚛 จัดการรถ
    ├── vehicle-type/               # 🏷️ ประเภทรถ
    ├── sugar-type/                 # 🍬 ประเภทน้ำตาล
    ├── counting-session/           # 📊 เซสชั่นการนับ (umbrella)
    ├── sack-row/                   # 📏 แถวนับกระสอบ
    ├── box-row/                    # 📦 แถวนับกล่อง
    ├── ai-detector/                # 🤖 AI ตรวจนับ
    └── minio/                      # 🗄️ Object Storage (MinIO)
```

---

## 1. 🔐 Auth Module — ระบบ Authentication

**ไฟล์:** `src/modules/auth/`

### โครงสร้าง
```
auth/
├── auth.module.ts          # ลงทะเบียน JwtModule, PassportModule
├── auth.controller.ts      # Endpoints: login, register, logout, profile, refresh, verify
├── auth.service.ts         # Logic: validateUser, login, register, refreshToken, validateToken
├── dto/
│   ├── login.dto.ts        # { username, password }
│   └── register.dto.ts     # { email, password, username, firstName, lastName, ... }
└── strategies/
    ├── local.strategy.ts   # ตรวจสอบ username+password ด้วย passport-local
    └── jwt.strategy.ts     # ตรวจสอบ JWT token จาก cookie/header
```

### 🔍 อธิบายการทำงาน

**AuthService** (`auth.service.ts`):
```typescript
// ฟังก์ชัน validateUser — ใช้ตอน login
async validateUser(username: string, password: string) {
  // เรียก UserService เพื่อค้นหา user จาก username
  const user = await this.userService.validateUser(username, password);
  if (!user) throw new UnauthorizedException("Invalid credentials");
  // ดึงข้อมูล user พร้อม profile
  return this.userService.findOne(user.id);
}

// ฟังก์ชัน login — สร้าง JWT token และ set cookie
async login(user, response) {
  const payload = { email: user.email, sub: user.id, role: user.role };
  const token = this.jwtService.sign(payload);  // สร้าง JWT
  
  // เก็บ token ไว้ใน HTTP-only cookie (ปลอดภัยจาก XSS)
  response.cookie("access_token", token, {
    httpOnly: true,        // JavaScript อ่านไม่ได้
    secure: process.env.NODE_ENV === "production",  // HTTPS only ใน production
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,  // หมดอายุ 24 ชม.
  });
  
  return { user: { id, email, username, firstName, lastName } };
}
```

**JwtStrategy** (`strategies/jwt.strategy.ts`):
```typescript
// กลยุทธ์การ verify JWT — ดึง token จาก 4 แหล่ง:
// 1. req.cookies["access_token"]         ← cookie-parser
// 2. req.headers.cookie → "access_token=..."  ← frontend middleware
// 3. req.headers.authorization → "Bearer ..."  ← API client
// 4. req.body.token                         ← manual
```

### 📡 Endpoints

| Method | Path | คำอธิบาย | Example |
|--------|------|---------|---------|
| POST | `/auth/register` | ลงทะเบียนผู้ใช้ใหม่ | `{ "email":"user@test.com", "password":"123456", "username":"john" }` |
| POST | `/auth/login` | เข้าสู่ระบบ | `{ "username":"john", "password":"123456" }` |
| POST | `/auth/logout` | ออกจากระบบ (ลบ cookie) | — |
| GET | `/auth/profile` | ดูโปรไฟล์ตัวเอง | ต้องแนบ JWT |
| POST | `/auth/refresh` | ขอ token ใหม่ | ต้องแนบ JWT |
| POST | `/auth/verify` | ตรวจสอบว่า token ถูกต้อง | ส่ง token ใน body/header/cookie |
| GET | `/auth/check-role` | เช็ค role ปัจจุบัน | `{ "role": "admin" }` |

---

## 2. 👤 User Module — จัดการผู้ใช้งาน

**ไฟล์:** `src/modules/user/`

### 🔍 ฟังก์ชันสำคัญ

**UserService** (`user.service.ts`):

```typescript
// CREATE — สร้างผู้ใช้ใหม่
async create(dto: CreateUserDto) {
  // 1. ตรวจสอบ username ซ้ำ
  // 2. ตรวจสอบเบอร์โทรศัพท์ (max 10 ตัว) และห้ามซ้ำ
  // 3. ตรวจสอบ employeeCode ห้ามซ้ำ
  // 4. ถ้าไม่มี email → สร้างจาก username@local.user อัตโนมัติ
  // 5. เข้ารหัส password ด้วย bcrypt (12 rounds)
  // 6. สร้าง user + userProfile + เชื่อมกับ default role
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await this.database.user.create({
    data: {
      email, password: hashedPassword, username,
      role: { connect: { id: defaultRoleId } },
      profile: {
        create: { title, firstName, lastName, position, phone, employeeCode }
      }
    }
  });
  // ลบ password ออกจาก response
  const { password: _, ...result } = user;
  return result;
}

// VALIDATE — ตรวจสอบ username+password สำหรับ login
async validateUser(username, password) {
  const user = await this.findByUsername(username);
  if (!user) return null;
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return null;
  const { password: _, ...result } = user;
  return result;
}

// UPDATE — แก้ไขข้อมูล user + profile
async update(id, dto) {
  // แยก user fields กับ profile fields
  const { firstName, lastName, employeeCode, phone, title, ...userData } = dto;
  
  // แก้ไขตาราง user
  await this.database.user.update({ where: { id }, data: userData });
  
  // แก้ไขตาราง userProfile (ถ้ามีการเปลี่ยนแปลง)
  if (firstName || lastName || employeeCode || phone || title) {
    await this.database.userProfile.update({ where: { userId: id }, data: {...} });
  }
}
```

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/users` | สร้างผู้ใช้ใหม่ (ต้อง JWT) |
| GET | `/users` | ดึงผู้ใช้ทั้งหมด |
| GET | `/users/me` | ดึงข้อมูลตัวเอง |
| GET | `/users/:id` | ดึงผู้ใช้ตาม ID |
| PATCH | `/users/:id` | แก้ไขข้อมูลผู้ใช้ |
| DELETE | `/users/:id` | ลบผู้ใช้ |

---

## 3. 🛡️ Admin Module — Admin Dashboard

**ไฟล์:** `src/modules/admin/`

### 🔍 การทำงาน

```typescript
// ทั้ง controller ใช้ @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin')
// → เฉพาะ admin เท่านั้นที่เข้าได้

// Dashboard Summary — สถิติ 12 เดือน
async getDashboardSummary() {
  // Query ด้วย raw SQL ดึงข้อมูล 12 เดือนย้อนหลัง:
  // - sacks: จำนวนกระสอบต่อเดือนจาก counting_sessions WHERE session_type='sack'
  // - boxes: จำนวนกล่องต่อเดือนจาก counting_sessions WHERE session_type='box'
  // - totalUsers, totalVehicles: count
  // คืนค่าเป็น series รายเดือน + current month
  
  return {
    sacks: { thisMonth: 120, last12Months: [{month:"2025-04",total:420}, ...] },
    boxes: { thisMonth: 60, last12Months: [{month:"2025-04",total:260}, ...] },
    totalUsers: 150, totalVehicles: 25,
    range: { startMonth: "2025-04", endMonth: "2026-03" }
  };
}
```

### 📡 Endpoints (ทุก endpoint ต้อง role=admin)

| Method | Path | คำอธิบาย |
|--------|------|---------|
| GET | `/admin/dashboard` | หน้า dashboard พื้นฐาน |
| GET | `/admin/dashboard/summary` | สถิติ 12 เดือน (sacks, boxes, users, vehicles) |
| GET | `/admin/users` | รายชื่อผู้ใช้ทั้งหมด |
| PATCH | `/admin/users/:id/make-admin` | เลื่อนเป็น admin |
| PATCH | `/admin/users/:id/role` | เปลี่ยน role (`{ "role": "operator" }`) |
| PATCH | `/admin/users/:id/password` | รีเซ็ตรหัสผ่าน (`{ "newPassword": "..." }`) |

---

## 4. 🚛 Vehicle Module — จัดการรถ

**ไฟล์:** `src/modules/vehicle/`

### 🔍 ฟังก์ชันสำคัญ

```typescript
// CREATE — สร้างรถใหม่
async create(dto: CreateVehicleDto) {
  // 1. ตรวจสอบ vehicleCode ซ้ำ
  // 2. ตรวจสอบ licensePlate (ทะเบียน) ซ้ำ
  // 3. ตรวจสอบ vehicleTypeId มีอยู่จริง
  // 4. ตรวจสอบ driverUserId มีอยู่จริง → สร้าง driverName จาก firstName+lastName
  // 5. normalizeSackRows: ตรวจสอบ sackRows/bagRows → ทำความสะอาดข้อมูล
  //    - รับได้ทั้ง sackRows และ bagRows (alias)
  //    - ตรวจสอบ rowNumber > 0, sackCount >= 0, ห้าม rowNumber ซ้ำ
  // 6. เก็บ vehicleRowConf เป็น JSON ใน database
}

// normalizeSackRows — ฟังก์ชันสำคัญที่ทำความสะอาด config แถว
private normalizeSackRows(sackRows, bagRows): SackRow[] {
  // - รับได้ทั้ง sackRows หรือ bagRows (เลือกอันใดอันหนึ่ง)
  // - แปลง sackCount/bagCount → sackCount เสมอ
  // - ตรวจสอบ rowNumber > 0, sackCount integer >= 0
  // - ห้าม rowNumber ซ้ำ
  // - เรียงตาม rowNumber
}
```

### 🔑 จุดเด่นของ Vehicle

- `vehicleRowConf` เก็บ config แถวเป็น **JSON** ใน database
- รองรับทั้ง `sackRows` และ `bagRows` (ชื่อเดียวกัน คนละ alias)
- **ห้ามลบ** รถที่มีประวัติการนับ (counting sessions)
- formatResponse จะ parse `vehicleRowConf` ออกมาเป็น `sackRows`, `bagRows`, `totalSacks`

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/vehicles` | สร้างรถใหม่ |
| GET | `/vehicles` | ดึงรถทั้งหมด (กรองตาม ?status=active ได้) |
| GET | `/vehicles/active` | ดึงรถที่ active เท่านั้น |
| GET | `/vehicles/:id` | ดึงรถตาม ID |
| GET | `/vehicles/code/:vehicleCode` | ค้นหารถตามรหัสรถ |
| GET | `/vehicles/license/:licensePlate` | ค้นหารถตามทะเบียน |
| PATCH | `/vehicles/:id` | แก้ไขข้อมูลรถ |
| DELETE | `/vehicles/:id` | ลบรถ (ต้องไม่มีประวัติการนับ) |

---

## 5. 🏷️ VehicleType Module — ประเภทรถ

**ไฟล์:** `src/modules/vehicle-type/`

### 🔍 ฟังก์ชัน

```typescript
// CRUD พื้นฐาน
// - create: ตรวจสอบชื่อซ้ำก่อนสร้าง
// - update: ตรวจสอบชื่อซ้ำก่อนแก้
// - remove: ห้ามลบถ้ามี vehicle ใช้ประเภทนี้อยู่
// - getVehicleTypeWithVehicles: ดึงประเภทพร้อมรายการรถ active
// - searchVehicleTypes: ค้นหาจากชื่อ (case-insensitive)
```

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/vehicle-types` | สร้างประเภทรถใหม่ `{ "name": "รถบรรทุก 10 ล้อ" }` |
| GET | `/vehicle-types` | ดึงทั้งหมด |
| GET | `/vehicle-types/:id` | ดึงตาม ID |
| GET | `/vehicle-types/:id/vehicles` | ดึงประเภทพร้อมรถที่ active |
| PATCH | `/vehicle-types/:id` | แก้ไข |
| DELETE | `/vehicle-types/:id` | ลบ (ต้องไม่มีรถใช้อยู่) |

---

## 6. 🍬 SugarType Module — ประเภทน้ำตาล

**ไฟล์:** `src/modules/sugar-type/`

### 🔍 ฟังก์ชัน

```typescript
// CRUD + ฟังก์ชันพิเศษ:
// - getSugarTypeWithSessions: ดึง sugarType พร้อม 10 sessions ล่าสุด (ทั้ง sack+box)
// - searchSugarTypes: ค้นหาจาก name หรือ productCode (case-insensitive)
// - getActiveSugarTypes: ดึงเฉพาะประเภทที่มี completed sessions
// - remove: ห้ามลบถ้ามี sessions ใช้อยู่
```

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/sugar-types` | สร้างประเภทน้ำตาล `{ "name": "น้ำตาลทรายขาว", "productCode": "SKU-001" }` |
| GET | `/sugar-types` | ดึงทั้งหมด |
| GET | `/sugar-types/active` | ดึงเฉพาะที่ใช้งานอยู่ |
| GET | `/sugar-types/search?q=ขาว` | ค้นหา |
| GET | `/sugar-types/:id` | ดึงตาม ID |
| GET | `/sugar-types/:id/sessions` | ดึงพร้อม sessions ล่าสุด |
| PATCH | `/sugar-types/:id` | แก้ไข |
| DELETE | `/sugar-types/:id` | ลบ |

---

## 7. 📊 CountingSession Module — เซสชั่นการนับ (Umbrella)

**ไฟล์:** `src/modules/counting-session/`

### 🔍 แนวคิดการออกแบบ

CountingSession เป็น **umbrella table** — ครอบการนับทั้งกระสอบ (sack) และกล่อง (box):

```
CountingSession (sessionType="sack" | "box")
├── เมื่อ sessionType="sack": เชื่อมกับ SackCountingSession
│   └── SackCountingSession → SackRow[] (หลายแถว)
└── เมื่อ sessionType="box":  เชื่อมกับ BoxCountingSession
    └── BoxCountingSession → BoxRow[] (หลายแถว)
```

### 🔍 ฟังก์ชันสำคัญ

```typescript
// CREATE — อัจฉริยะ: สร้าง sub-session ให้อัตโนมัติ
async create(dto) {
  // 1. ตรวจสอบ user, vehicle, sugarType มีอยู่จริง
  
  // 2. ถ้า sessionType="sack" และไม่มี sackSessionId:
  //    → สร้าง SackCountingSession ใหม่ให้อัตโนมัติ
  if (sessionType === "sack" && !sackSessionId) {
    const sackSession = await this.prisma.sackCountingSession.create({
      data: { vehicleId, sugarTypeId, userId, countingDate, status }
    });
    // แล้วสร้าง CountingSession ที่ link ไปหา sackSession
  }
  
  // 3. ถ้า sessionType="box" และไม่มี boxSessionId:
  //    → สร้าง BoxCountingSession ใหม่ให้อัตโนมัติ
  
  // 4. ใช้ class-transformer แปลง response → ลบ sensitive fields
  return plainToInstance(CountingSessionResponseDto, createdSession);
}

// UPDATE — sync status ไป sub-session ด้วย (transaction)
async update(id, dto) {
  await this.prisma.$transaction(async (prisma) => {
    // อัพเดท counting session
    const updated = await prisma.countingSession.update({...});
    
    // ถ้าเปลี่ยน status → sync ไป sub-session ด้วย
    if (dto.status) {
      if (updated.sessionType === "sack" && updated.sackSessionId) {
        await prisma.sackCountingSession.update({
          where: { id: updated.sackSessionId },
          data: { status: dto.status }
        });
      }
      // ... box เช่นกัน
    }
  });
}

// REMOVE — ลบ cascade: session → sub-session → ลบรูปจาก MinIO
async remove(id) {
  // 1. เก็บ image paths ทั้งหมด
  // 2. ลบ countingSession + sub-session ใน transaction
  // 3. ลบรูปจาก MinIO
}
```

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/counting-sessions` | สร้าง session ใหม่ (สร้าง sub-session อัตโนมัติ) |
| GET | `/counting-sessions` | ดึงทั้งหมด |
| GET | `/counting-sessions/type/:sessionType` | กรองตาม type (?status=completed) |
| GET | `/counting-sessions/user/:userId` | กรองตาม user |
| GET | `/counting-sessions/vehicle/:vehicleId` | กรองตามรถ |
| GET | `/counting-sessions/:id` | ดึงตาม ID |
| GET | `/counting-sessions/:id/sack-session-id` | ดึง sackSessionId |
| GET | `/counting-sessions/:id/box-session-id` | ดึง boxSessionId |
| PATCH | `/counting-sessions/:id` | แก้ไข |
| DELETE | `/counting-sessions/:id` | ลบ (cascade) |
| DELETE | `/counting-sessions/type/:sessionType` | ลบทีละ type |

---

## 8. 📏 SackRow Module — แถวนับกระสอบ

**ไฟล์:** `src/modules/sack-row/`

### 🔍 ฟังก์ชันสำคัญ

```typescript
// CREATE — สร้างแถวนับกระสอบ
async create(dto) {
  // 1. ตรวจสอบ SackCountingSession มีอยู่จริง
  // 2. ตรวจสอบ rowNumber ห้ามซ้ำใน session เดียวกัน
  // 3. สร้าง row
  // 4. updateSessionTotals: คำนวณยอดรวม finalCount → อัพเดท CountingSession.totalCount
}

// updateSessionTotals — หัวใจของการนับ
private async updateSessionTotals(sessionId) {
  // SUM finalCount ของทุกแถวใน session
  const result = await this.prisma.sackRow.aggregate({
    where: { sessionId },
    _sum: { finalCount: true }
  });
  
  const totalSacks = result._sum.finalCount || 0;
  
  // อัพเดท CountingSession.totalCount
  const countingSession = await this.prisma.countingSession.findFirst({
    where: { sackSessionId: sessionId }
  });
  if (countingSession) {
    await this.prisma.countingSession.update({
      where: { id: countingSession.id },
      data: { totalCount: totalSacks }
    });
  }
}

// createByCountingSession — สร้างผ่าน countingSessionId แทน sessionId โดยตรง
async createByCountingSession(dto) {
  // 1. หา countingSession ตาม ID
  // 2. ตรวจสอบว่าเป็น sessionType="sack"
  // 3. ใช้ countingSession.sackSessionId ในการสร้าง row
}
```

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/sack-rows` | สร้างแถวใหม่ (ใช้ sessionId) |
| POST | `/sack-rows/by-counting-session` | สร้างแถวใหม่ (ใช้ countingSessionId) |
| GET | `/sack-rows/session/:sessionId` | ดึงทุกแถวของ session |
| GET | `/sack-rows/:id` | ดึงตาม ID |
| PATCH | `/sack-rows/:id` | แก้ไขแถว |
| DELETE | `/sack-rows/:id` | ลบแถว |
| DELETE | `/sack-rows/session/:sessionId` | ลบทุกแถวของ session |

---

## 9. 📦 BoxRow Module — แถวนับกล่อง

**ไฟล์:** `src/modules/box-row/`

### 🔍 ฟังก์ชัน (คล้าย SackRow)

```typescript
// โครงสร้างเหมือน SackRow เกือบทุกประการ แต่ไม่มี weightType
// - CREATE: ตรวจสอบ session + rowNumber ห้ามซ้ำ → อัพเดท totals
// - UPDATE: ตรวจสอบ finalCount เปลี่ยน → อัพเดท totals
// - REMOVE: ลบแล้วอัพเดท totals
// - createByCountingSession: สร้างผ่าน countingSessionId
// - updateSessionTotal: SUM(finalCount) → อัพเดท countingSession
```

### 📡 Endpoints

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/box-rows` | สร้างแถวใหม่ |
| POST | `/box-rows/by-counting-session` | สร้างผ่าน countingSessionId |
| GET | `/box-rows/session/:sessionId` | ดึงทุกแถว |
| GET | `/box-rows/:id` | ดึงตาม ID |
| PATCH | `/box-rows/:id` | แก้ไข |
| DELETE | `/box-rows/:id` | ลบแถว |
| DELETE | `/box-rows/session/:sessionId` | ลบทุกแถว |

---

## 10. 🤖 AiDetector Module — AI ตรวจนับ

**ไฟล์:** `src/modules/ai-detector/`

### 🔍 หลักการ

```typescript
// AiDetectorService — ส่งรูปไปให้ Python/Rust AI Service (port 8082)
async detectPersons(file: Express.Multer.File): Promise<DetectionResult> {
  // 1. สร้าง FormData จาก buffer ของไฟล์
  const formData = new FormData();
  formData.append("file", fileStream, { filename, contentType });
  
  // 2. POST ไปหา http://localhost:8082/detect
  const response = await axios.post("http://localhost:8082/detect", formData, {
    timeout: 30000  // 30 วิ
  });
  
  // 3. คืนค่า { person_count, annotated_image(base64), detections[{class, confidence, bbox}] }
  return response.data;
}

// AiDetectorController — รับไฟล์รูปผ่าน multipart/form-data
@Post("detect")
@UseInterceptors(FileInterceptor("image"))  // รับไฟล์ field ชื่อ "image"
async detectPersons(@UploadedFile() file) {
  return this.aiDetectorService.detectPersons(file);
}
```

### 📡 Endpoint

| Method | Path | คำอธิบาย |
|--------|------|---------|
| POST | `/ai/detect` | ส่งรูป → AI ตรวจนับ (multipart, field: `image`) |

### 📤 Response ตัวอย่าง
```json
{
  "person_count": 25,
  "annotated_image": "base64encodedstring...",
  "detections": [
    { "class": "sack", "confidence": 0.95, "bbox": [10, 20, 50, 60] }
  ]
}
```

---

## 11. 🗄️ Minio Module — Object Storage

**ไฟล์:** `src/modules/minio/`

### 🔍 ฟังก์ชัน

```typescript
// MinioService — ใช้ minio npm package
constructor() {
  this.minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  });
  this.bucketName = process.env.MINIO_BUCKET_NAME || "sugar-sacks";
}

// getPresignedUrl — สร้างลิงก์ชั่วคราวสำหรับเข้าถึงไฟล์
async getPresignedUrl(objectName: string, expirySeconds = 86400) {
  const url = await this.minioClient.presignedGetObject(
    this.bucketName, objectName, expirySeconds
  );
  return url;  // ใช้ได้ 24 ชม. (default)
}

// getPresignedUrls — สร้างทีละหลายไฟล์พร้อมกัน
// deleteObject — ลบไฟล์ (ignore ถ้าไฟล์ไม่มีอยู่แล้ว)
// fileExists — เช็คว่ามีไฟล์หรือไม่
// healthCheck — เช็คการเชื่อมต่อ
```

### 🔑 การใช้งานใน CountingSession

```typescript
// CountingSessionService ใช้ MinioService เพื่อ:
// 1. เพิ่ม presigned URLs ให้กับรูปภาพใน session response
// 2. ลบรูปจาก MinIO เมื่อลบ session (cascade delete)
```

---

## 12. 🗃️ Database Module — Prisma Client Wrapper

**ไฟล์:** `src/database/database.service.ts`

```typescript
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: { url: configService.get("DATABASE_URL") }
      }
    });
  }
  
  async onModuleInit() { await this.$connect(); }     // เชื่อมต่อตอน start
  async onModuleDestroy() { await this.$disconnect(); } // ตัดการเชื่อมต่อตอน shutdown
  
  // ฟังก์ชันล้าง database ทั้งหมด (dev only)
  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") return;
    // ลบทุกตาราง
  }
}
```

---

## 📊 Prisma Schema — โครงสร้าง Database

**ไฟล์:** `prisma/schema.prisma`

### 11 Models / ตาราง:

| Model | ชื่อตาราง | คำอธิบาย |
|-------|----------|---------|
| Role | `roles` | บทบาทผู้ใช้ (user, admin) |
| User | `users` | ผู้ใช้ (username, password, email) |
| UserProfile | `user_profiles` | ข้อมูลส่วนตัว (ชื่อ, เบอร์, รหัสพนักงาน) |
| VehicleType | `vehicle_types` | ประเภทรถ |
| Vehicle | `vehicles` | รถ (รหัสรถ, ทะเบียน, น้ำหนัก, configแถว) |
| SugarType | `sugar_types` | ประเภทน้ำตาล (ชื่อ, รหัสสินค้า) |
| SackCountingSession | `sack_counting_sessions` | เซสชั่นนับกระสอบ |
| SackRow | `sack_rows` | แถวนับกระสอบ (rowNumber, weightType, aiCount, finalCount) |
| BoxCountingSession | `box_counting_sessions` | เซสชั่นนับกล่อง |
| BoxRow | `box_rows` | แถวนับกล่อง (rowNumber, aiCount, finalCount) |
| CountingSession | `counting_sessions` | Umbrella: ครอบทั้ง sack และ box |

### 🔗 ความสัมพันธ์สำคัญ:

```
Role        1──N  User
User        1──1  UserProfile
User        1──N  Vehicle           (driver)
User        1──N  CountingSession
User        1──N  SackCountingSession
User        1──N  BoxCountingSession
VehicleType 1──N  Vehicle
Vehicle     1──N  CountingSession
Vehicle     1──N  SackCountingSession
Vehicle     1──N  BoxCountingSession
SugarType   1──N  CountingSession
SugarType   1──N  SackCountingSession
SugarType   1──N  BoxCountingSession
CountingSession 1──0..1 SackCountingSession   (unique)
CountingSession 1──0..1 BoxCountingSession    (unique)
SackCountingSession 1──N  SackRow             (cascade delete)
BoxCountingSession  1──N  BoxRow              (cascade delete)
```

---

## 🔐 Authentication Flow — การทำงาน Auth ทั้งระบบ

```
1. ผู้ใช้ POST /auth/login { username, password }
2. LocalAuthGuard → LocalStrategy.validate()
3. AuthService.validateUser() → UserService.validateUser()
4. UserService ตรวจสอบ username + bcrypt.compare(password)
5. ถ้าผ่าน → AuthService.login():
   - jwtService.sign({ sub: userId, email, role })
   - response.cookie("access_token", token, { httpOnly: true })
6. Request ถัดไป → JwtAuthGuard → JwtStrategy:
   - ดึง token จาก cookie/header
   - jwtService.verify(token) → payload
   - หา user จาก payload.sub
   - req.user = { id, email, username, role }
```

---

## 🧪 ตัวอย่างการใช้งาน API (curl)

### 1. ลงทะเบียน + Login
```bash
# ลงทะเบียน
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"somchai@test.com","password":"123456","username":"somchai","firstName":"สมชาย","lastName":"ใจดี"}'

# Login (token เก็บใน cookie)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"somchai","password":"123456"}' \
  -c cookies.txt
```

### 2. สร้างประเภทรถ → สร้างรถ → สร้าง session → เพิ่มแถวนับ
```bash
# สร้างประเภทรถ
curl -X POST http://localhost:3000/vehicle-types \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"รถบรรทุก 10 ล้อ"}'

# สร้างรถ (พร้อม config แถว)
curl -X POST http://localhost:3000/vehicles \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "vehicleCode":"VH001",
    "licensePlate":"กข1234",
    "vehicleTypeId":"<uuid>",
    "maxLoadWeightTon":30,
    "driverUserId":"<user-uuid>",
    "sackRows":[
      {"rowNumber":1,"sackCount":20},
      {"rowNumber":2,"sackCount":18}
    ]
  }'

# สร้าง counting session (สร้าง sub-session อัตโนมัติ)
curl -X POST http://localhost:3000/counting-sessions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "sessionType":"sack",
    "userId":"<uuid>",
    "vehicleId":"<uuid>",
    "sugarTypeId":"<uuid>"
  }'

# เพิ่มแถวนับ (ผ่าน countingSessionId)
curl -X POST http://localhost:3000/sack-rows/by-counting-session \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "countingSessionId":"<uuid>",
    "rowNumber":1,
    "weightType":"50kg",
    "aiCount":22,
    "finalCount":20
  }'
```

### 3. AI ตรวจนับ
```bash
curl -X POST http://localhost:3000/ai/detect \
  -F "image=@photo.jpg"
```

---

## 📝 สรุป

| Module | หน้าที่ | Pattern |
|--------|-------|---------|
| **Auth** | Authentication + JWT + Cookie | Controller → Service → UserService |
| **User** | CRUD ผู้ใช้ + Profile + เข้ารหัส password | Service ใช้ Prisma โดยตรง |
| **Admin** | Dashboard สถิติ + จัดการ role/password | @Roles('admin') + Raw SQL |
| **Vehicle** | CRUD รถ + config แถว (JSON) | normalizeSackRows + formatResponse |
| **VehicleType** | CRUD ประเภทรถ | ตรวจสอบซ้ำ + cascade check |
| **SugarType** | CRUD ประเภทน้ำตาล + search | OR search (name, productCode) |
| **CountingSession** | Umbrella session (sack/box) | auto-create sub-session + transaction |
| **SackRow** | CRUD แถวนับกระสอบ | auto-update totalCount → CountingSession |
| **BoxRow** | CRUD แถวนับกล่อง | auto-update totalCount → CountingSession |
| **AiDetector** | ส่งรูปให้ AI service | axios → form-data → Python service |
| **Minio** | Object storage | presigned URL + delete |
| **Database** | PrismaClient wrapper | onModuleInit/onModuleDestroy |
