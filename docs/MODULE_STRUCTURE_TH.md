# 🧂 Sugar Sack Counter — File Structure แต่ละ Module + ตัวอย่างโค้ด

> โครงสร้างไฟล์แบบ tree view + ตัวอย่างโค้ดทำงานจริง พร้อมคำอธิบายภาษาไทย

---

## 📁 1. Auth Module

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts        ← POST /auth/login, register, logout, refresh, verify
├── auth.service.ts           ← validateUser, login, register, refreshToken, validateToken
├── dto/
│   ├── login.dto.ts          ← { username, password }
│   └── register.dto.ts       ← { email, password, username, firstName, lastName, ... }
└── strategies/
    ├── local.strategy.ts     ← passport-local → ตรวจ username+password
    └── jwt.strategy.ts       ← passport-jwt → ดึง token จาก cookie/header/auth/body
```

### 🔍 ตัวอย่างโค้ด

**login.dto.ts** — กำหนดข้อมูลที่รับจาก client:
```typescript
export class LoginDto {
  @ApiProperty({ description: "ชื่อผู้ใช้งาน", example: "johndoe" })
  @IsString() @IsNotEmpty()
  username: string;

  @ApiProperty({ description: "รหัสผ่าน", example: "password123", minLength: 6 })
  @IsString() @IsNotEmpty() @MinLength(6)
  password: string;
}
```

**auth.service.ts** — ฟังก์ชัน login:
```typescript
async login(user: any, response: any) {
  // 1. ดึง user พร้อม role
  const userWithRole = await this.userService.findUserWithRole(user.id);

  // 2. สร้าง JWT payload
  const payload = {
    email: user.email,
    sub: user.id,
    role: userWithRole.role.name,  // "admin" | "user"
  };

  // 3. เข้ารหัส token
  const token = this.jwtService.sign(payload);

  // 4. เก็บใน HTTP-only cookie (ปลอดภัยจาก XSS)
  response.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,  // 24 ชม.
    path: "/",
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: userWithRole.profile?.firstName,
      lastName: userWithRole.profile?.lastName,
    },
  };
}
```

**jwt.strategy.ts** — วิธีดึง token จาก request:
```typescript
// ตรวจ 4 แหล่งตามลำดับ:
// ① req.cookies["access_token"]          ← cookie-parser ปกติ
// ② req.headers.cookie.split("access_token=")  ← frontend middleware
// ③ req.headers.authorization.split("Bearer ")  ← REST API client
// ④ ใช้ token จาก ①,②,③ ที่หาเจอก่อน

jwtFromRequest: (req) => {
  let token = null;

  if (req?.cookies?.access_token) {
    token = req.cookies.access_token;           // แหล่งที่ ①
  }
  if (!token && req?.headers?.cookie) {
    // แกะ "access_token=xxx" จาก cookie header   // แหล่งที่ ②
    const match = req.headers.cookie.match(/access_token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token && req?.headers?.authorization) {
    // แกะ "Bearer xxx"                           // แหล่งที่ ③
    const auth = req.headers.authorization;
    if (auth.startsWith("Bearer ")) token = auth.substring(7);
  }
  return token;
}
```

---

## 📁 2. User Module

```
src/modules/user/
├── user.module.ts
├── user.controller.ts        ← POST /users, GET /users, GET /users/me, PATCH /users/:id, DELETE /users/:id
├── user.service.ts           ← create, findAll, findOne, update, remove, validateUser, setRole
└── dto/
    ├── create-user.dto.ts    ← { email?, password, username, firstName?, lastName?, title?, phone?, employeeCode? }
    └── update-user.dto.ts    ← partial fields
```

### 🔍 ตัวอย่างโค้ด

**user.service.ts** — CREATE user:
```typescript
async create(createUserDto: CreateUserDto) {
  const { email, password, username, firstName, lastName, employeeCode, phone, title } = createUserDto;

  // ── 1. ตรวจสอบ username ซ้ำ ──
  const dupUser = await this.database.user.findUnique({ where: { username } });
  if (dupUser) throw new ConflictException("Username already exists");

  // ── 2. ตรวจสอบเบอร์โทร (max 10 ตัว, ห้ามซ้ำ) ──
  if (phone) {
    if (phone.length > 10) throw new BadRequestException("Phone number must not exceed 10 characters");
    const dupPhone = await this.database.userProfile.findFirst({ where: { phone } });
    if (dupPhone) throw new ConflictException("Phone number already exists");
  }

  // ── 3. ตรวจสอบ employeeCode ห้ามซ้ำ ──
  if (employeeCode) {
    const dupCode = await this.database.userProfile.findFirst({ where: { employeeCode } });
    if (dupCode) throw new ConflictException("Employee code already exists");
  }

  // ── 4. ถ้าไม่มี email → สร้างจาก username@local.user ──
  const userEmail = email?.trim() || await this.generateAvailableEmailFromUsername(username);

  // ── 5. เข้ารหัส password bcrypt 12 rounds ──
  const hashedPassword = await bcrypt.hash(password, 12);

  // ── 6. สร้าง user + profile + role พร้อมกัน ──
  const user = await this.database.user.create({
    data: {
      email: userEmail,
      password: hashedPassword,
      username,
      role: { connect: { id: await this.getDefaultRoleId() } },  // default = "user"
      profile: {
        create: {
          title: title || "Mr.",
          firstName: firstName || "-",
          lastName: lastName || "-",
          position: "User",
          phone: phone || null,
          employeeCode: employeeCode || null,
        },
      },
    },
  });

  // ── 7. ลบ password ออกจาก response ──
  const { password: _, ...result } = user;
  return result;
}
```

---

## 📁 3. Admin Module

```
src/modules/admin/
├── admin.module.ts
├── admin.controller.ts       ← GET /admin/dashboard, dashboard/summary, users/:id/make-admin, role, password
├── admin.service.ts          ← getDashboardSummary (raw SQL 12 เดือน)
└── dto/
    ├── update-user-role.dto.ts     ← { role: "admin"|"user"|"operator" }
    └── reset-user-password.dto.ts  ← { newPassword }
```

### 🔍 ตัวอย่างโค้ด

**admin.service.ts** — Dashboard Summary:
```typescript
async getDashboardSummary() {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(startOfCurrentMonth.getFullYear(), startOfCurrentMonth.getMonth() - 11, 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // ── Query 4 อย่างพร้อมกัน ──
  const [sackRows, boxRows, totalUsers, totalVehicles] = await Promise.all([
    // sacks: SUM(total_count) per month
    this.database.$queryRaw<MonthlyStat[]>`
      SELECT DATE_TRUNC('month', counting_date) AS month,
             COALESCE(SUM(total_count), 0)::int AS total
      FROM counting_sessions
      WHERE session_type = 'sack'
        AND counting_date >= ${startMonth}
        AND counting_date <= ${endOfCurrentMonth}
      GROUP BY DATE_TRUNC('month', counting_date)
      ORDER BY month ASC
    `,
    // boxes: SUM(total_count) per month
    this.database.$queryRaw<MonthlyStat[]>`
      SELECT DATE_TRUNC('month', counting_date) AS month,
             COALESCE(SUM(total_count), 0)::int AS total
      FROM counting_sessions
      WHERE session_type = 'box'
        AND counting_date >= ${startMonth}
        AND counting_date <= ${endOfCurrentMonth}
      GROUP BY DATE_TRUNC('month', counting_date)
      ORDER BY month ASC
    `,
    this.database.user.count(),
    this.database.vehicle.count(),
  ]);

  // ── ปรับให้ครบ 12 เดือน (เติม 0 ในเดือนที่ไม่มีข้อมูล) ──
  // ... logic เติมเดือนที่ขาด ...

  return {
    sacks:   { thisMonth: 120, last12Months: [{month:"2025-04",total:420},...] },
    boxes:   { thisMonth: 60,  last12Months: [{month:"2025-04",total:260},...] },
    totalUsers: 150,
    totalVehicles: 25,
    range: { startMonth: "2025-04", endMonth: "2026-03" },
  };
}
```

**admin.controller.ts** — Guards:
```typescript
@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)   // ← ทุก endpoint ต้อง login + มี role=admin
@Roles('admin')
export class AdminController {

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.userService.setRole(id, dto.role);  // "admin" | "user" | "operator"
  }

  @Patch('users/:id/password')
  resetUserPassword(@Param('id') id: string, @Body() dto: ResetUserPasswordDto) {
    return this.userService.resetPasswordByAdmin(id, dto.newPassword);
  }
}
```

---

## 📁 4. Vehicle Module

```
src/modules/vehicle/
├── vehicle.module.ts
├── vehicle.controller.ts     ← POST /vehicles, GET /vehicles, active, code/:code, license/:plate
├── vehicle.service.ts        ← create, findAll, findOne, update, remove, normalizeSackRows
└── dto/
    ├── create-vehicle.dto.ts       ← { vehicleCode, licensePlate, vehicleTypeId, maxLoadWeightTon, driverUserId, sackRows? }
    ├── update-vehicle.dto.ts       ← partial
    └── vehicle-sack-row-input.dto.ts ← { rowNumber, sackCount?, bagCount? }
```

### 🔍 ตัวอย่างโค้ด

**vehicle.service.ts** — CREATE:
```typescript
async create(createVehicleDto: CreateVehicleDto) {
  const { vehicleCode, licensePlate, vehicleTypeId, maxLoadWeightTon, driverUserId, status, sackRows, bagRows } = createVehicleDto;

  // ── 1. normalizeSackRows: รับได้ทั้ง sackRows และ bagRows ──
  const normalizedSackRows = this.normalizeSackRows(sackRows, bagRows) ?? [];
  // ผลลัพธ์: [{ rowNumber:1, sackCount:20 }, { rowNumber:2, sackCount:18 }]

  // ── 2. ตรวจสอบ vehicleCode / licensePlate ห้ามซ้ำ ──
  if (await this.database.vehicle.findUnique({ where: { vehicleCode } }))
    throw new ConflictException("Vehicle code already exists");
  if (await this.database.vehicle.findUnique({ where: { licensePlate } }))
    throw new ConflictException("License plate already exists");

  // ── 3. ตรวจสอบ vehicleType + driverUser มีอยู่จริง ──
  const vehicleType = await this.database.vehicleType.findUnique({ where: { id: vehicleTypeId } });
  if (!vehicleType) throw new NotFoundException("Vehicle type not found");

  const driverUser = await this.database.user.findUnique({
    where: { id: driverUserId },
    include: { profile: true },
  });
  if (!driverUser) throw new NotFoundException("Driver user not found");

  // ── 4. สร้าง driverName จาก firstName + lastName ──
  const driverName = [driverUser.profile?.firstName, driverUser.profile?.lastName]
    .filter(Boolean).join(" ").trim() || driverUser.username;

  // ── 5. สร้าง vehicle ──
  const vehicle = await this.database.vehicle.create({
    data: {
      vehicleCode, licensePlate, vehicleTypeId, maxLoadWeightTon,
      vehicleRowConf: normalizedSackRows,  // ← เก็บเป็น JSON
      driverUserId, driverName,
      status: status || "active",
    },
    include: { vehicleType: true, driver: { select: { id: true, username: true, profile: true } } },
  });

  return this.formatVehicleResponse(vehicle);
  // Response: { ...vehicle, sackRows: [...], bagRows: [...], totalSacks: 38 }
}
```

**normalizeSackRows** — ฟังก์ชันสำคัญ:
```typescript
private normalizeSackRows(sackRows?, bagRows?): SackRow[] | null {
  if (sackRows === undefined && bagRows === undefined) return null;
  const sourceRows = sackRows ?? bagRows ?? [];

  const normalized = sourceRows.map((row, index) => {
    const sackCount = row.sackCount ?? row.bagCount;  // alias: bagCount = sackCount

    if (!Number.isInteger(row.rowNumber) || row.rowNumber <= 0)
      throw new BadRequestException(`Invalid rowNumber at index ${index}`);
    if (sackCount === undefined)
      throw new BadRequestException(`Missing sackCount/bagCount at index ${index}`);
    if (!Number.isInteger(sackCount) || sackCount < 0)
      throw new BadRequestException(`Invalid sackCount at index ${index}`);

    return { rowNumber: row.rowNumber, sackCount };
  });

  // ── ห้าม rowNumber ซ้ำ ──
  const rowNumbers = new Set(normalized.map(r => r.rowNumber));
  if (rowNumbers.size !== normalized.length)
    throw new BadRequestException("Duplicate row numbers");

  return normalized.sort((a, b) => a.rowNumber - b.rowNumber);
}
```

---

## 📁 5. VehicleType Module

```
src/modules/vehicle-type/
├── vehicle-type.module.ts
├── vehicle-type.controller.ts   ← CRUD + search + getWithVehicles
├── vehicle-type.service.ts      ← create, findAll, findOne, update, remove, search
└── dto/
    ├── create-vehicle-type.dto.ts  ← { name }
    └── update-vehicle-type.dto.ts  ← { name? }
```

### 🔍 ตัวอย่างโค้ด

```typescript
// remove — ห้ามลบถ้ามีรถใช้อยู่
async remove(id: string) {
  const vehicleType = await this.database.vehicleType.findUnique({ where: { id } });
  if (!vehicleType) throw new NotFoundException("Vehicle type not found");

  const hasVehicles = await this.database.vehicle.findFirst({ where: { vehicleTypeId: id } });
  if (hasVehicles)
    throw new BadRequestException("Cannot delete vehicle type that has vehicles assigned");

  await this.database.vehicleType.delete({ where: { id } });
  return { message: "Vehicle type deleted successfully" };
}

// search — ค้นหาจากชื่อ (case-insensitive)
async searchVehicleTypes(searchTerm: string) {
  return this.database.vehicleType.findMany({
    where: { name: { contains: searchTerm, mode: "insensitive" } },
    orderBy: { name: "asc" },
  });
}
```

---

## 📁 6. SugarType Module

```
src/modules/sugar-type/
├── sugar-type.module.ts
├── sugar-type.controller.ts    ← CRUD + search + getWithSessions + getActive
├── sugar-type.service.ts       ← create, findAll, findOne, update, remove, search
└── dto/
    ├── create-sugar-type.dto.ts  ← { name, productCode? }
    └── update-sugar-type.dto.ts  ← { name?, productCode? }
```

### 🔍 ตัวอย่างโค้ด

```typescript
// search — ค้นหาจาก name หรือ productCode
async searchSugarTypes(searchTerm: string) {
  return this.database.sugarType.findMany({
    where: {
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { productCode: { contains: searchTerm, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
  });
}

// remove — ห้ามลบถ้ามี session ใช้อยู่
async remove(id: string) {
  const [sack, box, counting] = await Promise.all([
    this.database.sackCountingSession.findFirst({ where: { sugarTypeId: id } }),
    this.database.boxCountingSession.findFirst({ where: { sugarTypeId: id } }),
    this.database.countingSession.findFirst({ where: { sugarTypeId: id } }),
  ]);
  if (sack || box || counting)
    throw new BadRequestException("Cannot delete sugar type that has counting sessions");

  await this.database.sugarType.delete({ where: { id } });
  return { message: "Sugar type deleted successfully" };
}
```

---

## 📁 7. CountingSession Module

```
src/modules/counting-session/
├── counting-session.module.ts
├── counting-session.controller.ts   ← POST, GET, GET type/:type, user/:id, vehicle/:id, PATCH, DELETE
├── counting-session.service.ts      ← create, findAll, findOne, update, remove, removeBySessionType
├── entities/
│   └── counting-session.entity.ts   ← class เปล่าสำหรับ Swagger
└── dto/
    ├── create-counting-session.dto.ts        ← { sessionType, userId, vehicleId, sugarTypeId, ... }
    ├── update-counting-session.dto.ts        ← partial
    └── counting-session-response.dto.ts      ← response DTO (ใช้ class-transformer)
```

### 🔍 ตัวอย่างโค้ด

**counting-session.service.ts** — CREATE (สร้าง sub-session อัตโนมัติ):
```typescript
async create(createCountingSessionDto: CreateCountingSessionDto) {
  const { sessionType, sackSessionId, boxSessionId, userId, vehicleId, sugarTypeId, ...data } = createCountingSessionDto;

  // ── 1. validate foreign keys ──
  if (!await this.prisma.user.findUnique({ where: { id: userId } }))
    throw new NotFoundException("User not found");
  if (!await this.prisma.vehicle.findUnique({ where: { id: vehicleId } }))
    throw new NotFoundException("Vehicle not found");
  if (!await this.prisma.sugarType.findUnique({ where: { id: sugarTypeId } }))
    throw new NotFoundException("Sugar type not found");

  // ── 2. sessionType="sack" และไม่มี sackSessionId → สร้าง SackCountingSession ใหม่ ──
  if (sessionType === "sack" && !sackSessionId) {
    const sackCountingSession = await this.prisma.sackCountingSession.create({
      data: {
        vehicleId, sugarTypeId, userId,
        countingDate: data.countingDate ? new Date(data.countingDate) : new Date(),
        status: data.status || "in_progress",
      },
    });

    // สร้าง CountingSession ที่ link ไปหา sackCountingSession
    createdCountingSession = await this.prisma.countingSession.create({
      data: { sessionType, sackSessionId: sackCountingSession.id, userId, vehicleId, sugarTypeId, ...data },
      include: this.getSessionInclude(),
    });
  }

  // ── 3. sessionType="box" และไม่มี boxSessionId → สร้าง BoxCountingSession ใหม่ ──
  else if (sessionType === "box" && !boxSessionId) {
    const boxCountingSession = await this.prisma.boxCountingSession.create({
      data: { vehicleId, sugarTypeId, userId, countingDate: new Date(), status: data.status || "in_progress" },
    });
    createdCountingSession = await this.prisma.countingSession.create({
      data: { sessionType, boxSessionId: boxCountingSession.id, userId, vehicleId, sugarTypeId, ...data },
      include: this.getSessionInclude(),
    });
  }

  // ── 4. มี sessionId อยู่แล้ว → link โดยตรง ──
  else {
    createdCountingSession = await this.prisma.countingSession.create({
      data: { sessionType, sackSessionId, boxSessionId, userId, vehicleId, sugarTypeId, ...data },
      include: this.getSessionInclude(),
    });
  }

  return plainToInstance(CountingSessionResponseDto, createdCountingSession);
}
```

**getSessionInclude** — ความสัมพันธ์ที่โหลดมาด้วย:
```typescript
private getSessionInclude() {
  return {
    user: { include: { profile: true } },
    vehicle: true,
    sugarType: true,
    sackSession: { include: { sackRows: true } },  // ← โหลดแถวกระสอบมาด้วย
    boxSession: { include: { boxRows: true } },     // ← โหลดแถวกล่องมาด้วย
  };
}
```

---

## 📁 8. SackRow Module

```
src/modules/sack-row/
├── sack-row.module.ts
├── sack-row.controller.ts          ← POST, GET session/:id, GET :id, PATCH, DELETE
├── sack-row.service.ts             ← create, createByCountingSession, findAllBySession, update, remove, updateSessionTotals
├── entities/
│   └── sack-row.entity.ts          ← { id, sessionId, rowNumber, weightType, aiCount, finalCount, ... }
└── dto/
    ├── create-sack-row.dto.ts                   ← { sessionId, rowNumber, weightType, aiCount?, finalCount, ... }
    ├── create-sack-row-by-counting-session.dto.ts  ← { countingSessionId, rowNumber, weightType, finalCount, ... }
    ├── update-sack-row.dto.ts
    └── index.ts
```

### 🔍 ตัวอย่างโค้ด

**sack-row.service.ts** — CREATE + auto-update totals:
```typescript
async create(createSackRowDto: CreateSackRowDto) {
  const { sessionId, ...data } = createSackRowDto;

  // ── 1. ตรวจสอบ session มีอยู่ ──
  const session = await this.prisma.sackCountingSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundException(`Sack session ${sessionId} not found`);

  // ── 2. ตรวจสอบ rowNumber ห้ามซ้ำใน session เดียวกัน ──
  const existingRow = await this.prisma.sackRow.findFirst({
    where: { sessionId, rowNumber: data.rowNumber },
  });
  if (existingRow) throw new BadRequestException(`Row number ${data.rowNumber} already exists`);

  // ── 3. สร้าง row ──
  const sackRow = await this.prisma.sackRow.create({
    data: { sessionId, ...data },
    include: { session: true },
  });

  // ── 4. อัพเดทยอดรวมอัตโนมัติ ──
  await this.updateSessionTotals(sessionId);

  return sackRow;
}

// updateSessionTotals — SUM(finalCount) → อัพเดท CountingSession.totalCount
private async updateSessionTotals(sessionId: string) {
  const result = await this.prisma.sackRow.aggregate({
    where: { sessionId },
    _sum: { finalCount: true },
  });

  const totalSacks = result._sum.finalCount || 0;

  // หา CountingSession ที่ link กับ sackSessionId นี้
  const countingSession = await this.prisma.countingSession.findFirst({
    where: { sackSessionId: sessionId },
  });

  if (countingSession) {
    await this.prisma.countingSession.update({
      where: { id: countingSession.id },
      data: { totalCount: totalSacks },
    });
  }

  return totalSacks;
}
```

**createByCountingSession** — สร้างผ่าน countingSessionId แทน sessionId:
```typescript
async createByCountingSession(dto: CreateSackRowByCountingSessionDto) {
  const { countingSessionId, ...rowData } = dto;

  // 1. หา countingSession
  const countingSession = await this.prisma.countingSession.findUnique({
    where: { id: countingSessionId },
    include: { sackSession: true },
  });
  if (!countingSession) throw new NotFoundException("Counting session not found");

  // 2. ตรวจสอบว่าเป็น sack session
  if (countingSession.sessionType !== "sack")
    throw new BadRequestException("Not a sack session");

  // 3. ใช้ sackSessionId ไปสร้าง row
  return this.create({ sessionId: countingSession.sackSessionId, ...rowData });
}
```

---

## 📁 9. BoxRow Module

```
src/modules/box-row/
├── box-row.module.ts
├── box-row.controller.ts          ← POST, GET session/:id, GET :id, PATCH, DELETE
├── box-row.service.ts             ← create, createByCountingSession, findAllBySession, update, remove
└── dto/
    ├── create-box-row.dto.ts                   ← { sessionId, rowNumber, aiCount?, finalCount, ... }
    ├── create-box-row-by-counting-session.dto.ts  ← { countingSessionId, rowNumber, finalCount, ... }
    ├── update-box-row.dto.ts
    └── index.ts
```

### 🔍 ตัวอย่างโค้ด (โครงสร้างเหมือน SackRow แต่ไม่มี weightType)

```typescript
async create(createBoxRowDto: CreateBoxRowDto) {
  const { sessionId, ...data } = createBoxRowDto;

  // ตรวจสอบ session
  const session = await this.prisma.boxCountingSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundException("Box session not found");

  // ตรวจสอบ rowNumber ห้ามซ้ำ
  const existing = await this.prisma.boxRow.findFirst({
    where: { sessionId, rowNumber: data.rowNumber },
  });
  if (existing) throw new BadRequestException(`Row ${data.rowNumber} already exists`);

  // สร้าง + อัพเดทยอดรวม
  const boxRow = await this.prisma.boxRow.create({ data: { sessionId, ...data }, include: { session: true } });
  await this.updateSessionTotal(sessionId);
  return boxRow;
}
```

---

## 📁 10. AiDetector Module

```
src/modules/ai-detector/
├── ai-detector.module.ts
├── ai-detector.controller.ts     ← POST /ai/detect (รับไฟล์ multipart)
├── ai-detector.service.ts        ← detectPersons → axios → localhost:8082/detect
└── index.ts
```

### 🔍 ตัวอย่างโค้ด

**ai-detector.service.ts**:
```typescript
@Injectable()
export class AiDetectorService {
  private readonly aiServiceUrl = "http://localhost:8082/detect";  // Python AI service

  async detectPersons(file: Express.Multer.File): Promise<DetectionResult> {
    // ── 1. สร้าง FormData จาก buffer ──
    const formData = new FormData();
    formData.append("file", Readable.from(file.buffer), {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    // ── 2. POST ไปหา AI service (timeout 30 วิ) ──
    const response = await axios.post(this.aiServiceUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    return response.data;
    // { person_count: 25, annotated_image: "base64...", detections: [...] }
  }
}
```

**ai-detector.controller.ts**:
```typescript
@Controller("ai")
export class AiDetectorController {
  @Post("detect")
  @UseInterceptors(FileInterceptor("image"))   // ← รับไฟล์ field "image"
  async detectPersons(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No image file provided");

    const result = await this.aiDetectorService.detectPersons(file);
    return {
      person_count: result.person_count,
      annotated_image: result.annotated_image,   // base64
      detections: result.detections,              // [{class, confidence, bbox}]
    };
  }
}
```

**Request → Response flow**:
```
Client                          NestJS                         AI Service (Python)
  │                               │                                │
  │  POST /ai/detect              │                                │
  │  Content-Type: multipart      │                                │
  │  image=@photo.jpg             │                                │
  │ ─────────────────────────────→│                                │
  │                               │  POST :8082/detect             │
  │                               │  Content-Type: multipart       │
  │                               │ ──────────────────────────────→│
  │                               │                                │ YOLO/Object Detection
  │                               │  { person_count: 25,           │
  │                               │    annotated_image: "base64",  │
  │                               │    detections: [...] }         │
  │                               │ ←──────────────────────────────│
  │  { person_count: 25,         │                                │
  │    annotated_image: "...",   │                                │
  │    detections: [...] }       │                                │
  │ ←─────────────────────────────│                                │
```

---

## 📁 11. Minio Module

```
src/modules/minio/
├── minio.module.ts
├── minio.controller.ts          ← (health check)
└── minio.service.ts             ← getPresignedUrl, deleteObject, fileExists, healthCheck
```

### 🔍 ตัวอย่างโค้ด

```typescript
@Injectable()
export class MinioService {
  private minioClient: Minio.Client;
  private bucketName: string;

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

  // ── สร้างลิงก์ชั่วคราว 24 ชม. ──
  async getPresignedUrl(objectName: string, expirySeconds = 86400): Promise<string | null> {
    if (!objectName) return null;
    try {
      const cleanName = objectName.startsWith("/") ? objectName.substring(1) : objectName;
      return await this.minioClient.presignedGetObject(this.bucketName, cleanName, expirySeconds);
    } catch (error) {
      return null;
    }
  }

  // ── ลบไฟล์ (ignore ถ้าไม่มี) ──
  async deleteObject(objectName: string): Promise<void> {
    if (!objectName) return;
    try {
      await this.minioClient.removeObject(this.bucketName, cleanName);
    } catch (error) {
      if (error?.code === "NotFound" || error?.code === "NoSuchKey") return;  // ignore
      throw error;
    }
  }
}
```

---

## 📁 12. Database Module

```
src/database/
├── database.module.ts            ← @Global() module
└── database.service.ts           ← PrismaClient wrapper
```

### 🔍 ตัวอย่างโค้ด

```typescript
@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: { url: configService.get("DATABASE_URL") },
      },
    });
  }

  async onModuleInit() { await this.$connect(); }      // start: connect
  async onModuleDestroy() { await this.$disconnect(); }  // shutdown: disconnect
}
```

---

## 📁 Root Structure

```
src/
├── main.ts                        ← NestFactory.create(AppModule)
├── app.module.ts                  ← @Module({ imports: [ทุก module] })
├── app.controller.ts              ← health check
├── app.service.ts
├── config/
│   ├── app.config.ts              ← JWT secret, port
│   ├── database.config.ts         ← DATABASE_URL
│   └── swagger.config.ts          ← Swagger setup
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts      ← extends AuthGuard('jwt')
│   │   └── roles.guard.ts         ← ตรวจสอบ role จาก req.user
│   └── decorators/
│       └── roles.decorator.ts     ← @Roles('admin')
├── database/
│   ├── database.module.ts
│   └── database.service.ts
└── modules/
    ├── auth/                      ← 🔐
    ├── user/                      ← 👤
    ├── admin/                     ← 🛡️
    ├── vehicle/                   ← 🚛
    ├── vehicle-type/              ← 🏷️
    ├── sugar-type/                ← 🍬
    ├── counting-session/          ← 📊
    ├── sack-row/                  ← 📏
    ├── box-row/                   ← 📦
    ├── ai-detector/               ← 🤖
    └── minio/                     ← 🗄️
```

---

## 🔄 Data Flow ตัวอย่าง — นับกระสอบ 1 session

```
1. POST /counting-sessions { sessionType:"sack", userId, vehicleId, sugarTypeId }
   └─→ CountingSessionService.create()
       └─→ สร้าง SackCountingSession อัตโนมัติ
       └─→ สร้าง CountingSession link ไปหา SackCountingSession
       └─→ Response: { id, sackSessionId, ... }

2. POST /sack-rows/by-counting-session { countingSessionId, rowNumber:1, weightType:"50kg", finalCount:20 }
   └─→ SackRowService.createByCountingSession()
       └─→ หา countingSession → ตรวจสอบ sessionType="sack"
       └─→ สร้าง SackRow ด้วย countingSession.sackSessionId
       └─→ updateSessionTotals(): SUM(finalCount) → อัพเดท CountingSession.totalCount

3. POST /ai/detect (multipart: image=@row1.jpg)
   └─→ AiDetectorController.detectPersons()
       └─→ AiDetectorService.detectPersons() → axios → localhost:8082
       └─→ Response: { person_count: 22, annotated_image: "base64..." }

4. PATCH /sack-rows/:id { aiCount:22 }
   └─→ อัพเดท aiCount → ไม่เปลี่ยน totalCount (ใช้ finalCount)

5. PATCH /counting-sessions/:id { status:"completed" }
   └─→ CountingSessionService.update() → transaction:
       └─→ อัพเดท CountingSession.status
       └─→ sync อัพเดท SackCountingSession.status ด้วย
```

---

## 🗃️ Prisma Schema (Database Tables)

```
prisma/
└── schema.prisma                 ← 11 models + relations
```

### ตารางและความสัมพันธ์:
```
roles ──1:N──→ users ──1:1──→ user_profiles
                  │
                  ├──1:N──→ vehicles ──1:N──→ sack_counting_sessions ──1:N──→ sack_rows
                  │         │    │
                  │         │    ├──1:N──→ box_counting_sessions ──1:N──→ box_rows
                  │         │    │
                  │         │    └──1:N──→ counting_sessions (umbrella)
                  │         │              │
                  │         │              ├──1:0..1──→ sack_counting_sessions
                  │         │              └──1:0..1──→ box_counting_sessions
                  │         │
                  │         └── vehicle_types (1:N)
                  │
                  └── sugar_types (1:N → ทุก session)
```

---

---

# 🤖 13. Python AI Service — เฉพาะนับกระสอบ

```
python-ai-service/
├── main.py                          ← FastAPI server (YOLO detection + MinIO)
├── minio_client.py                  ← MinIO upload/download client
├── bestTeacher.pt                   ← Custom trained YOLOv8 model
├── requirements.txt                 ← fastapi, uvicorn, ultralytics, opencv, minio, torch
├── start.sh                         ← script ตั้งค่า venv + start server
├── .env                             ← MINIO_ENDPOINT, MODEL_PATH, CONFIDENCE_THRESHOLD
└── README.md
```

## 🔍 หลักการทำงาน

```
Frontend/App          NestJS Backend           Python AI Service (FastAPI :8082)        MinIO
     │                      │                          │                                │
     │  POST /ai/detect     │                          │                                │
     │  multipart: image    │                          │                                │
     │─────────────────────→│                          │                                │
     │                      │  POST /detect-sacks      │                                │
     │                      │  multipart: image        │                                │
     │                      │─────────────────────────→│                                │
     │                      │                          │ 1. decode รูปด้วย OpenCV       │
     │                      │                          │ 2. YOLO detect (bestTeacher.pt)│
     │                      │                          │ 3. filter เฉพาะ class "sack"   │
     │                      │                          │ 4. confidence > 0.45           │
     │                      │                          │ 5. draw bounding boxes สีแดง   │
     │                      │                          │ 6. แปลงเป็น base64             │
     │                      │                          │ 7. save to MinIO (optional)    │
     │                      │                          │───────────────────────────────→│
     │                      │                          │←─── presigned URL ─────────────│
     │                      │  { sack_count,           │                                │
     │                      │    annotated_image(base64),                              │
     │                      │    detections,           │                                │
     │                      │    storage }             │                                │
     │                      │←─────────────────────────│                                │
     │  { person_count,     │                          │                                │
     │    annotated_image } │                          │                                │
     │←─────────────────────│                          │                                │
```

## 📡 Endpoints (ที่ใช้จริง)

| Method | Path | คำอธิบาย |
|--------|------|---------|
| GET | `/health` | เช็คสถานะ (model loaded?, MinIO connected?) |
| POST | `/detect-sacks` | 🔥 ตรวจนับเฉพาะกระสอบ |
| POST | `/save-to-minio` | บันทึกรูปลง MinIO (manual save workflow) |

## 🔍 ตัวอย่างโค้ดสำคัญ

**main.py** — โหลดโมเดล:
```python
from ultralytics import YOLO
from fastapi import FastAPI, File, UploadFile, Form

app = FastAPI(title="AI Sugar Sack Detection Service")

# ── โหลดค่าจาก .env ──
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.45"))
MODEL_PATH = os.getenv("MODEL_PATH", "bestTeacher.pt")

# ── โหลดโมเดลที่เทรนเอง ──
model = YOLO(MODEL_PATH)  # bestTeacher.pt
print(f"📋 Model classes: {model.names}")  # เช่น {0: 'zone', 7: 'bag', 9: 'bbox'}
```

**POST /detect-sacks** — ตรวจนับเฉพาะกระสอบ:
```python
@app.post("/detect-sacks")
async def detect_sacks_only(
    file: UploadFile = File(...),
    save_to_minio: bool = Form(False),
    session_id: str = Form(None)
):
    # 1. อ่านรูป → decode ด้วย OpenCV
    image_data = await file.read()
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. รัน YOLO model
    results = model(image)

    detections = []
    sack_count = 0

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            raw_name = model.names[class_id]       # "bag"
            class_name = CLASS_ALIASES.get(raw_name)  # → "sack"
            confidence = float(box.conf[0])

            # 3. เอาเฉพาะ sack + confidence > threshold
            if class_name == "sack" and confidence > CONFIDENCE_THRESHOLD:
                sack_count += 1
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(Detection("sack", confidence, [x1, y1, x2, y2]))

    # 4. วาด bounding box สีแดงบนรูป → base64
    annotated_image = draw_bounding_boxes(image.copy(), detections)
    base64_image = image_to_base64(annotated_image)

    # 5. save to MinIO (optional)
    storage_info = {}
    if save_to_minio and minio_client:
        success, obj_name, url = minio_client.upload_file(
            file_data=cv2.imencode(".jpg", annotated_image)[1].tobytes(),
            original_filename=f"annotated_{file.filename}",
            prefix=f"annotated/{session_id}",
            content_type="image/jpeg"
        )
        if success:
            storage_info = {"storage": {"annotated_object_name": obj_name, "annotated_url": url}}

    return {
        "status": "success",
        "sack_count": sack_count,
        "annotated_image": base64_image,
        "detections": [{"class": d.class_name, "confidence": d.confidence, "bbox": d.bbox} for d in detections],
        "session_id": session_id,
        **storage_info
    }
```

**draw_bounding_boxes** — วาดกรอบ:
```python
def draw_bounding_boxes(image: np.ndarray, detections) -> np.ndarray:
    img_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)

    for det in detections:
        x1, y1, x2, y2 = det.bbox
        # กรอบสีแดงสำหรับกระสอบ
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        # เลข confidence
        label = f"sack {det.confidence:.1%}"
        draw.rectangle([x1, y1 - 22, x1 + 100, y1], fill="red")
        draw.text((x1 + 5, y1 - 20), label, fill="white")

    # summary มุมซ้ายบน: "sack: 25"
    draw.rectangle([10, 10, 150, 40], fill=(0, 0, 0, 160))
    draw.text((18, 18), f"sack: {len(detections)}", fill="white")

    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
```

## ⚙️ .env Configuration

```env
# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=sugar-sack

# AI Model
MODEL_PATH=bestTeacher.pt
CONFIDENCE_THRESHOLD=0.45       # กระสอบ: ต้องมั่นใจ > 45%

# Server
HOST=0.0.0.0
PORT=8082
```

## 🚀 การรัน

```bash
cd python-ai-service
./start.sh                       # venv + pip install + start
# หรือ
source venv/bin/activate
python3 main.py                  # → http://0.0.0.0:8082
```

## 🧪 ทดสอบด้วย curl

```bash
# health check
curl http://localhost:8082/health

# ตรวจนับกระสอบ + บันทึกลง MinIO
curl -X POST http://localhost:8082/detect-sacks \
  -F "file=@row1.jpg" \
  -F "save_to_minio=true" \
  -F "session_id=sess_abc123"

# Response:
# {
#   "status": "success",
#   "sack_count": 25,
#   "annotated_image": "/9j/4AAQSkZJRg...",   ← base64 JPEG เอาไป <img src="data:image/jpeg;base64,...">
#   "detections": [
#     {"class":"sack","confidence":0.89,"bbox":[100,150,200,300]}
#   ],
#   "storage": {
#     "annotated_object_name": "annotated/sess_abc123/20260131_143022_a1b2.jpg",
#     "annotated_url": "http://localhost:9000/sugar-sack/..."
#   }
# }
```

## 🔄 Flow — นับกระสอบ 1 แถว

```
1. NestJS: POST /counting-sessions { sessionType:"sack", userId, vehicleId, sugarTypeId }
   → ได้ countingSessionId + sackSessionId

2. ส่งรูปไป AI:
   POST :8082/detect-sacks -F "file=@row1.jpg" -F "save_to_minio=true" -F "session_id={sackSessionId}"
   → ได้ { sack_count:22, annotated_image:"base64...", storage:{...} }

3. แสดงผลให้ user ดู:
   <img src="data:image/jpeg;base64,{annotated_image}" />

4. user กดยืนยัน → บันทึก row:
   POST /sack-rows/by-counting-session {
     countingSessionId, rowNumber:1, weightType:"50kg",
     aiCount:22, finalCount:20,
     annotatedImagePath: storage.annotated_object_name
   }
   → SackRowService อัพเดท CountingSession.totalCount อัตโนมัติ
```

---

📄 ไฟล์นี้: `docs/MODULE_STRUCTURE_TH.md`
🖼️ ER Diagram: `docs/er-diagram.excalidraw`
📖 คำอธิบายโค้ดละเอียด: `docs/MODULE_EXPLANATION_TH.md`

---

📄 ไฟล์นี้: `docs/MODULE_STRUCTURE_TH.md`
🖼️ ER Diagram: `docs/er-diagram.excalidraw`
📖 คำอธิบายโค้ดละเอียด: `docs/MODULE_EXPLANATION_TH.md`
