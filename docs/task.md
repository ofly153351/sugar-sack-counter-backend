# 🚀 NestJS Backend — Project Structure Guide

ระบบ Backend พัฒนาด้วย **NestJS (TypeScript)**
โครงสร้างถูกออกแบบให้ขยายง่าย แยกหน้าที่ชัดเจน เหมาะกับระบบขนาดกลางถึงใหญ่

---

## 📦 Project Setup

### 1️⃣ สร้างโปรเจกต์ใหม่

```bash
npm i -g @nestjs/cli
nest new my-nest-app
cd my-nest-app
```

### 2️⃣ สร้างโฟลเดอร์เพิ่มเติม

```bash
mkdir -p src/{config,common/{guards,interceptors,filters,decorators},modules/{user,dto,auth/{strategies}},database,utils}
touch src/config/{app.config.ts,database.config.ts}
touch src/utils/{logger.ts,password.ts}
touch .env .env.example
```

### 3️⃣ สร้างโมดูลพื้นฐาน

```bash
nest generate module modules/user
nest generate controller modules/user
nest generate service modules/user

nest generate module modules/auth
nest generate controller modules/auth
nest generate service modules/auth

nest generate module database
```

---

## 🗂 Folder Structure

```
my-nest-app/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   └── database.config.ts
│   │
│   ├── common/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   └── decorators/
│   │
│   ├── modules/
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   └── auth/
│   │       ├── auth.module.ts
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── strategies/
│   │           ├── jwt.strategy.ts
│   │           └── local.strategy.ts
│   │
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── utils/
│       ├── logger.ts
│       └── password.ts
│
├── .env
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Environment Variables (.env)

```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your_secret_key
```

---

## 🧩 Folder Overview

| Folder            | Description                                      |
| ----------------- | ------------------------------------------------ |
| **src/config/**   | เก็บไฟล์ config เช่น environment, database       |
| **src/common/**   | โค้ด reusable เช่น guards, interceptors, filters |
| **src/modules/**  | โค้ดหลักของระบบ แยกตาม feature                   |
| **src/database/** | การเชื่อมต่อฐานข้อมูล เช่น Prisma/TypeORM        |
| **src/utils/**    | helper functions เช่น logger, password hashing   |
| **.env**          | เก็บ environment variables                       |
| **main.ts**       | จุดเริ่มต้นของแอป NestJS                         |
| **app.module.ts** | Root module รวมทุกโมดูลเข้าด้วยกัน               |

---

## 🚀 Run Development

```bash
npm run start:dev
```

Server จะรันที่
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧠 Recommended Dependencies

```bash
npm install @nestjs/config @nestjs/jwt passport passport-jwt bcrypt
npm install class-validator class-transformer
npm install prisma --save-dev
```

---

## 🧾 License

MIT © 2025 Peerapat
