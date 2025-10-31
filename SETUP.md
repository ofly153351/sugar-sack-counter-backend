# 🚀 Sugar Sack Counter Backend - Setup Guide

## 📋 Project Overview
NestJS backend application for managing sugar sack inventory and counting operations.

## 🛠️ Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Git

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sugar-sack-counter-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to `.env` and update the values:
```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/sugar_sack_counter
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

### 4. Database Setup

#### Option A: Using Prisma (Recommended)
1. Generate Prisma client:
```bash
npx prisma generate
```

2. Run database migrations:
```bash
npx prisma migrate dev --name init
```

3. (Optional) View database in Prisma Studio:
```bash
npx prisma studio
```

#### Option B: Manual Database Creation
```sql
CREATE DATABASE sugar_sack_counter;
```

### 5. Start the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

## 🏗️ Project Structure
```
sugar-sack-counter-backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration files
│   ├── common/                 # Shared utilities
│   ├── modules/                # Feature modules
│   │   ├── user/               # User management
│   │   └── auth/               # Authentication
│   ├── database/               # Database layer
│   └── utils/                  # Utility functions
├── prisma/                     # Database schema
└── dist/                       # Compiled output
```

## 🔧 Available Scripts
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (protected)
- `POST /auth/refresh` - Refresh token (protected)

### Users
- `GET /users` - Get all users (protected)
- `GET /users/:id` - Get user by ID (protected)
- `POST /users` - Create user
- `PATCH /users/:id` - Update user (protected)
- `DELETE /users/:id` - Delete user (protected)

## 🔐 Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User
- id (String)
- email (String, unique)
- password (String, hashed)
- name (String)
- createdAt (DateTime)
- updatedAt (DateTime)

### SugarSack
- id (String)
- sackNumber (String, unique)
- weight (Float)
- status (Enum: AVAILABLE, IN_USE, DAMAGED, DISPOSED)
- location (String, optional)
- notes (String, optional)
- createdAt (DateTime)
- updatedAt (DateTime)
- createdBy (String)
- updatedBy (String)

### SackCounter
- id (String)
- sackNumber (String)
- countedAt (DateTime)
- countedBy (String)
- location (String, optional)
- notes (String, optional)

## 🚀 Deployment

### Production Build
1. Build the application:
```bash
npm run build
```

2. Set production environment variables:
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_production_secret
```

3. Start the application:
```bash
npm run start:prod
```

### Using PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start dist/main.js --name "sugar-sack-backend"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify database credentials in `.env`
   - Ensure PostgreSQL is running
   - Check if database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `npx kill-port 3000`

3. **Prisma Client Generation**
   - Run `npx prisma generate` after schema changes
   - Restart development server

4. **Module Not Found**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

## 📞 Support
For issues and questions:
1. Check the troubleshooting section above
2. Review the NestJS documentation
3. Check Prisma documentation for database issues

## 📄 License
MIT License - See LICENSE file for details