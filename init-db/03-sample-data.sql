-- Sample data for Sugar Sack Counter application
-- This script inserts sample data for testing

-- Insert sample vehicle types (additional to defaults)
INSERT INTO vehicle_types (name, description) VALUES
('รถกระบะ', 'รถกระบะขนส่ง'),
('รถตู้แคป', 'รถตู้แคปสำหรับขนส่งสินค้า')
ON CONFLICT (name) DO NOTHING;

-- Insert sample vehicles
INSERT INTO vehicles (vehicle_code, license_plate, vehicle_type_id, driver_name, status) VALUES
('V001', 'กข1234', (SELECT id FROM vehicle_types WHERE name = 'รถบรรทุก 6 ล้อ'), 'สมชาย ใจดี', 'active'),
('V002', 'กข5678', (SELECT id FROM vehicle_types WHERE name = 'รถบรรทุก 10 ล้อ'), 'สมหมาย กล้าหาญ', 'active'),
('V003', 'กข9012', (SELECT id FROM vehicle_types WHERE name = 'รถบรรทุก 18 ล้อ'), 'สมศรี สวยงาม', 'active'),
('V004', 'กข3456', (SELECT id FROM vehicle_types WHERE name = 'รถพ่วง'), 'สมปอง ตั้งใจ', 'inactive'),
('V005', 'กข7890', (SELECT id FROM vehicle_types WHERE name = 'รถตู้'), 'สมพร มีสุข', 'active')
ON CONFLICT (license_plate) DO NOTHING;

-- Insert sample sugar types (additional to defaults)
INSERT INTO sugar_types (name, description) VALUES
('น้ำตาลทรายขาวพิเศษ', 'น้ำตาลทรายขาวพิเศษคุณภาพสูง'),
('น้ำตาลทรายแดงพิเศษ', 'น้ำตาลทรายแดงพิเศษคุณภาพสูง')
ON CONFLICT (name) DO NOTHING;

-- Insert sample admin user
INSERT INTO users (role_id, username, password, email) VALUES
((SELECT id FROM roles WHERE name = 'admin'), 'admin', '$2b$10$examplehashedpassword', 'admin@sugarcounter.com')
ON CONFLICT (username) DO NOTHING;

-- Insert sample regular users
INSERT INTO users (role_id, username, password, email) VALUES
((SELECT id FROM roles WHERE name = 'user'), 'user1', '$2b$10$examplehashedpassword1', 'user1@sugarcounter.com'),
((SELECT id FROM roles WHERE name = 'user'), 'user2', '$2b$10$examplehashedpassword2', 'user2@sugarcounter.com'),
((SELECT id FROM roles WHERE name = 'user'), 'user3', '$2b$10$examplehashedpassword3', 'user3@sugarcounter.com')
ON CONFLICT (username) DO NOTHING;

-- Insert sample user profiles
INSERT INTO user_profiles (user_id, title, first_name, last_name, phone, position, employee_code) VALUES
((SELECT id FROM users WHERE username = 'admin'), 'นาย', 'ธนากร', 'ศรีสุข', '0812345678', 'ผู้ดูแลระบบ', 'EMP001'),
((SELECT id FROM users WHERE username = 'user1'), 'นาง', 'สุภาพร', 'ใจดี', '0823456789', 'พนักงานนับกระสอบ', 'EMP002'),
((SELECT id FROM users WHERE username = 'user2'), 'นาย', 'อนุชา', 'กล้าหาญ', '0834567890', 'พนักงานนับกล่อง', 'EMP003'),
((SELECT id FROM users WHERE username = 'user3'), 'นางสาว', 'กนกวรรณ', 'สวยงาม', '0845678901', 'พนักงานทั่วไป', 'EMP004')
ON CONFLICT (employee_code) DO NOTHING;

-- Insert sample sack counting sessions
INSERT INTO sack_counting_sessions (vehicle_id, sugar_type_id, user_id, total_sacks, total_weight, counting_date) VALUES
((SELECT id FROM vehicles WHERE license_plate = 'กข1234'), (SELECT id FROM sugar_types WHERE name = 'น้ำตาลทรายขาว'), (SELECT id FROM users WHERE username = 'user1'), 150, 3750.00, '2024-01-15 08:30:00'),
((SELECT id FROM vehicles WHERE license_plate = 'กข5678'), (SELECT id FROM sugar_types WHERE name = 'น้ำตาลทรายแดง'), (SELECT id FROM users WHERE username = 'user1'), 200, 5000.00, '2024-01-15 10:15:00'),
((SELECT id FROM vehicles WHERE license_plate = 'กข9012'), (SELECT id FROM sugar_types WHERE name = 'น้ำตาลทรายดิบ'), (SELECT id FROM users WHERE username = 'user2'), 180, 4500.00, '2024-01-16 09:00:00')
ON CONFLICT DO NOTHING;

-- Insert sample sack rows for first session
INSERT INTO sack_rows (session_id, row_number, weight_type, ai_count, final_count, image_path) VALUES
((SELECT id FROM sack_counting_sessions WHERE counting_date = '2024-01-15 08:30:00'), 1, '50kg', 50, 50, '/images/sack_session_1_row_1.jpg'),
((SELECT id FROM sack_counting_sessions WHERE counting_date = '2024-01-15 08:30:00'), 2, '50kg', 48, 50, '/images/sack_session_1_row_2.jpg'),
((SELECT id FROM sack_counting_sessions WHERE counting_date = '2024-01-15 08:30:00'), 3, '25kg', 50, 50, '/images/sack_session_1_row_3.jpg')
ON CONFLICT DO NOTHING;

-- Insert sample sack rows for second session
INSERT INTO sack_rows (session_id, row_number, weight_type, ai_count, final_count, image_path) VALUES
((SELECT id FROM sack_counting_sessions WHERE counting_date = '2024-01-15 10:15:00'), 1, '50kg', 100, 100, '/images/sack_session_2_row_1.jpg'),
((SELECT id FROM sack_counting_sessions WHERE counting_date = '2024-01-15 10:15:00'), 2, '50kg', 98, 100, '/images/sack_session_2_row_2.jpg')
ON CONFLICT DO NOTHING;

-- Insert sample box counting sessions
INSERT INTO box_counting_sessions (vehicle_id, sugar_type_id, user_id, total_boxes, counting_date) VALUES
((SELECT id FROM vehicles WHERE license_plate = 'กข1234'), (SELECT id FROM sugar_types WHERE name = 'น้ำตาลทรายขาว'), (SELECT id FROM users WHERE username = 'user3'), 75, '2024-01-15 14:30:00'),
((SELECT id FROM vehicles WHERE license_plate = 'กข5678'), (SELECT id FROM sugar_types WHERE name = 'น้ำตาลทรายแดง'), (SELECT id FROM users WHERE username = 'user2'), 120, '2024-01-16 11:00:00')
ON CONFLICT DO NOTHING;

-- Insert sample box rows for first session
INSERT INTO box_rows (session_id, row_number, ai_count, final_count, image_path) VALUES
((SELECT id FROM box_counting_sessions WHERE counting_date = '2024-01-15 14:30:00'), 1, 25, 25, '/images/box_session_1_row_1.jpg'),
((SELECT id FROM box_counting_sessions WHERE counting_date = '2024-01-15 14:30:00'), 2, 24, 25, '/images/box_session_1_row_2.jpg'),
((SELECT id FROM box_counting_sessions WHERE counting_date = '2024-01-15 14:30:00'), 3, 25, 25, '/images/box_session_1_row_3.jpg')
ON CONFLICT DO NOTHING;

-- Insert sample box rows for second session
INSERT INTO box_rows (session_id, row_number, ai_count, final_count, image_path) VALUES
((SELECT id FROM box_counting_sessions WHERE counting_date = '2024-01-16 11:00:00'), 1, 40, 40, '/images/box_session_2_row_1.jpg'),
((SELECT id FROM box_counting_sessions WHERE counting_date = '2024-01-16 11:00:00'), 2, 38, 40, '/images/box_session_2_row_2.jpg'),
((SELECT id FROM box_counting_sessions WHERE counting_date = '2024-01-16 11:00:00'), 3, 40, 40, '/images/box_session_2_row_3.jpg')
ON CONFLICT DO NOTHING;

-- Update total counts in sessions based on rows
UPDATE sack_counting_sessions
SET total_sacks = (
    SELECT SUM(final_count)
    FROM sack_rows
    WHERE session_id = sack_counting_sessions.id
),
total_weight = (
    SELECT SUM(
        CASE
            WHEN weight_type = '25kg' THEN final_count * 25
            WHEN weight_type = '50kg' THEN final_count * 50
        END
    )
    FROM sack_rows
    WHERE session_id = sack_counting_sessions.id
)
WHERE id IN (
    SELECT id FROM sack_counting_sessions
    WHERE counting_date IN ('2024-01-15 08:30:00', '2024-01-15 10:15:00', '2024-01-16 09:00:00')
);

UPDATE box_counting_sessions
SET total_boxes = (
    SELECT SUM(final_count)
    FROM box_rows
    WHERE session_id = box_counting_sessions.id
)
WHERE id IN (
    SELECT id FROM box_counting_sessions
    WHERE counting_date IN ('2024-01-15 14:30:00', '2024-01-16 11:00:00')
);
