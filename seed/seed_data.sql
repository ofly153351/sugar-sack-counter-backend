-- Seed data for Sugar Sack Counter Backend
-- This file contains initial data for roles and users

-- Insert default roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'Administrator role with full access', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'user', 'Regular user role with basic access', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'operator', 'Operator role for counting operations', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'viewer', 'View-only role for monitoring', NOW(), NOW())
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

-- Note: All passwords are hashed using bcrypt with salt rounds 12
-- Default password for all users: "password123"
-- Admin user password: "admin123"
