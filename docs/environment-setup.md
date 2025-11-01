# Environment Setup Guide - Sugar Sack Counter Backend

## Overview

This guide explains how to set up the environment variables for the Sugar Sack Counter backend application.

## Environment Files

The project uses the following environment files:

- `.env.dev` - Development environment with Aiven PostgreSQL
- `env.template` - Template for creating new environment files

## Required Environment Variables

### Database Configuration
```env
DATABASE_URL=postgres://username:password@host:port/database?sslmode=require
```

### Application Configuration
```env
PORT=3000
NODE_ENV=development
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### CORS Configuration
```env
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

### Logging
```env
LOG_LEVEL=debug
```

### API Configuration
```env
API_PREFIX=/api
API_VERSION=v1
```

### SSL Configuration
```env
PGSSLMODE=require
```

## Setup Instructions

### 1. Development Environment

The `.env.dev` file is already configured with the Aiven PostgreSQL connection:

```env
DATABASE_URL=postgres://avnadmin:AVNS_7irf3n2r-KzvFz0iCYi@sugar-counter-sugar-counter.h.aivencloud.com:10626/defaultdb?sslmode=require
```

### 2. Production Environment

Create a `.env` file for production:

```bash
cp env.template .env
```

Then update the values for production:
- Change `DATABASE_URL` to your production database
- Set `NODE_ENV=production`
- Use a strong, unique `JWT_SECRET`
- Update `CORS_ORIGIN` to your production domain

### 3. Loading Environment Variables

The application uses `@nestjs/config` to load environment variables. Make sure your environment file is loaded by:

```typescript
// In your main application module
ConfigModule.forRoot({
  envFilePath: '.env.dev', // or '.env' for production
});
```

## Aiven PostgreSQL Connection Details

- **Host**: sugar-counter-sugar-counter.h.aivencloud.com
- **Port**: 10626
- **Database**: defaultdb
- **Username**: avnadmin
- **SSL**: Required (sslmode=require)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** to version control
2. **Use different JWT secrets** for development and production
3. **Rotate database passwords** regularly
4. **Use environment-specific configurations**
5. **Keep SSL enabled** for database connections

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify the DATABASE_URL format
   - Check if SSL is required
   - Ensure the database is accessible from your IP

2. **JWT Errors**
   - Verify JWT_SECRET is set
   - Check JWT_EXPIRES_IN format

3. **CORS Issues**
   - Update CORS_ORIGIN to match your frontend URL
   - Ensure the protocol (http/https) matches

### Verification

To verify your environment setup:

```bash
# Check if environment variables are loaded
npm run start:dev

# Test database connection
npm run typeorm migration:run
```

## Next Steps

After setting up the environment:

1. Run database migrations
2. Start the development server
3. Test API endpoints
4. Set up your frontend application