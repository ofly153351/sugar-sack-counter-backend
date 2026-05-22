-- Seed data for Sugar Sack Counter Backend
-- This file contains initial data for roles and users

-- Insert default roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'Administrator role with full access', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'user', 'Regular user role with basic access', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (id, role_id, username, password, email, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/zYZCIHSJ2', 'admin@sugarsack.com', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert sample users (password: password123)
INSERT INTO users (id, role_id, username, password, email, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'john_doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/zYZCIHSJ2', 'john.doe@example.com', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'operator1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/zYZCIHSJ2', 'operator1@example.com', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'viewer1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/zYZCIHSJ2', 'viewer1@example.com', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert user profiles for the sample users
INSERT INTO user_profiles (id, user_id, title, first_name, last_name, phone, position, employee_code, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Mr.', 'System', 'Administrator', '081-234-5678', 'System Admin', 'ADM001', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Mr.', 'John', 'Doe', '082-345-6789', 'Warehouse Staff', 'EMP001', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Ms.', 'Jane', 'Smith', '083-456-7890', 'Counting Operator', 'EMP002', NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'Mr.', 'Robert', 'Johnson', '084-567-8901', 'Quality Control', 'EMP003', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Insert vehicle types
INSERT INTO vehicle_types (id, name, description, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440000', 'รถบรรทุก 10 ล้อ', 'รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440001', 'รถบรรทุก 6 ล้อ', 'รถบรรทุกขนาดกลางสำหรับขนส่งน้ำตาล', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'รถบรรทุก 4 ล้อ', 'รถบรรทุกขนาดเล็กสำหรับขนส่งน้ำตาล', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'รถพ่วง', 'รถพ่วงสำหรับขนส่งน้ำตาลปริมาณมาก', NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440004', 'รถกระบะ', 'รถกระบะสำหรับขนส่งน้ำตาลปริมาณน้อย', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert vehicles
INSERT INTO vehicles (id, vehicle_code, license_plate, vehicle_type_id, driver_name, status, created_at, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440000', 'VH001', 'กข1234', '880e8400-e29b-41d4-a716-446655440000', 'สมชาย ใจดี', 'active', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440001', 'VH002', 'กข5678', '880e8400-e29b-41d4-a716-446655440000', 'สมหญิง สวยงาม', 'active', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440002', 'VH003', 'กข9012', '880e8400-e29b-41d4-a716-446655440001', 'ประยุทธ์ จันทร์โอชา', 'active', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440003', 'VH004', 'กข3456', '880e8400-e29b-41d4-a716-446655440001', 'ทักษิณ ชินวัตร', 'inactive', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440004', 'VH005', 'กข7890', '880e8400-e29b-41d4-a716-446655440002', 'ยิ่งลักษณ์ ชินวัตร', 'maintenance', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440005', 'VH006', 'กข2345', '880e8400-e29b-41d4-a716-446655440003', 'อภิสิทธิ์ เวชชาชีวะ', 'active', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440006', 'VH007', 'กข6789', '880e8400-e29b-41d4-a716-446655440004', 'สุรยุทธ์ จุลานนท์', 'active', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440007', 'VH008', 'กข0123', '880e8400-e29b-41d4-a716-446655440002', 'ชวน หลีกภัย', 'active', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440008', 'VH009', 'กข4567', '880e8400-e29b-41d4-a716-446655440000', 'บรรหาร ศิลปอาชา', 'inactive', NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440009', 'VH010', 'กข8901', '880e8400-e29b-41d4-a716-446655440001', 'อานันท์ ปันยารชุน', 'active', NOW(), NOW())
ON CONFLICT (vehicle_code) DO NOTHING;

-- Insert sugar types
INSERT INTO sugar_types (id, name, description, created_at, updated_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', 'น้ำตาลทรายขาว', 'น้ำตาลทรายขาวบริสุทธิ์', NOW(), NOW()),
('aa0e8400-e29b-41d4-a716-446655440001', 'น้ำตาลทรายแดง', 'น้ำตาลทรายแดงไม่ฟอกสี', NOW(), NOW()),
('aa0e8400-e29b-41d4-a716-446655440002', 'น้ำตาลทรายดิบ', 'น้ำตาลทรายดิบก่อนการฟอกสี', NOW(), NOW()),
('aa0e8400-e29b-41d4-a716-446655440003', 'น้ำตาลปี๊บ', 'น้ำตาลปี๊บสำหรับอุตสาหกรรม', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Note: All passwords are hashed using bcrypt with salt rounds 12
-- Default password for all users: "password123"
-- Admin user password: "admin123"
