-- Create tables for Sugar Sack Counter application
-- This script creates the complete database schema using gen_random_uuid() (PostgreSQL 13+)

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(20) NOT NULL, -- คำนำหน้า (Mr., Ms., etc.)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100), -- ตำแหน่ง
    employee_code VARCHAR(50) UNIQUE, -- รหัสพนักงาน
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_code VARCHAR(50) UNIQUE NOT NULL, -- รหัสรถ (Auto)
    license_plate VARCHAR(20) UNIQUE NOT NULL, -- ทะเบียนรถ
    vehicle_type_id UUID NOT NULL,
    driver_name VARCHAR(200) NOT NULL, -- คนขับรถ
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')), -- สถานะ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicles_vehicle_type_id FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id)
);

-- Create sugar_types table
CREATE TABLE IF NOT EXISTS sugar_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sack_counting_sessions table
CREATE TABLE IF NOT EXISTS sack_counting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    sugar_type_id UUID NOT NULL,
    user_id UUID NOT NULL, -- ผู้บันทึก
    total_sacks INTEGER DEFAULT 0,
    total_weight DECIMAL(10,2) DEFAULT 0, -- น้ำหนักรวม
    counting_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sack_sessions_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_sack_sessions_sugar_type_id FOREIGN KEY (sugar_type_id) REFERENCES sugar_types(id),
    CONSTRAINT fk_sack_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create sack_rows table (แถวในการนับ)
CREATE TABLE IF NOT EXISTS sack_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    row_number INTEGER NOT NULL, -- แถวที่
    weight_type VARCHAR(10) NOT NULL CHECK (weight_type IN ('25kg', '50kg')), -- น้ำหนัก 25kg หรือ 50kg
    ai_count INTEGER, -- จำนวนที่ AI นับได้
    final_count INTEGER NOT NULL, -- จำนวนที่บันทึกจริง (หลังจากปรับเพิ่ม-ลด)
    image_path TEXT, -- path ของภาพที่อัปโหลด
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sack_rows_session_id FOREIGN KEY (session_id) REFERENCES sack_counting_sessions(id) ON DELETE CASCADE
);

-- Create box_counting_sessions table
CREATE TABLE IF NOT EXISTS box_counting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    sugar_type_id UUID NOT NULL,
    user_id UUID NOT NULL, -- ผู้บันทึก
    total_boxes INTEGER DEFAULT 0,
    counting_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_box_sessions_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_box_sessions_sugar_type_id FOREIGN KEY (sugar_type_id) REFERENCES sugar_types(id),
    CONSTRAINT fk_box_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create box_rows table (แถวในการนับกล่อง)
CREATE TABLE IF NOT EXISTS box_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    row_number INTEGER NOT NULL, -- แถวที่
    ai_count INTEGER, -- จำนวนที่ AI นับได้
    final_count INTEGER NOT NULL, -- จำนวนที่บันทึกจริง (หลังจากปรับเพิ่ม-ลด)
    image_path TEXT, -- path ของภาพที่อัปโหลด
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_box_rows_session_id FOREIGN KEY (session_id) REFERENCES box_counting_sessions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_code ON user_profiles(employee_code);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_code ON vehicles(vehicle_code);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON vehicles(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_sugar_types_name ON sugar_types(name);
CREATE INDEX IF NOT EXISTS idx_sack_sessions_vehicle_id ON sack_counting_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sack_sessions_sugar_type_id ON sack_counting_sessions(sugar_type_id);
CREATE INDEX IF NOT EXISTS idx_sack_sessions_user_id ON sack_counting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sack_sessions_counting_date ON sack_counting_sessions(counting_date);
CREATE INDEX IF NOT EXISTS idx_sack_rows_session_id ON sack_rows(session_id);
CREATE INDEX IF NOT EXISTS idx_box_sessions_vehicle_id ON box_counting_sessions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_box_sessions_sugar_type_id ON box_counting_sessions(sugar_type_id);
CREATE INDEX IF NOT EXISTS idx_box_sessions_user_id ON box_counting_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_box_sessions_counting_date ON box_counting_sessions(counting_date);
CREATE INDEX IF NOT EXISTS idx_box_rows_session_id ON box_rows(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_types_updated_at ON vehicle_types;
CREATE TRIGGER update_vehicle_types_updated_at
    BEFORE UPDATE ON vehicle_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sugar_types_updated_at ON sugar_types;
CREATE TRIGGER update_sugar_types_updated_at
    BEFORE UPDATE ON sugar_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sack_counting_sessions_updated_at ON sack_counting_sessions;
CREATE TRIGGER update_sack_counting_sessions_updated_at
    BEFORE UPDATE ON sack_counting_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sack_rows_updated_at ON sack_rows;
CREATE TRIGGER update_sack_rows_updated_at
    BEFORE UPDATE ON sack_rows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_box_counting_sessions_updated_at ON box_counting_sessions;
CREATE TRIGGER update_box_counting_sessions_updated_at
    BEFORE UPDATE ON box_counting_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_box_rows_updated_at ON box_rows;
CREATE TRIGGER update_box_rows_updated_at
    BEFORE UPDATE ON box_rows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO roles (name, description) VALUES
('admin', 'ผู้ดูแลระบบ'),
('user', 'ผู้ใช้งานทั่วไป')
ON CONFLICT (name) DO NOTHING;

-- Insert default vehicle types
INSERT INTO vehicle_types (name, description) VALUES
('รถบรรทุก 6 ล้อ', 'รถบรรทุกขนาด 6 ล้อ'),
('รถบรรทุก 10 ล้อ', 'รถบรรทุกขนาด 10 ล้อ'),
('รถบรรทุก 18 ล้อ', 'รถบรรทุกขนาด 18 ล้อ'),
('รถพ่วง', 'รถพ่วงขนส่ง'),
('รถตู้', 'รถตู้ขนส่ง')
ON CONFLICT (name) DO NOTHING;

-- Insert default sugar types
INSERT INTO sugar_types (name, description) VALUES
('น้ำตาลทรายขาว', 'น้ำตาลทรายขาวบริสุทธิ์'),
('น้ำตาลทรายแดง', 'น้ำตาลทรายแดง'),
('น้ำตาลทรายดิบ', 'น้ำตาลทรายดิบ'),
('น้ำตาลปี๊บ', 'น้ำตาลปี๊บ'),
('น้ำตาลมะพร้าว', 'น้ำตาลมะพร้าว')
ON CONFLICT (name) DO NOTHING;
