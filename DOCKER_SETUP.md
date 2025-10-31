# Docker Setup for Sugar Sack Counter Backend

This document provides instructions for setting up and running PostgreSQL and MinIO services using Docker containers for the Sugar Sack Counter backend application.

## Architecture Overview

- **Backend Application**: Runs locally on your machine
- **PostgreSQL Database**: Runs in Docker container
- **MinIO Object Storage**: Runs in Docker container

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js 18+ installed locally for backend development

## Quick Start

### 1. Start Docker Services

```bash
# Start PostgreSQL and MinIO
./docker-help.sh start

# Or use docker-compose directly
docker-compose up -d
```

### 2. Configure Local Backend

Copy the development environment file:

```bash
cp .env.docker .env
```

### 3. Run Backend Locally

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### 4. Access Services

- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

## Services Overview

### PostgreSQL Database (`postgres