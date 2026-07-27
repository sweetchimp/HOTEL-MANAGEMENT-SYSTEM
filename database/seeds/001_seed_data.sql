-- ============================================================
-- Seed Data: ALTONSHOTEL Management System
-- Description: Sample data for development and testing
-- ============================================================

-- Note: Run 001_create_tables.sql first before this script

-- ============================================================
-- SEED: Additional Room Types (if not already seeded)
-- ============================================================
-- Room types are created in 001_create_tables.sql

-- ============================================================
-- SEED: Sample Rooms
-- ============================================================

-- Floor 1 - Standard Rooms
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('101', 1, 1, 'AVAILABLE', 'Ground floor standard room, garden view');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('102', 1, 1, 'AVAILABLE', 'Ground floor standard room');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('103', 1, 1, 'MAINTENANCE', 'Ground floor standard room, under renovation');

-- Floor 2 - Standard Rooms
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('201', 1, 2, 'AVAILABLE', 'Second floor standard room');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('202', 1, 2, 'OCCUPIED', 'Second floor standard room');

-- Floor 3 - Deluxe Rooms
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('301', 2, 3, 'AVAILABLE', 'Deluxe room with city view');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('302', 2, 3, 'AVAILABLE', 'Deluxe room with balcony');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('303', 2, 3, 'RESERVED', 'Deluxe room, premium amenities');

-- Floor 4 - Deluxe Rooms
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('401', 2, 4, 'AVAILABLE', 'Deluxe room, corner unit');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('402', 2, 4, 'OCCUPIED', 'Deluxe room, recently renovated');

-- Floor 5 - Suites
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('501', 3, 5, 'AVAILABLE', 'Suite with separate living area');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('502', 3, 5, 'AVAILABLE', 'Suite with kitchenette');

-- Floor 6 - Suites & Presidential
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('601', 3, 6, 'AVAILABLE', 'Executive suite');
INSERT INTO ROOMS (ROOM_NUMBER, TYPE_ID, FLOOR, STATUS, DESCRIPTION) VALUES ('602', 4, 6, 'AVAILABLE', 'Presidential suite, panoramic views');

-- ============================================================
-- SEED: Sample Users (Password: 'admin123' - hashed)
-- ============================================================
-- Note: In production, passwords should be properly hashed
-- These are placeholder hashes for development only

INSERT INTO USERS (USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, ROLE_ID, IS_ACTIVE)
VALUES ('admin', 'admin123_hash', 'System Administrator', 'admin@altonshotel.com', 1, 1);

INSERT INTO USERS (USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, ROLE_ID, IS_ACTIVE)
VALUES ('reception1', 'reception123_hash', 'Jane Smith', 'jane.smith@altonshotel.com', 2, 1);

INSERT INTO USERS (USERNAME, PASSWORD_HASH, FULL_NAME, EMAIL, ROLE_ID, IS_ACTIVE)
VALUES ('manager1', 'manager123_hash', 'Robert Johnson', 'robert.j@altonshotel.com', 3, 1);

-- ============================================================
-- SEED: Sample Guests
-- ============================================================
INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER, ADDRESS, NATIONALITY)
VALUES ('John', 'Doe', 'john.doe@email.com', '+1-555-0101', 'PASSPORT', 'P12345678', '123 Main St, New York, NY', 'American');

INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER, ADDRESS, NATIONALITY)
VALUES ('Maria', 'Garcia', 'maria.g@email.com', '+34-612-345678', 'NATIONAL_ID', 'ES987654', '45 Calle Mayor, Madrid', 'Spanish');

INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER, ADDRESS, NATIONALITY)
VALUES ('Takeshi', 'Yamamoto', 'takeshi.y@email.com', '+81-90-1234-5678', 'PASSPORT', 'JP112233', '1-1 Shibuya, Tokyo', 'Japanese');

INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER, ADDRESS, NATIONALITY)
VALUES ('Sarah', 'Johnson', 'sarah.j@email.com', '+44-7700-900123', 'DRIVERS_LICENSE', 'UK445566', '10 Oxford St, London', 'British');

COMMIT;

-- ============================================================
-- Verification Query
-- ============================================================
-- SELECT 'ROOM_TYPES' as TAB, COUNT(*) as CNT FROM ROOM_TYPES
-- UNION ALL
-- SELECT 'ROOMS', COUNT(*) FROM ROOMS
-- UNION ALL
-- SELECT 'USERS', COUNT(*) FROM USERS
-- UNION ALL
-- SELECT 'GUESTS', COUNT(*) FROM GUESTS;
