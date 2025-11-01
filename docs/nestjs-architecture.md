# NestJS Architecture Documentation - Sugar Sack Counter

## โครงสร้างพื้นฐานของ NestJS (Module-Controller-Service Pattern)

ใน NestJS มี 3 ส่วนหลักที่ทำงานร่วมกันเป็นโครงสร้างพื้นฐาน:

## 1. Module (`*.module.ts`)

### หน้าที่
- **จัดกลุ่มความสัมพันธ์** ระหว่าง components ต่างๆ
- **กำหนด dependencies** ที่ต้องใช้ใน module
- **ประกาศ** Controller และ Service ที่ทำงานร่วมกัน
- **จัดการ imports/exports** ของ module อื่นๆ

### โครงสร้างตัวอย่าง
```typescript
@Module({
  imports: [DatabaseModule, OtherModule],
  controllers: [AuthController, UserController],
  providers: [AuthService, UserService],
  exports: [AuthService],
})
export class AuthModule {}
```

## 2. Controller (`*.controller.ts`)

### หน้าที่
- **รับ HTTP requests** จาก client
- **กำหนด routes** และ HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **ตรวจสอบข้อมูล input** (validation)
- **เรียกใช้ Service** เพื่อประมวลผล business logic
- **ส่ง response** กลับไปยัง client

### โครงสร้างตัวอย่าง
```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

## 3. Service (`*.service.ts`)

### หน้าที่
- **ประกอบด้วย business logic** จริงๆ
- **ทำงานกับ database** (CRUD operations)
- **ประมวลผลข้อมูล** และคำนวณ
- **จัดการ business rules** และ validation logic
- **ไม่รู้เรื่อง HTTP** หรือ routes

### โครงสร้างตัวอย่าง
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Business logic สำหรับการ login
    const user = await this.validateUser(loginDto);
    const token = this.generateToken(user);
    return { user, token };
  }
}
```

## การทำงานร่วมกัน

```
Client Request
    ↓
Controller (รับ request, validate)
    ↓
Service (ประมวลผล business logic)
    ↓
Database (เก็บ/ดึงข้อมูล)
    ↓
Service (ประมวลผลผลลัพธ์)
    ↓
Controller (ส่ง response กลับ)
    ↓
Client Response
```

## ตัวอย่างการทำงานจริงใน Sugar Sack Counter

### 1. การสมัครสมาชิก (Registration)

```
Client → POST /auth/register
    ↓
AuthController.register()
    ↓
AuthService.register()
    ↓
UserService.createUser()
    ↓
Database (INSERT INTO users)
    ↓
AuthService.generateToken()
    ↓
AuthController (ส่ง response กลับ)
```

### 2. การนับกระสอบน้ำตาล

```
Client → POST /sack-counting/sessions
    ↓
SackCountingController.createSession()
    ↓
SackCountingService.createSession()
    ↓
VehicleService.validateVehicle()
    ↓
SugarTypeService.validateSugarType()
    ↓
Database (INSERT INTO sack_counting_sessions)
    ↓
SackCountingController (ส่ง response กลับ)
```

## ประโยชน์ของโครงสร้างนี้

### 1. Separation of Concerns
- **Controller**: ดูแลเฉพาะ HTTP-related logic
- **Service**: ดูแลเฉพาะ business logic
- **Module**: ดูแลการจัดระเบียบ dependencies

### 2. Testability
```typescript
// ทดสอบ Service โดยไม่ต้องเกี่ยวข้องกับ HTTP
describe('AuthService', () => {
  it('should validate user credentials', () => {
    const result = authService.validateUser(loginDto);
    expect(result).toBeDefined();
  });
});
```

### 3. Reusability
- Service สามารถถูกเรียกใช้จากหลาย Controller
- Module สามารถนำกลับมาใช้ใหม่ได้

### 4. Maintainability
- แก้ไข business logic ใน Service โดยไม่กระทบ Controller
- แก้ไข routes ใน Controller โดยไม่กระทบ business logic

## Best Practices

### 1. Controller ควรบางที่สุด
- ตรวจสอบ input เท่านั้น
- เรียกใช้ Service
- ส่ง response กลับ

### 2. Service ควรประกอบด้วย business logic
- ไม่ควรมี HTTP-related code
- ทำงานกับ database ผ่าน repository

### 3. Module ควรจัดกลุ่มตาม feature
- AuthModule: การยืนยันตัวตน
- UserModule: จัดการผู้ใช้งาน
- VehicleModule: จัดการรถขนส่ง
- CountingModule: การนับกระสอบ/กล่อง

### 4. ใช้ Dependency Injection
```typescript
constructor(
  private readonly authService: AuthService,
  private readonly userService: UserService,
) {}
```

## โครงสร้างไฟล์ในโปรเจคนี้

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── dto/
│   ├── user/
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.module.ts
│   │   └── dto/
│   ├── vehicles/
│   │   ├── vehicles.controller.ts
│   │   ├── vehicles.service.ts
│   │   └── vehicles.module.ts
│   └── counting/
│       ├── sack-counting.controller.ts
│       ├── sack-counting.service.ts
│       └── sack-counting.module.ts
├── common/
│   ├── guards/
│   ├── filters/
│   └── interceptors/
└── config/
```

โครงสร้างนี้ทำให้การพัฒนาและบำรุงรักษาโปรเจคทำได้ง่ายและมีประสิทธิภาพ!