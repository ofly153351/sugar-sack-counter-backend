# Database Schema Documentation - Sugar Sack Counter System

## Overview

This document describes the complete database schema for the Sugar Sack Counter system, which manages vehicle tracking, sugar sack counting, box counting, and user management.

## Core Tables

### 1. User Management Tables

#### `roles`
Stores user role definitions
- `id` (UUID): Primary key
- `name` (VARCHAR): Role name (admin, user)
- `description` (TEXT): Role description
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

#### `users`
Core user authentication table
- `id` (UUID): Primary key
- `role_id` (UUID): Foreign key to roles
- `username` (VARCHAR): Unique username
- `password` (VARCHAR): Hashed password
- `email` (VARCHAR): Unique email
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

#### `user_profiles`
Extended user profile information
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to users
- `title` (VARCHAR): คำนำหน้า (Mr., Ms., etc.)
- `first_name` (VARCHAR): ชื่อ
- `last_name` (VARCHAR): นามสกุล
- `phone` (VARCHAR): เบอร์โทรศัพท์
- `position` (VARCHAR): ตำแหน่ง
- `employee_code` (VARCHAR): รหัสพนักงาน
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

### 2. Vehicle Management Tables

#### `vehicle_types`
Stores vehicle type definitions
- `id` (UUID): Primary key
- `name` (VARCHAR): Vehicle type name
- `description` (TEXT): Vehicle type description
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

#### `vehicles`
Stores vehicle information
- `id` (UUID): Primary key
- `vehicle_code` (VARCHAR): รหัสรถ (Auto)
- `license_plate` (VARCHAR): ทะเบียนรถ
- `vehicle_type_id` (UUID): Foreign key to vehicle_types
- `driver_name` (VARCHAR): คนขับรถ
- `status` (VARCHAR): สถานะ (active, inactive)
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

### 3. Sugar Type Management

#### `sugar_types`
Stores sugar type definitions
- `id` (UUID): Primary key
- `name` (VARCHAR): Sugar type name
- `description` (TEXT): Sugar type description
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

### 4. Sack Counting System

#### `sack_counting_sessions`
Main table for sack counting sessions
- `id` (UUID): Primary key
- `vehicle_id` (UUID): Foreign key to vehicles
- `sugar_type_id` (UUID): Foreign key to sugar_types
- `user_id` (UUID): ผู้บันทึก
- `total_sacks` (INTEGER): Total sacks counted
- `total_weight` (DECIMAL): น้ำหนักรวม
- `counting_date` (TIMESTAMP): วันที่เวลา
- `status` (VARCHAR): Session status (in_progress, completed, cancelled)
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

#### `sack_rows`
Individual rows within a sack counting session
- `id` (UUID): Primary key
- `session_id` (UUID): Foreign key to sack_counting_sessions
- `row_number` (INTEGER): แถวที่
- `weight_type` (VARCHAR): น้ำหนัก (25kg, 50kg)
- `ai_count` (INTEGER): จำนวนที่ AI นับได้
- `final_count` (INTEGER): จำนวนที่บันทึกจริง (หลังจากปรับเพิ่ม-ลด)
- `image_path` (TEXT): path ของภาพที่อัปโหลด
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

### 5. Box Counting System

#### `box_counting_sessions`
Main table for box counting sessions
- `id` (UUID): Primary key
- `vehicle_id` (UUID): Foreign key to vehicles
- `sugar_type_id` (UUID): Foreign key to sugar_types
- `user_id` (UUID): ผู้บันทึก
- `total_boxes` (INTEGER): Total boxes counted
- `counting_date` (TIMESTAMP): วันที่เวลา
- `status` (VARCHAR): Session status (in_progress, completed, cancelled)
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

#### `box_rows`
Individual rows within a box counting session
- `id` (UUID): Primary key
- `session_id` (UUID): Foreign key to box_counting_sessions
- `row_number` (INTEGER): แถวที่
- `ai_count` (INTEGER): จำนวนที่ AI นับได้
- `final_count` (INTEGER): จำนวนที่บันทึกจริง (หลังจากปรับเพิ่ม-ลด)
- `image_path` (TEXT): path ของภาพที่อัปโหลด
- `created_at`, `updated_at` (TIMESTAMP): Audit timestamps

## Indexes

The database includes comprehensive indexes for optimal performance:
- Username and email indexes for fast user lookup
- Vehicle code and license plate indexes
- Foreign key indexes for all relationships
- Date-based indexes for reporting

## Triggers

Automatic `updated_at` timestamp updates are handled by triggers on all tables.

## Default Data

### Roles
- `admin`: ผู้ดูแลระบบ
- `user`: ผู้ใช้งานทั่วไป

### Vehicle Types
- รถบรรทุก 6 ล้อ, รถบรรทุก 10 ล้อ, รถบรรทุก 18 ล้อ
- รถพ่วง, รถตู้

### Sugar Types
- น้ำตาลทรายขาว, น้ำตาลทรายแดง, น้ำตาลทรายดิบ
- น้ำตาลปี๊บ, น้ำตาลมะพร้าว

## Relationships

```
users (1) ←→ (1) user_profiles
users (N) ←→ (1) roles
vehicles (N) ←→ (1) vehicle_types
sack_counting_sessions (N) ←→ (1) vehicles
sack_counting_sessions (N) ←→ (1) sugar_types
sack_counting_sessions (N) ←→ (1) users
sack_rows (N) ←→ (1) sack_counting_sessions
box_counting_sessions (N) ←→ (1) vehicles
box_counting_sessions (N) ←→ (1) sugar_types
box_counting_sessions (N) ←→ (1) users
box_rows (N) ←→ (1) box_counting_sessions
```

## Business Logic

1. **User Registration**: Stores คำนำหน้า, ชื่อ, นามสกุล, เบอร์โทรศัพท์, อีเมล, รหัสผ่าน
2. **Vehicle Management**: Supports dropdown selection with search functionality
3. **Sack Counting**: Supports row-by-row counting with AI assistance and manual adjustment
4. **Box Counting**: Similar structure to sack counting but without weight types
5. **Admin Dashboard**: Provides data for จำนวนรถเข้า, จำนวนรถออก, จำนวนกระสอบที่ออก, จำนวนกล่องที่ออก