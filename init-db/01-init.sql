-- Database initialization script for Sugar Sack Counter
-- This script runs when the PostgreSQL container is first created

-- Create database if it doesn't exist (PostgreSQL doesn't support CREATE DATABASE IF NOT EXISTS)
-- This is handled by the POSTGRES_DB environment variable in docker-compose

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional users/roles if needed
-- CREATE USER app_user WITH PASSWORD 'app_password';
-- GRANT CONNECT ON DATABASE sugar_sack_counter TO app_user;

-- Set up additional configurations
-- This ensures proper timezone handling
SET timezone = 'UTC';

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS app_schema;
-- GRANT USAGE ON SCHEMA app_schema TO app_user;

-- Note: The actual tables will be created by Prisma migrations
-- This script is for any additional database setup that's needed
