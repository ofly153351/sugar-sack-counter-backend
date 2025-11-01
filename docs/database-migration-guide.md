# Database Migration Guide - Sugar Sack Counter

## Overview

This guide explains multiple methods to migrate the database schema to Aiven PostgreSQL.

## Method 1: Using Navicat (Easiest)

### Steps:
1. **Connect to Aiven PostgreSQL** in Navicat
2. **Open SQL Editor**: Tools → SQL Editor
3. **Load SQL File**: File → Open → Select `init-db/02-create-tables.sql`
4. **Execute Script**: Click the "Execute" button (▶️)
5. **Verify**: Check if tables appear in the left panel

### Advantages:
- Visual interface
- Easy to debug errors
- Can execute partial scripts

## Method 2: Using Command Line (psql)

### Prerequisites:
- Install PostgreSQL client tools
- Ensure `psql` is in your PATH

### Steps:
```bash
# Method 2A: Using environment variable
psql $DATABASE_URL -f init-db/02-create-tables.sql

# Method 2B: Direct connection string
psql "postgres://avnadmin:AVNS_7irf3n2r-KzvFz0iCYi@sugar-counter-sugar-counter.h.aivencloud.com:10626/defaultdb?sslmode=require" -f init-db/02-create-tables.sql

# Method 2C: With SSL verification
psql "postgres://avnadmin:AVNS_7irf3n2r-KzvFz0iCYi@sugar-counter-sugar-counter.h.aivencloud.com:10626/defaultdb" -f init-db/02-create-tables.sql
```

### For Windows:
```cmd
# If using Command Prompt
psql %DATABASE_URL% -f init-db\02-create-tables.sql

# If using PowerShell
psql $env:DATABASE_URL -f init-db\02-create-tables.sql
```

## Method 3: Using Prisma (Modern Approach)

### Prerequisites:
- Node.js and npm installed
- Prisma CLI installed: `npm install -g prisma`

### Steps:
```bash
# 1. Install dependencies
npm install @prisma/client prisma

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. (Optional) Seed initial data
npx prisma db seed
```

### Prisma Commands:
```bash
# View current database state
npx prisma db pull

# Create migration files
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Method 4: Using Aiven Console

### Steps:
1. **Login to Aiven Console**: https://console.aiven.io/
2. **Select your project** and PostgreSQL service
3. **Go to "Service overview"**
4. **Click "Open in web console"**
5. **Paste SQL script** and execute

## Method 5: Using pgAdmin

### Steps:
1. **Install pgAdmin** (if not already installed)
2. **Add new server** with Aiven connection details
3. **Connect to database**
4. **Open Query Tool**
5. **Load and execute** the SQL file

## Verification Steps

After migration, verify the setup:

### Check Tables:
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check table structures
\d+ roles;
\d+ users;
\d+ user_profiles;
```

### Check Default Data:
```sql
-- Verify roles
SELECT * FROM roles;

-- Verify vehicle types  
SELECT * FROM vehicle_types;

-- Verify sugar types
SELECT * FROM sugar_types;
```

## Troubleshooting

### Common Issues:

1. **SSL Connection Error**
   - Ensure `sslmode=require` in connection string
   - Download and use CA certificate if required

2. **Permission Denied**
   - Verify username and password
   - Check if user has CREATE TABLE privileges

3. **Table Already Exists**
   - Use `CREATE TABLE IF NOT EXISTS` in SQL
   - Or drop existing tables first

4. **UUID Extension Missing**
   - Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Error Solutions:

```sql
-- If UUID functions missing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- If you need to start fresh (DANGEROUS - development only)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

## Sample Verification Queries

```sql
-- Count records in each table
SELECT 'roles' as table_name, COUNT(*) as record_count FROM roles
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL  
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'vehicle_types', COUNT(*) FROM vehicle_types
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'sugar_types', COUNT(*) FROM sugar_types;
```

## Recommended Approach

For this project, we recommend:

1. **Development**: Use Method 1 (Navicat) for quick setup
2. **Production**: Use Method 3 (Prisma) for proper migration management
3. **CI/CD**: Use Method 2 (Command line) for automation

## Next Steps

After successful migration:

1. Run the sample data script: `init-db/03-sample-data.sql`
2. Start the backend server: `npm run start:dev`
3. Test API endpoints using Swagger: `http://localhost:3000/api`
4. Verify database connections in the application

## Security Notes

- Never commit actual database credentials to version control
- Use environment variables for sensitive information
- Rotate passwords regularly
- Enable SSL for all database connections