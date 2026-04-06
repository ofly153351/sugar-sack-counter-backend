# sugar-sack-counter-backend

Backend for the Sugar Sack/Box Counting system, built with NestJS + Prisma + PostgreSQL, with a separate Python service for AI image detection.

## Project Structure

```text
sugar-sack-counter-backend/
├── src/                          # Main NestJS source code
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module that wires feature modules
│   ├── app.controller.ts         # Base/system-level endpoints
│   ├── app.service.ts            # Base/system-level service
│   ├── health.ts                 # Health check helper
│   ├── config/                   # App, database, and Swagger configuration
│   ├── common/                   # Shared code (guards/decorators)
│   │   ├── decorators/           # Custom decorators (for example: roles)
│   │   └── guards/               # Auth/role guards
│   ├── database/                 # Prisma database module/service
│   ├── modules/                  # Domain feature modules
│   │   ├── auth/                 # Login/JWT/Passport strategies
│   │   ├── user/                 # User management
│   │   ├── admin/                # Admin endpoints
│   │   ├── vehicle/              # Vehicle management
│   │   ├── vehicle-type/         # Vehicle type management
│   │   ├── sugar-type/           # Sugar type management
│   │   ├── counting-session/     # Central counting session module
│   │   ├── sack-row/             # Sack row counting records
│   │   ├── box-row/              # Box row counting records
│   │   ├── ai-detector/          # AI detector integration
│   │   ├── minio/                # Image/file handling with MinIO
│   │   ├── operator/             # Operator-specific endpoints
│   │   ├── sack-counting-session/# DTOs for sack counting sessions
│   │   └── image/                # Reserved folder for image module work
│   └── utils/                    # Utility helpers (logger/password, etc.)
├── prisma/
│   ├── schema.prisma             # Prisma schema and data models
│   └── migrations/               # Migration files
├── scripts/
│   └── seed-database.js          # Database seed script
├── seed/
│   └── seed_data.sql             # SQL seed data
├── python-ai-service/            # Separate Python AI service
│   ├── main.py                   # Main API/logic for AI service
│   ├── minio_client.py           # MinIO integration on Python side
│   ├── requirements.txt          # Python dependencies
│   ├── env.example               # Python service environment template
│   └── *.pt / *.onnx             # Model files
├── deploy/                       # Deployment and nginx config files
│   ├── docker-compose.*.yml
│   └── nginx/nginx.conf
├── docs/                         # Extra architecture/flow/API documents
├── docker-compose.yml            # Main local docker compose file
├── Dockerfile.prod               # Production Docker image file
├── package.json                  # Node/Nest scripts and dependencies
├── env.template                  # Backend environment template
└── API_DOCUMENTATION.md          # API documentation summary
```

## Inside `src/modules`

The project follows a feature/domain-based structure. Most modules contain:

- `*.module.ts` for module registration
- `*.controller.ts` for HTTP routes
- `*.service.ts` for business logic
- `dto/` for request/response schemas and validation
- `entities/` (in some modules) for internal response/data shapes

## Key Files You Should Know

- `src/main.ts`: app bootstrap, global prefix `/api`, CORS, validation, Swagger
- `src/app.module.ts`: root module that imports all features
- `src/database/database.service.ts`: Prisma client and connect/disconnect lifecycle
- `prisma/schema.prisma`: core DB models such as `users`, `vehicles`, `sack_rows`, `box_rows`, `counting_sessions`
- `scripts/seed-database.js`: initial data seeding script

## Structure Notes

- This repository contains both the `NestJS API` and the `python-ai-service` (simple monorepo style)
- Some folders under `src/modules` are scaffolded/reserved and may not yet have full implementation
- More detailed usage and architecture docs are available in `docs/` and root-level markdown files
