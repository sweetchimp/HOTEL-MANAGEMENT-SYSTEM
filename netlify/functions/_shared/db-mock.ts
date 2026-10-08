// ============================================================
// Mock Database Layer
// Description: In-memory mock for local development without Oracle
// Activated when DB_MODE=mock
// ============================================================

import bcrypt from 'bcryptjs'
const { hashSync } = bcrypt

// --- Mock Data ---
const now = new Date().toISOString()

const USERS = [
  { USER_ID: 1, USERNAME: 'admin', PASSWORD_HASH: hashSync('Admin123!', 10), FULL_NAME: 'System Administrator', EMAIL: 'admin@altonshotel.com', ROLE_ID: 1, IS_ACTIVE: 1, FAILED_LOGIN_ATTEMPTS: 0, LAST_LOGIN: null, CREATED_AT: now, UPDATED_AT: now },
  { USER_ID: 2, USERNAME: 'reception1', PASSWORD_HASH: hashSync('Admin123!', 10), FULL_NAME: 'Jane Smith', EMAIL: 'jane.smith@altonshotel.com', ROLE_ID: 2, IS_ACTIVE: 1, FAILED_LOGIN_ATTEMPTS: 0, LAST_LOGIN: null, CREATED_AT: now, UPDATED_AT: now },
  { USER_ID: 3, USERNAME: 'manager1', PASSWORD_HASH: hashSync('Admin123!', 10), FULL_NAME: 'Robert Johnson', EMAIL: 'robert.j@altonshotel.com', ROLE_ID: 3, IS_ACTIVE: 1, FAILED_LOGIN_ATTEMPTS: 0, LAST_LOGIN: null, CREATED_AT: now, UPDATED_AT: now },
]

const ROLES = [
  { ROLE_ID: 1, ROLE_NAME: 'ADMIN', DESCRIPTION: 'Full system access' },
  { ROLE_ID: 2, ROLE_NAME: 'RECEPTIONIST', DESCRIPTION: 'Front desk operations' },
  { ROLE_ID: 3, ROLE_NAME: 'MANAGER', DESCRIPTION: 'Reports and oversight' },
]

const ROOM_TYPES = [
  { TYPE_ID: 1, TYPE_NAME: 'Standard', DESCRIPTION: 'Standard single room with basic amenities', BASE_PRICE: 80, MAX_OCCUPANCY: 2 },
  { TYPE_ID: 2, TYPE_NAME: 'Deluxe', DESCRIPTION: 'Spacious room with premium amenities', BASE_PRICE: 150, MAX_OCCUPANCY: 2 },
  { TYPE_ID: 3, TYPE_NAME: 'Suite', DESCRIPTION: 'Luxury suite with separate living area', BASE_PRICE: 250, MAX_OCCUPANCY: 4 },
  { TYPE_ID: 4, TYPE_NAME: 'Presidential', DESCRIPTION: 'Top-floor suite with panoramic views', BASE_PRICE: 500, MAX_OCCUPANCY: 4 },
]

let ROOMS = [
  { ROOM_ID: 1, ROOM_NUMBER: '101', TYPE_ID: 1, FLOOR: 1, STATUS: 'AVAILABLE', DESCRIPTION: 'Ground floor standard room, garden view' },
  { ROOM_ID: 2, ROOM_NUMBER: '102', TYPE_ID: 1, FLOOR: 1, STATUS: 'AVAILABLE', DESCRIPTION: 'Ground floor standard room' },
  { ROOM_ID: 3, ROOM_NUMBER: '103', TYPE_ID: 1, FLOOR: 1, STATUS: 'MAINTENANCE', DESCRIPTION: 'Under renovation' },
  { ROOM_ID: 4, ROOM_NUMBER: '201', TYPE_ID: 1, FLOOR: 2, STATUS: 'AVAILABLE', DESCRIPTION: 'Second floor standard room' },
  { ROOM_ID: 5, ROOM_NUMBER: '202', TYPE_ID: 1, FLOOR: 2, STATUS: 'AVAILABLE', DESCRIPTION: 'Second floor corner room' },
  { ROOM_ID: 6, ROOM_NUMBER: '301', TYPE_ID: 2, FLOOR: 3, STATUS: 'AVAILABLE', DESCRIPTION: 'Deluxe room with city view' },
  { ROOM_ID: 7, ROOM_NUMBER: '302', TYPE_ID: 2, FLOOR: 3, STATUS: 'AVAILABLE', DESCRIPTION: 'Deluxe room with balcony' },
  { ROOM_ID: 8, ROOM_NUMBER: '303', TYPE_ID: 2, FLOOR: 3, STATUS: 'AVAILABLE', DESCRIPTION: 'Deluxe room, premium amenities' },
  { ROOM_ID: 9, ROOM_NUMBER: '401', TYPE_ID: 2, FLOOR: 4, STATUS: 'AVAILABLE', DESCRIPTION: 'Deluxe corner unit' },
  { ROOM_ID: 10, ROOM_NUMBER: '402', TYPE_ID: 2, FLOOR: 4, STATUS: 'AVAILABLE', DESCRIPTION: 'Deluxe recently renovated' },
  { ROOM_ID: 11, ROOM_NUMBER: '501', TYPE_ID: 3, FLOOR: 5, STATUS: 'AVAILABLE', DESCRIPTION: 'Suite with living area' },
  { ROOM_ID: 12, ROOM_NUMBER: '502', TYPE_ID: 3, FLOOR: 5, STATUS: 'AVAILABLE', DESCRIPTION: 'Suite with kitchenette' },
  { ROOM_ID: 13, ROOM_NUMBER: '601', TYPE_ID: 3, FLOOR: 6, STATUS: 'AVAILABLE', DESCRIPTION: 'Executive suite' },
  { ROOM_ID: 14, ROOM_NUMBER: '602', TYPE_ID: 4, FLOOR: 6, STATUS: 'AVAILABLE', DESCRIPTION: 'Presidential suite' },
]

let GUESTS = [
  { GUEST_ID: 1, FIRST_NAME: 'John', LAST_NAME: 'Doe', EMAIL: 'john.doe@email.com', PHONE: '+1-555-0101', ID_TYPE: 'PASSPORT', ID_NUMBER: 'P12345678', ADDRESS: '123 Main St, New York, NY', NATIONALITY: 'American', CREATED_AT: now, UPDATED_AT: now },
  { GUEST_ID: 2, FIRST_NAME: 'Maria', LAST_NAME: 'Garcia', EMAIL: 'maria.g@email.com', PHONE: '+34-612-345678', ID_TYPE: 'NATIONAL_ID', ID_NUMBER: 'ES987654', ADDRESS: '45 Calle Mayor, Madrid', NATIONALITY: 'Spanish', CREATED_AT: now, UPDATED_AT: now },
  { GUEST_ID: 3, FIRST_NAME: 'Takeshi', LAST_NAME: 'Yamamoto', EMAIL: 'takeshi.y@email.com', PHONE: '+81-90-1234-5678', ID_TYPE: 'PASSPORT', ID_NUMBER: 'JP112233', ADDRESS: '1-1 Shibuya, Tokyo', NATIONALITY: 'Japanese', CREATED_AT: now, UPDATED_AT: now },
  { GUEST_ID: 4, FIRST_NAME: 'Sarah', LAST_NAME: 'Johnson', EMAIL: 'sarah.j@email.com', PHONE: '+44-7700-900123', ID_TYPE: 'DRIVERS_LICENSE', ID_NUMBER: 'UK445566', ADDRESS: '10 Oxford St, London', NATIONALITY: 'British', CREATED_AT: now, UPDATED_AT: now },
]

let nextId = 100
function genId() { return nextId++ }

let RESERVATIONS = [
  { RESERVATION_ID: 1, GUEST_ID: 1, ROOM_TYPE_ID: 1, CHECK_IN_DATE: '2026-07-22', CHECK_OUT_DATE: '2026-07-25', STATUS: 'COMPLETED', SPECIAL_REQUESTS: 'Non-smoking', CREATED_BY: 2, CREATED_AT: now, UPDATED_AT: now },
  { RESERVATION_ID: 2, GUEST_ID: 2, ROOM_TYPE_ID: 2, CHECK_IN_DATE: '2026-07-26', CHECK_OUT_DATE: '2026-07-29', STATUS: 'CHECKED_IN', SPECIAL_REQUESTS: 'Late checkout', CREATED_BY: 2, CREATED_AT: now, UPDATED_AT: now },
  { RESERVATION_ID: 3, GUEST_ID: 3, ROOM_TYPE_ID: 3, CHECK_IN_DATE: '2026-07-30', CHECK_OUT_DATE: '2026-08-03', STATUS: 'CONFIRMED', SPECIAL_REQUESTS: 'Extra pillows', CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
]

let BOOKINGS = [
  { BOOKING_ID: 1, RESERVATION_ID: 1, ROOM_ID: 4, CHECK_IN_DATE: '2026-07-22', CHECK_OUT_DATE: '2026-07-25', RATE_PER_NIGHT: 80, STATUS: 'COMPLETED', CREATED_AT: now },
  { BOOKING_ID: 2, RESERVATION_ID: 2, ROOM_ID: 6, CHECK_IN_DATE: '2026-07-26', CHECK_OUT_DATE: '2026-07-29', RATE_PER_NIGHT: 150, STATUS: 'ACTIVE', CREATED_AT: now },
]

let CHECKINS = [
  { CHECKIN_ID: 1, BOOKING_ID: 1, ACTUAL_CHECK_IN: '2026-07-22T14:00:00', CHECKED_IN_BY: 2, NOTES: 'Passport verified' },
  { CHECKIN_ID: 2, BOOKING_ID: 2, ACTUAL_CHECK_IN: '2026-07-26T15:30:00', CHECKED_IN_BY: 2, NOTES: 'Early check-in' },
]

let CHECKOUTS = [
  { CHECKOUT_ID: 1, CHECKIN_ID: 1, ACTUAL_CHECK_OUT: '2026-07-25T11:00:00', CHECKED_OUT_BY: 2, NOTES: 'Paid in full' },
]

let INVOICES = [
  { INVOICE_ID: 1, BOOKING_ID: 1, GUEST_ID: 1, TOTAL_AMOUNT: 290, STATUS: 'PAID', CREATED_AT: now, UPDATED_AT: now },
  { INVOICE_ID: 2, BOOKING_ID: 2, GUEST_ID: 2, TOTAL_AMOUNT: 450, STATUS: 'PARTIALLY_PAID', CREATED_AT: now, UPDATED_AT: now },
]

let INVOICE_ITEMS = [
  { ITEM_ID: 1, INVOICE_ID: 1, DESCRIPTION: 'Room 201 - Standard (3 nights)', QUANTITY: 1, UNIT_PRICE: 240, TOTAL: 240 },
  { ITEM_ID: 2, INVOICE_ID: 1, DESCRIPTION: 'Minibar charges', QUANTITY: 2, UNIT_PRICE: 25, TOTAL: 50 },
  { ITEM_ID: 3, INVOICE_ID: 2, DESCRIPTION: 'Room 301 - Deluxe (3 nights)', QUANTITY: 1, UNIT_PRICE: 450, TOTAL: 450 },
]

let PAYMENTS = [
  { PAYMENT_ID: 1, INVOICE_ID: 1, AMOUNT: 290, PAYMENT_METHOD: 'CARD', PAYMENT_DATE: '2026-07-25T11:00:00', REFERENCE_NUMBER: 'TXN-2026-001', RECEIVED_BY: 2 },
  { PAYMENT_ID: 2, INVOICE_ID: 2, AMOUNT: 200, PAYMENT_METHOD: 'CASH', PAYMENT_DATE: '2026-07-26T15:30:00', REFERENCE_NUMBER: 'CASH-2026-001', RECEIVED_BY: 2 },
]

let MAINTENANCE = [
  { ID: 1, ROOM_ID: 3, ISSUE_TYPE: 'PLUMBING', DESCRIPTION: 'Leaking faucet in bathroom sink', STATUS: 'OPEN', CREATED_DATE: '2026-07-27T09:00:00', ASSIGNED_TO: 'Mike Plumber', RESOLVED_DATE: null, NOTES: '' },
  { ID: 2, ROOM_ID: 11, ISSUE_TYPE: 'ELECTRICAL', DESCRIPTION: 'Light fixture not working in bedroom', STATUS: 'IN_PROGRESS', CREATED_DATE: '2026-07-28T10:30:00', ASSIGNED_TO: 'Jane Electrician', RESOLVED_DATE: null, NOTES: '' },
  { ID: 3, ROOM_ID: 7, ISSUE_TYPE: 'HVAC', DESCRIPTION: 'AC unit making strange noise', STATUS: 'OPEN', CREATED_DATE: '2026-07-28T14:15:00', ASSIGNED_TO: 'Bob HVAC', RESOLVED_DATE: null, NOTES: '' },
]

let STAFF = [
  { ID: 1, FULL_NAME: 'Alice Manager', EMAIL: 'alice@altonshotel.com', PHONE: '+1-555-0201', DEPARTMENT: 'Management', POSITION: 'Front Desk Manager', SALARY: 45000, HIRE_DATE: '2025-01-15', IS_ACTIVE: 1 },
  { ID: 2, FULL_NAME: 'Bob Receptionist', EMAIL: 'bob@altonshotel.com', PHONE: '+1-555-0202', DEPARTMENT: 'Front Desk', POSITION: 'Receptionist', SALARY: 32000, HIRE_DATE: '2025-03-01', IS_ACTIVE: 1 },
  { ID: 3, FULL_NAME: 'Carol Housekeeper', EMAIL: 'carol@altonshotel.com', PHONE: '+1-555-0203', DEPARTMENT: 'Housekeeping', POSITION: 'Housekeeper', SALARY: 28000, HIRE_DATE: '2025-02-10', IS_ACTIVE: 1 },
  { ID: 4, FULL_NAME: 'Dave Maintenance', EMAIL: 'dave@altonshotel.com', PHONE: '+1-555-0204', DEPARTMENT: 'Maintenance', POSITION: 'Maintenance Technician', SALARY: 30000, HIRE_DATE: '2025-04-20', IS_ACTIVE: 1 },
  { ID: 5, FULL_NAME: 'Eve Concierge', EMAIL: 'eve@altonshotel.com', PHONE: '+1-555-0205', DEPARTMENT: 'Concierge', POSITION: 'Concierge', SALARY: 35000, HIRE_DATE: '2025-05-05', IS_ACTIVE: 1 },
]

let SETTINGS = [
  { SETTING_KEY: 'hotel_name', SETTING_VALUE: 'Altons Hotel', DESCRIPTION: 'Hotel display name', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'hotel_address', SETTING_VALUE: '123 Main Street, City', DESCRIPTION: 'Hotel address', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'hotel_phone', SETTING_VALUE: '+1-555-0100', DESCRIPTION: 'Main phone number', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'hotel_email', SETTING_VALUE: 'info@altonshotel.com', DESCRIPTION: 'Contact email', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'tax_rate', SETTING_VALUE: '10', DESCRIPTION: 'Default tax rate (%)', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'currency', SETTING_VALUE: 'USD', DESCRIPTION: 'Default currency', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'check_in_time', SETTING_VALUE: '14:00', DESCRIPTION: 'Standard check-in time', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'check_out_time', SETTING_VALUE: '12:00', DESCRIPTION: 'Standard check-out time', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'max_guests_per_booking', SETTING_VALUE: '4', DESCRIPTION: 'Maximum guests allowed per booking', UPDATED_AT: now, UPDATED_BY: 1 },
  { SETTING_KEY: 'cancellation_policy', SETTING_VALUE: 'Free cancellation 48 hours before check-in', DESCRIPTION: 'Cancellation policy text', UPDATED_AT: now, UPDATED_BY: 1 },
]

let AUDIT_LOG = [
  { ID: 1, ACTION: 'LOGIN', ENTITY_TYPE: 'USER', ENTITY_ID: 1, PERFORMED_BY: 'admin', PERFORMED_BY_ID: 1, PERFORMED_AT: '2026-07-29T08:00:00', DETAILS: 'User admin logged in' },
  { ID: 2, ACTION: 'CREATE', ENTITY_TYPE: 'ROOM', ENTITY_ID: 15, PERFORMED_BY: 'admin', PERFORMED_BY_ID: 1, PERFORMED_AT: '2026-07-29T08:30:00', DETAILS: 'Created room 701' },
  { ID: 3, ACTION: 'UPDATE', ENTITY_TYPE: 'RESERVATION', ENTITY_ID: 3, PERFORMED_BY: 'reception1', PERFORMED_BY_ID: 2, PERFORMED_AT: '2026-07-29T09:15:00', DETAILS: 'Updated reservation #3 - changed dates' },
  { ID: 4, ACTION: 'CHECKIN', ENTITY_TYPE: 'BOOKING', ENTITY_ID: 2, PERFORMED_BY: 'reception1', PERFORMED_BY_ID: 2, PERFORMED_AT: '2026-07-29T10:00:00', DETAILS: 'Checked in booking #2' },
  { ID: 5, ACTION: 'PAYMENT', ENTITY_TYPE: 'INVOICE', ENTITY_ID: 1, PERFORMED_BY: 'reception1', PERFORMED_BY_ID: 2, PERFORMED_AT: '2026-07-29T10:30:00', DETAILS: 'Recorded payment of $290 on invoice #1' },
  { ID: 6, ACTION: 'CREATE', ENTITY_TYPE: 'GUEST', ENTITY_ID: 5, PERFORMED_BY: 'reception1', PERFORMED_BY_ID: 2, PERFORMED_AT: '2026-07-28T14:00:00', DETAILS: 'Created guest record for Alex Brown' },
  { ID: 7, ACTION: 'LOGOUT', ENTITY_TYPE: 'USER', ENTITY_ID: 2, PERFORMED_BY: 'reception1', PERFORMED_BY_ID: 2, PERFORMED_AT: '2026-07-28T18:00:00', DETAILS: 'User reception1 logged out' },
  { ID: 8, ACTION: 'UPDATE', ENTITY_TYPE: 'SETTINGS', ENTITY_ID: null, PERFORMED_BY: 'admin', PERFORMED_BY_ID: 1, PERFORMED_AT: '2026-07-27T12:00:00', DETAILS: 'Updated hotel settings' },
  { ID: 9, ACTION: 'CREATE', ENTITY_TYPE: 'MAINTENANCE', ENTITY_ID: 3, PERFORMED_BY: 'manager1', PERFORMED_BY_ID: 3, PERFORMED_AT: '2026-07-28T14:15:00', DETAILS: 'Reported HVAC issue in room 302' },
  { ID: 10, ACTION: 'LOGIN', ENTITY_TYPE: 'USER', ENTITY_ID: 3, PERFORMED_BY: 'manager1', PERFORMED_BY_ID: 3, PERFORMED_AT: '2026-07-29T07:45:00', DETAILS: 'User manager1 logged in' },
]

let PAYROLL = [
  { ID: 1, STAFF_ID: 1, MONTH: '2026-05', SALARY_PAID: 3750, PAYMENT_DATE: '2026-05-31' },
  { ID: 2, STAFF_ID: 1, MONTH: '2026-06', SALARY_PAID: 3750, PAYMENT_DATE: '2026-06-30' },
  { ID: 3, STAFF_ID: 1, MONTH: '2026-07', SALARY_PAID: 3750, PAYMENT_DATE: '2026-07-31' },
  { ID: 4, STAFF_ID: 2, MONTH: '2026-05', SALARY_PAID: 2667, PAYMENT_DATE: '2026-05-31' },
  { ID: 5, STAFF_ID: 2, MONTH: '2026-06', SALARY_PAID: 2667, PAYMENT_DATE: '2026-06-30' },
  { ID: 6, STAFF_ID: 2, MONTH: '2026-07', SALARY_PAID: 2667, PAYMENT_DATE: '2026-07-31' },
  { ID: 7, STAFF_ID: 3, MONTH: '2026-05', SALARY_PAID: 2333, PAYMENT_DATE: '2026-05-31' },
  { ID: 8, STAFF_ID: 3, MONTH: '2026-06', SALARY_PAID: 2333, PAYMENT_DATE: '2026-06-30' },
  { ID: 9, STAFF_ID: 3, MONTH: '2026-07', SALARY_PAID: 2333, PAYMENT_DATE: '2026-07-31' },
  { ID: 10, STAFF_ID: 4, MONTH: '2026-06', SALARY_PAID: 2500, PAYMENT_DATE: '2026-06-30' },
  { ID: 11, STAFF_ID: 4, MONTH: '2026-07', SALARY_PAID: 2500, PAYMENT_DATE: '2026-07-31' },
  { ID: 12, STAFF_ID: 5, MONTH: '2026-06', SALARY_PAID: 2917, PAYMENT_DATE: '2026-06-30' },
  { ID: 13, STAFF_ID: 5, MONTH: '2026-07', SALARY_PAID: 2917, PAYMENT_DATE: '2026-07-31' },
]

let BOOKING_REQUESTS = [
  { ID: 1, GUEST_NAME: 'Alice Cooper', GUEST_EMAIL: 'alice.cooper@email.com', GUEST_PHONE: '+1-555-0111', ID_TYPE: 'PASSPORT', ID_NUMBER: 'US998877', ROOM_TYPE_ID: 2, ROOM_ID: null, CHECK_IN_DATE: '2026-11-15', CHECK_OUT_DATE: '2026-11-18', NUM_GUESTS: 2, TOTAL_PRICE: 450, SPECIAL_REQUESTS: 'Late arrival around 11pm', PAYMENT_METHOD: 'CARD', PROMO_CODE: '', STATUS: 'pending', REJECTION_REASON: null, NOTES: '', APPROVED_BY: null, APPROVED_AT: null, CREATED_AT: now, UPDATED_AT: now },
  { ID: 2, GUEST_NAME: 'Brian May', GUEST_EMAIL: 'brian.may@email.com', GUEST_PHONE: '+44-7700-900456', ID_TYPE: 'NATIONAL_ID', ID_NUMBER: 'UK776655', ROOM_TYPE_ID: 1, ROOM_ID: null, CHECK_IN_DATE: '2026-12-01', CHECK_OUT_DATE: '2026-12-05', NUM_GUESTS: 1, TOTAL_PRICE: 320, SPECIAL_REQUESTS: '', PAYMENT_METHOD: 'CASH', PROMO_CODE: 'WELCOME10', STATUS: 'pending', REJECTION_REASON: null, NOTES: '', APPROVED_BY: null, APPROVED_AT: null, CREATED_AT: now, UPDATED_AT: now },
  { ID: 3, GUEST_NAME: 'Chloe Kim', GUEST_EMAIL: 'chloe.kim@email.com', GUEST_PHONE: '+82-10-1234-5678', ID_TYPE: 'PASSPORT', ID_NUMBER: 'KR554433', ROOM_TYPE_ID: 3, ROOM_ID: 11, CHECK_IN_DATE: '2026-10-20', CHECK_OUT_DATE: '2026-10-23', NUM_GUESTS: 3, TOTAL_PRICE: 750, SPECIAL_REQUESTS: 'Baby cot needed', PAYMENT_METHOD: 'CARD', PROMO_CODE: '', STATUS: 'approved', REJECTION_REASON: null, NOTES: '', APPROVED_BY: 1, APPROVED_AT: now, CREATED_AT: now, UPDATED_AT: now },
  { ID: 4, GUEST_NAME: 'David Okafor', GUEST_EMAIL: 'david.okafor@email.com', GUEST_PHONE: '+234-801-234-5678', ID_TYPE: 'OTHER', ID_NUMBER: 'NG112233', ROOM_TYPE_ID: 4, ROOM_ID: null, CHECK_IN_DATE: '2026-10-25', CHECK_OUT_DATE: '2026-10-27', NUM_GUESTS: 2, TOTAL_PRICE: 1000, SPECIAL_REQUESTS: '', PAYMENT_METHOD: 'CARD', PROMO_CODE: '', STATUS: 'rejected', REJECTION_REASON: 'Room type not available for those dates', NOTES: '', APPROVED_BY: 1, APPROVED_AT: now, CREATED_AT: now, UPDATED_AT: now },
]

let CONTENT = [
  { ID: 1, TITLE: 'Grand Opening of the Rooftop Terrace', TYPE: 'announcement', BODY: '<h2>The rooftop is open</h2><p>After months of renovation, our rooftop terrace is open to all guests — sunset views, light bites and craft cocktails every evening.</p>', FEATURED_IMAGE_URL: null, STATUS: 'published', PUBLISHED_AT: '2026-09-20T10:00:00', CREATED_BY: 1, CREATED_AT: '2026-09-19T16:00:00', UPDATED_AT: '2026-09-20T10:00:00' },
  { ID: 2, TITLE: 'Altons Hotel Wins 2026 Hospitality Award', TYPE: 'news', BODY: '<p>We are proud to announce that ALTONSHOTEL has been recognized with the 2026 Regional Hospitality Award for guest service excellence.</p><p>Thank you to every guest who shared their feedback — this award belongs to you.</p>', FEATURED_IMAGE_URL: null, STATUS: 'published', PUBLISHED_AT: '2026-09-28T09:00:00', CREATED_BY: 1, CREATED_AT: '2026-09-27T14:00:00', UPDATED_AT: '2026-09-28T09:00:00' },
  { ID: 3, TITLE: 'Christmas Eve Gala Dinner', TYPE: 'event', BODY: '<h2>Christmas Eve at Altons</h2><p>Join us on December 24 for a five-course gala dinner with live music. Seats are limited — reserve at the front desk.</p>', FEATURED_IMAGE_URL: null, STATUS: 'published', PUBLISHED_AT: '2026-10-01T12:00:00', CREATED_BY: 1, CREATED_AT: '2026-09-30T11:00:00', UPDATED_AT: '2026-10-01T12:00:00' },
  { ID: 4, TITLE: 'New Executive Suites Now Available', TYPE: 'news', BODY: '<p>Two renovated executive suites on the sixth floor are now available, featuring separate living areas and panoramic city views.</p>', FEATURED_IMAGE_URL: null, STATUS: 'published', PUBLISHED_AT: '2026-10-05T08:30:00', CREATED_BY: 1, CREATED_AT: '2026-10-04T17:00:00', UPDATED_AT: '2026-10-05T08:30:00' },
  { ID: 5, TITLE: 'Pool Maintenance This Weekend', TYPE: 'announcement', BODY: '<p>The swimming pool will be closed on Saturday and Sunday for scheduled maintenance. We apologise for the inconvenience.</p>', FEATURED_IMAGE_URL: null, STATUS: 'draft', PUBLISHED_AT: null, CREATED_BY: 1, CREATED_AT: '2026-10-07T15:00:00', UPDATED_AT: '2026-10-07T15:00:00' },
  { ID: 6, TITLE: 'Summer Jazz Nights', TYPE: 'event', BODY: '<h2>Live jazz every Friday</h2><p>From June through August, the lobby lounge hosts live jazz from 20:00. Free for all hotel guests.</p>', FEATURED_IMAGE_URL: null, STATUS: 'published', PUBLISHED_AT: '2026-06-05T18:00:00', CREATED_BY: 1, CREATED_AT: '2026-06-04T10:00:00', UPDATED_AT: '2026-06-05T18:00:00' },
]

let PROMOTIONS = [
  { ID: 1, TITLE: 'Autumn Escape 25% Off', DESCRIPTION: 'Stay two nights or more this autumn and save 25% on all room types.', DISCOUNT_PCT: 25, START_DATE: '2026-09-15', END_DATE: '2026-11-30', APPLICABLE_ROOM_TYPES: '1,2,3', STATUS: 'active', CREATED_BY: 1, CREATED_AT: '2026-09-10T09:00:00', UPDATED_AT: '2026-09-15T09:00:00' },
  { ID: 2, TITLE: 'Early Bird 2027', DESCRIPTION: 'Book your 2027 summer holiday before December 1 and save 15%.', DISCOUNT_PCT: 15, START_DATE: '2026-12-01', END_DATE: '2027-02-28', APPLICABLE_ROOM_TYPES: '1,2,3,4', STATUS: 'active', CREATED_BY: 1, CREATED_AT: '2026-10-01T09:00:00', UPDATED_AT: '2026-10-01T09:00:00' },
  { ID: 3, TITLE: 'Summer Spectacular 30% Off', DESCRIPTION: 'Our biggest summer sale — 30% off suites and deluxe rooms.', DISCOUNT_PCT: 30, START_DATE: '2026-05-01', END_DATE: '2026-08-31', APPLICABLE_ROOM_TYPES: '2,3', STATUS: 'active', CREATED_BY: 1, CREATED_AT: '2026-04-20T09:00:00', UPDATED_AT: '2026-05-01T09:00:00' },
  { ID: 4, TITLE: 'Weekend Flash Sale', DESCRIPTION: 'A surprise 10% off for weekend stays — still being finalised.', DISCOUNT_PCT: 10, START_DATE: '2026-10-10', END_DATE: '2026-10-12', APPLICABLE_ROOM_TYPES: '1', STATUS: 'draft', CREATED_BY: 1, CREATED_AT: '2026-10-06T09:00:00', UPDATED_AT: '2026-10-06T09:00:00' },
]

let EMAIL_TEMPLATES = [
  { ID: 1, NAME: 'Welcome Email', SUBJECT: 'Welcome to ALTONSHOTEL', BODY: '<h2>Welcome, {{guest_name}}!</h2><p>We are delighted to host you at ALTONSHOTEL. Your check-in is on <strong>{{check_in_date}}</strong> and you have been assigned room <strong>{{room_number}}</strong>.</p><p>If you need anything before your arrival, just reply to this email.</p>', TYPE: 'welcome', PLACEHOLDERS: '["guest_name","room_number","check_in_date"]', IS_SYSTEM: 1, CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
  { ID: 2, NAME: 'Promotion Offer', SUBJECT: 'Special Offer Just for You', BODY: '<h2>A deal picked for you</h2><p>Enjoy exclusive savings on your next stay at ALTONSHOTEL. Book now and make the most of it.</p><p><a href="https://altonshotel.com/booking">Book now</a></p>', TYPE: 'promotion', PLACEHOLDERS: '["guest_name"]', IS_SYSTEM: 1, CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
  { ID: 3, NAME: 'Newsletter', SUBJECT: 'Our Latest News & Updates', BODY: '<h2>News from ALTONSHOTEL</h2><p>Here is what is happening at the hotel this month — new amenities, events and seasonal offers.</p><p><a href="https://altonshotel.com/landing">See current offers</a></p>', TYPE: 'newsletter', PLACEHOLDERS: '["guest_name"]', IS_SYSTEM: 1, CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
  { ID: 4, NAME: 'Check-in Reminder', SUBJECT: 'Your Check-in is Tomorrow', BODY: '<h2>See you soon, {{guest_name}}!</h2><p>This is a friendly reminder that your check-in is tomorrow, <strong>{{check_in_date}}</strong>. Your room will be <strong>{{room_number}}</strong>.</p><p>Check-in starts at 14:00.</p>', TYPE: 'reminder', PLACEHOLDERS: '["guest_name","room_number","check_in_date"]', IS_SYSTEM: 1, CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
  { ID: 5, NAME: 'Check-out Thank You', SUBJECT: 'Thank you for staying', BODY: '<h2>Thank you, {{guest_name}}!</h2><p>We hope you enjoyed your stay in room <strong>{{room_number}}</strong>. We would love to welcome you back soon.</p>', TYPE: 'welcome', PLACEHOLDERS: '["guest_name","room_number"]', IS_SYSTEM: 1, CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
  { ID: 6, NAME: 'Feedback Request', SUBJECT: "We'd love your feedback", BODY: '<h2>How did we do, {{guest_name}}?</h2><p>Your opinion matters. Take a minute to tell us about your stay and help us improve.</p><p><a href="https://altonshotel.com/landing">Share your feedback</a></p>', TYPE: 'custom', PLACEHOLDERS: '["guest_name"]', IS_SYSTEM: 1, CREATED_BY: 1, CREATED_AT: now, UPDATED_AT: now },
]

let EMAIL_CAMPAIGNS = [
  { ID: 1, TITLE: 'October Newsletter', TEMPLATE_ID: 3, RECIPIENT_TYPE: 'all_guests', RECIPIENT_COUNT: 4, STATUS: 'sent', SCHEDULED_AT: null, SENT_AT: '2026-10-02T09:00:00', SUBJECT_OVERRIDE: null, BODY_OVERRIDE: null, OPEN_COUNT: 3, CLICK_COUNT: 2, CREATED_BY: 1, CREATED_AT: '2026-10-02T08:55:00' },
  { ID: 2, TITLE: 'Autumn Escape Offer', TEMPLATE_ID: 2, RECIPIENT_TYPE: 'past_guests', RECIPIENT_COUNT: 3, STATUS: 'sent', SCHEDULED_AT: null, SENT_AT: '2026-10-05T14:00:00', SUBJECT_OVERRIDE: 'Autumn Escape — 25% Off Your Next Stay', BODY_OVERRIDE: '<h2>25% off, just for you</h2><p>Book an autumn stay before November 30 and save 25%. <a href="https://altonshotel.com/booking">Claim the offer</a></p>', OPEN_COUNT: 2, CLICK_COUNT: 1, CREATED_BY: 1, CREATED_AT: '2026-10-05T13:50:00' },
]

let SUBSCRIBERS = [
  { ID: 1, EMAIL: 'john.doe@email.com', STATUS: 'active', SUBSCRIBED_AT: '2026-09-21T10:00:00', CREATED_AT: '2026-09-21T10:00:00' },
  { ID: 2, EMAIL: 'maria.g@email.com', STATUS: 'active', SUBSCRIBED_AT: '2026-09-22T11:30:00', CREATED_AT: '2026-09-22T11:30:00' },
  { ID: 3, EMAIL: 'takeshi.y@email.com', STATUS: 'active', SUBSCRIBED_AT: '2026-09-25T09:15:00', CREATED_AT: '2026-09-25T09:15:00' },
  { ID: 4, EMAIL: 'sarah.j@email.com', STATUS: 'active', SUBSCRIBED_AT: '2026-09-30T16:45:00', CREATED_AT: '2026-09-30T16:45:00' },
  { ID: 5, EMAIL: 'news.reader@example.com', STATUS: 'active', SUBSCRIBED_AT: '2026-10-01T08:00:00', CREATED_AT: '2026-10-01T08:00:00' },
  { ID: 6, EMAIL: 'friend.of.hotel@example.com', STATUS: 'active', SUBSCRIBED_AT: '2026-10-03T19:20:00', CREATED_AT: '2026-10-03T19:20:00' },
  { ID: 7, EMAIL: 'former.guest@example.com', STATUS: 'active', SUBSCRIBED_AT: '2026-10-04T12:00:00', CREATED_AT: '2026-10-04T12:00:00' },
  { ID: 8, EMAIL: 'unsubscribed.reader@example.com', STATUS: 'unsubscribed', SUBSCRIBED_AT: '2026-09-10T12:00:00', CREATED_AT: '2026-09-10T12:00:00' },
]

let EMAIL_TRACKING = [
  { ID: 1, CAMPAIGN_ID: 1, RECIPIENT_EMAIL: 'john.doe@email.com', EVENT_TYPE: 'open', LINK_URL: null, USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-02T09:12:00' },
  { ID: 2, CAMPAIGN_ID: 1, RECIPIENT_EMAIL: 'maria.g@email.com', EVENT_TYPE: 'open', LINK_URL: null, USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-02T09:40:00' },
  { ID: 3, CAMPAIGN_ID: 1, RECIPIENT_EMAIL: 'maria.g@email.com', EVENT_TYPE: 'click', LINK_URL: 'https://altonshotel.com/landing', USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-02T09:41:00' },
  { ID: 4, CAMPAIGN_ID: 1, RECIPIENT_EMAIL: 'takeshi.y@email.com', EVENT_TYPE: 'open', LINK_URL: null, USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-02T10:05:00' },
  { ID: 5, CAMPAIGN_ID: 1, RECIPIENT_EMAIL: 'takeshi.y@email.com', EVENT_TYPE: 'click', LINK_URL: 'https://altonshotel.com/booking', USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-02T10:06:00' },
  { ID: 6, CAMPAIGN_ID: 2, RECIPIENT_EMAIL: 'john.doe@email.com', EVENT_TYPE: 'open', LINK_URL: null, USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-05T14:20:00' },
  { ID: 7, CAMPAIGN_ID: 2, RECIPIENT_EMAIL: 'john.doe@email.com', EVENT_TYPE: 'click', LINK_URL: 'https://altonshotel.com/booking', USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-05T14:21:00' },
  { ID: 8, CAMPAIGN_ID: 2, RECIPIENT_EMAIL: 'sarah.j@email.com', EVENT_TYPE: 'open', LINK_URL: null, USER_AGENT: 'Mozilla/5.0', IP_ADDRESS: '127.0.0.1', CREATED_AT: '2026-10-05T15:02:00' },
]

// --- AI content generator (Phase: AI Content) ---
let AI_GENERATED_CONTENT: {
  ID: number
  TITLE: string
  TYPE: string
  ADMIN_PROMPT: string
  GENERATED_CONTENT: string
  FLYER_IMAGE_URL: string | null
  FLYER_DATA: string | null
  STATUS: string
  BRAND_GUIDELINES: string | null
  CREATED_BY: number | null
  CREATED_AT: string
  UPDATED_AT: string
  APPROVED_BY: number | null
  APPROVED_AT: string | null
}[] = [
  { ID: 1, TITLE: 'Autumn Escape Flyer', TYPE: 'flyer', ADMIN_PROMPT: 'Promote our Autumn Escape offer with 25% off stays of two nights or more until November 30.', GENERATED_CONTENT: '{"headline":"Autumn Escape","subtitle":"save 25% on stays of 2 nights or more","details":"Book before November 30 and unwind in comfort. Suites, deluxe rooms and city views are waiting.","cta_text":"Book Your Escape","accent_color":"#c9a227"}', FLYER_IMAGE_URL: null, FLYER_DATA: '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#0d1b2a"/><rect y="1190" width="1080" height="160" fill="#c9a227"/><text x="540" y="300" font-family="Georgia, serif" font-size="58" fill="#c9a227" text-anchor="middle" letter-spacing="6">ALTONSHOTEL</text><text x="540" y="520" font-family="Georgia, serif" font-size="96" fill="#f5f0e6" text-anchor="middle">Autumn Escape</text><text x="540" y="600" font-family="Arial, sans-serif" font-size="40" fill="#f5f0e6" text-anchor="middle">save 25% on stays of 2 nights or more</text><text x="540" y="700" font-family="Arial, sans-serif" font-size="30" fill="#e0dccf" text-anchor="middle">Book before November 30 and unwind in comfort.</text><text x="540" y="1240" font-family="Arial, sans-serif" font-size="36" fill="#0d1b2a" text-anchor="middle" font-weight="bold">BOOK YOUR ESCAPE</text></svg>', STATUS: 'approved', BRAND_GUIDELINES: 'Elegant luxury, deep navy and gold accents, serif headlines.', CREATED_BY: 1, CREATED_AT: '2026-10-03T10:00:00', UPDATED_AT: '2026-10-03T10:05:00', APPROVED_BY: 1, APPROVED_AT: '2026-10-03T10:05:00' },
  { ID: 2, TITLE: 'October Newsletter', TYPE: 'newsletter', ADMIN_PROMPT: 'Write our October newsletter: rooftop terrace now open, new executive suites, and the Autumn Escape offer.', GENERATED_CONTENT: '{"subject":"News from ALTONSHOTEL — October","preheader":"Rooftop terraces, new suites and an autumn offer.","headline":"Your October update","body_html":"<h2>The rooftop is open</h2><p>Sunset views, light bites and craft cocktails are now served on our new rooftop terrace — free for guests.</p><h2>New executive suites</h2><p>Two renovated suites on the sixth floor await, with separate living areas and panoramic views.</p><h2>Autumn Escape</h2><p>Save 25% on stays of two nights or more, booked before November 30.</p><p><a href=\\"https://altonshotel.com/booking\\">Book now</a></p>","cta_label":"Book now","cta_url":"https://altonshotel.com/booking"}', FLYER_IMAGE_URL: null, FLYER_DATA: null, STATUS: 'published', BRAND_GUIDELINES: 'Elegant luxury, deep navy and gold accents.', CREATED_BY: 1, CREATED_AT: '2026-10-01T09:00:00', UPDATED_AT: '2026-10-02T09:00:00', APPROVED_BY: 1, APPROVED_AT: '2026-10-01T16:00:00' },
  { ID: 3, TITLE: 'Rooftop Terrace Reel', TYPE: 'instagram_post', ADMIN_PROMPT: 'Create an Instagram post announcing the rooftop terrace opening with a golden-hour vibe.', GENERATED_CONTENT: '{"caption":"Golden hour has a new address. Our rooftop terrace is officially open — sunset views, light bites and craft cocktails, every evening for our guests. Come up and see the city in a different light. \\u2728","hashtags":"#ALTONSHOTEL #RooftopBar #CityViews #HotelLife"}', FLYER_IMAGE_URL: null, FLYER_DATA: null, STATUS: 'approved', BRAND_GUIDELINES: 'Elegant luxury, deep navy and gold accents.', CREATED_BY: 1, CREATED_AT: '2026-10-04T11:00:00', UPDATED_AT: '2026-10-04T11:02:00', APPROVED_BY: 1, APPROVED_AT: '2026-10-04T11:02:00' },
]

let AI_CONTENT_VERSIONS: {
  ID: number
  CONTENT_ID: number
  VERSION_NUMBER: number
  GENERATED_CONTENT: string
  REASON: string
  GENERATED_BY: number | null
  GENERATED_AT: string
}[] = [
  { ID: 1, CONTENT_ID: 1, VERSION_NUMBER: 1, GENERATED_CONTENT: '{"headline":"Autumn Escape","subtitle":"save 25% on stays of 2 nights or more","details":"Book before November 30 and unwind in comfort. Suites, deluxe rooms and city views are waiting.","cta_text":"Book Your Escape","accent_color":"#c9a227"}', REASON: 'Initial generation', GENERATED_BY: 1, GENERATED_AT: '2026-10-03T10:00:00' },
  { ID: 2, CONTENT_ID: 2, VERSION_NUMBER: 1, GENERATED_CONTENT: '{"subject":"News from ALTONSHOTEL — October","preheader":"Rooftop terraces, new suites and an autumn offer.","headline":"Your October update","body_html":"<h2>The rooftop is open</h2><p>Sunset views, light bites and craft cocktails are now served on our new rooftop terrace — free for guests.</p><h2>New executive suites</h2><p>Two renovated suites on the sixth floor await, with separate living areas and panoramic views.</p><h2>Autumn Escape</h2><p>Save 25% on stays of two nights or more, booked before November 30.</p><p><a href=\\"https://altonshotel.com/booking\\">Book now</a></p>","cta_label":"Book now","cta_url":"https://altonshotel.com/booking"}', REASON: 'Initial generation', GENERATED_BY: 1, GENERATED_AT: '2026-10-01T09:00:00' },
  { ID: 3, CONTENT_ID: 3, VERSION_NUMBER: 1, GENERATED_CONTENT: '{"caption":"Golden hour has a new address. Our rooftop terrace is officially open — sunset views, light bites and craft cocktails, every evening for our guests. Come up and see the city in a different light. \\u2728","hashtags":"#ALTONSHOTEL #RooftopBar #CityViews #HotelLife"}', REASON: 'Initial generation', GENERATED_BY: 1, GENERATED_AT: '2026-10-04T11:00:00' },
]

let AI_CONTENT_DISTRIBUTIONS: {
  ID: number
  CONTENT_ID: number
  CHANNEL: string
  RECIPIENT_TYPE: string | null
  RECIPIENT_COUNT: number
  STATUS: string
  SCHEDULED_AT: string | null
  SENT_AT: string | null
  ENGAGEMENT_COUNT: number
  CAMPAIGN_ID: number | null
  CREATED_BY: number | null
  CREATED_AT: string
}[] = [
  { ID: 1, CONTENT_ID: 2, CHANNEL: 'newsletter', RECIPIENT_TYPE: 'newsletter_subscribers', RECIPIENT_COUNT: 6, STATUS: 'sent', SCHEDULED_AT: '2026-10-02T09:00:00', SENT_AT: '2026-10-02T09:00:12', ENGAGEMENT_COUNT: 3, CAMPAIGN_ID: 1, CREATED_BY: 1, CREATED_AT: '2026-10-01T16:30:00' },
  { ID: 2, CONTENT_ID: 3, CHANNEL: 'instagram', RECIPIENT_TYPE: null, RECIPIENT_COUNT: 1, STATUS: 'sent', SCHEDULED_AT: null, SENT_AT: '2026-10-04T18:00:20', ENGAGEMENT_COUNT: 12, CAMPAIGN_ID: null, CREATED_BY: 1, CREATED_AT: '2026-10-04T11:10:00' },
  { ID: 3, CONTENT_ID: 1, CHANNEL: 'whatsapp', RECIPIENT_TYPE: null, RECIPIENT_COUNT: 0, STATUS: 'manual', SCHEDULED_AT: null, SENT_AT: null, ENGAGEMENT_COUNT: 0, CAMPAIGN_ID: null, CREATED_BY: 1, CREATED_AT: '2026-10-03T10:10:00' },
]

// --- Mock Connection ---
class MockConnection {
  async execute(sql: string, binds: Record<string, unknown> = {}) {
    const upper = sql.toUpperCase().trim()

    // SELECT
    if (upper.startsWith('SELECT')) {
      return this._executeSelect(sql, binds)
    }
    // INSERT
    if (upper.startsWith('INSERT')) {
      return this._executeInsert(sql, binds)
    }
    // UPDATE
    if (upper.startsWith('UPDATE')) {
      return this._executeUpdate(sql, binds)
    }
    // DELETE
    if (upper.startsWith('DELETE')) {
      return this._executeDelete(sql, binds)
    }
    // MERGE
    if (upper.startsWith('MERGE')) {
      return { rowsAffected: 1 }
    }
    // Default
    return { rows: [], rowsAffected: 0 }
  }

  private _columnMap: Record<string, string[]> = {
    ROOMS: ['ROOM_ID', 'ROOM_NUMBER', 'TYPE_ID', 'FLOOR', 'STATUS', 'DESCRIPTION'],
    GUESTS: ['GUEST_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'ID_TYPE', 'ID_NUMBER', 'ADDRESS', 'NATIONALITY', 'CREATED_AT', 'UPDATED_AT'],
    RESERVATIONS: ['RESERVATION_ID', 'GUEST_ID', 'ROOM_TYPE_ID', 'CHECK_IN_DATE', 'CHECK_OUT_DATE', 'STATUS', 'SPECIAL_REQUESTS', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT'],
    BOOKINGS: ['BOOKING_ID', 'RESERVATION_ID', 'ROOM_ID', 'CHECK_IN_DATE', 'CHECK_OUT_DATE', 'RATE_PER_NIGHT', 'STATUS', 'CREATED_AT'],
    CHECKINS: ['CHECKIN_ID', 'BOOKING_ID', 'ACTUAL_CHECK_IN', 'CHECKED_IN_BY', 'NOTES'],
    CHECKOUTS: ['CHECKOUT_ID', 'CHECKIN_ID', 'ACTUAL_CHECK_OUT', 'CHECKED_OUT_BY', 'NOTES'],
    INVOICES: ['INVOICE_ID', 'BOOKING_ID', 'GUEST_ID', 'TOTAL_AMOUNT', 'STATUS', 'CREATED_AT', 'UPDATED_AT'],
    INVOICE_ITEMS: ['ITEM_ID', 'INVOICE_ID', 'DESCRIPTION', 'QUANTITY', 'UNIT_PRICE', 'TOTAL'],
    PAYMENTS: ['PAYMENT_ID', 'INVOICE_ID', 'AMOUNT', 'PAYMENT_METHOD', 'PAYMENT_DATE', 'REFERENCE_NUMBER', 'RECEIVED_BY'],
    USERS: ['USER_ID', 'USERNAME', 'PASSWORD_HASH', 'FULL_NAME', 'EMAIL', 'ROLE_ID', 'IS_ACTIVE', 'FAILED_LOGIN_ATTEMPTS', 'LAST_LOGIN', 'CREATED_AT', 'UPDATED_AT'],
    ROLES: ['ROLE_ID', 'ROLE_NAME', 'DESCRIPTION'],
    ROOM_TYPES: ['TYPE_ID', 'TYPE_NAME', 'DESCRIPTION', 'BASE_PRICE', 'MAX_OCCUPANCY'],
    MAINTENANCE: ['ID', 'ROOM_ID', 'ISSUE_TYPE', 'DESCRIPTION', 'STATUS', 'CREATED_DATE', 'ASSIGNED_TO', 'RESOLVED_DATE', 'NOTES'],
    STAFF: ['ID', 'FULL_NAME', 'EMAIL', 'PHONE', 'DEPARTMENT', 'POSITION', 'SALARY', 'HIRE_DATE', 'IS_ACTIVE'],
    PAYROLL: ['ID', 'STAFF_ID', 'MONTH', 'SALARY_PAID', 'PAYMENT_DATE'],
    BOOKING_REQUESTS: ['ID', 'GUEST_NAME', 'GUEST_EMAIL', 'GUEST_PHONE', 'ID_TYPE', 'ID_NUMBER', 'ROOM_TYPE_ID', 'ROOM_ID', 'CHECK_IN_DATE', 'CHECK_OUT_DATE', 'NUM_GUESTS', 'TOTAL_PRICE', 'SPECIAL_REQUESTS', 'PAYMENT_METHOD', 'PROMO_CODE', 'STATUS', 'REJECTION_REASON', 'NOTES', 'APPROVED_BY', 'APPROVED_AT', 'CREATED_AT', 'UPDATED_AT'],
    SYSTEM_SETTINGS: ['SETTING_KEY', 'SETTING_VALUE', 'DESCRIPTION', 'UPDATED_AT', 'UPDATED_BY'],
    AUDIT_LOG: ['ID', 'ACTION', 'ENTITY_TYPE', 'ENTITY_ID', 'PERFORMED_BY', 'PERFORMED_BY_ID', 'PERFORMED_AT', 'DETAILS'],
    CONTENT: ['ID', 'TITLE', 'TYPE', 'BODY', 'FEATURED_IMAGE_URL', 'STATUS', 'PUBLISHED_AT', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT'],
    PROMOTIONS: ['ID', 'TITLE', 'DESCRIPTION', 'DISCOUNT_PCT', 'START_DATE', 'END_DATE', 'APPLICABLE_ROOM_TYPES', 'STATUS', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT'],
    EMAIL_TEMPLATES: ['ID', 'NAME', 'SUBJECT', 'BODY', 'TYPE', 'PLACEHOLDERS', 'IS_SYSTEM', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT'],
    EMAIL_CAMPAIGNS: ['ID', 'TITLE', 'TEMPLATE_ID', 'RECIPIENT_TYPE', 'RECIPIENT_COUNT', 'STATUS', 'SCHEDULED_AT', 'SENT_AT', 'SUBJECT_OVERRIDE', 'BODY_OVERRIDE', 'OPEN_COUNT', 'CLICK_COUNT', 'CREATED_BY', 'CREATED_AT'],
    SUBSCRIBERS: ['ID', 'EMAIL', 'STATUS', 'SUBSCRIBED_AT', 'CREATED_AT'],
    EMAIL_TRACKING: ['ID', 'CAMPAIGN_ID', 'RECIPIENT_EMAIL', 'EVENT_TYPE', 'LINK_URL', 'USER_AGENT', 'IP_ADDRESS', 'CREATED_AT'],
    AI_GENERATED_CONTENT: ['ID', 'TITLE', 'TYPE', 'ADMIN_PROMPT', 'GENERATED_CONTENT', 'FLYER_IMAGE_URL', 'FLYER_DATA', 'STATUS', 'BRAND_GUIDELINES', 'CREATED_BY', 'CREATED_AT', 'UPDATED_AT', 'APPROVED_BY', 'APPROVED_AT'],
    AI_CONTENT_VERSIONS: ['ID', 'CONTENT_ID', 'VERSION_NUMBER', 'GENERATED_CONTENT', 'REASON', 'GENERATED_BY', 'GENERATED_AT'],
    AI_CONTENT_DISTRIBUTIONS: ['ID', 'CONTENT_ID', 'CHANNEL', 'RECIPIENT_TYPE', 'RECIPIENT_COUNT', 'STATUS', 'SCHEDULED_AT', 'SENT_AT', 'ENGAGEMENT_COUNT', 'CAMPAIGN_ID', 'CREATED_BY', 'CREATED_AT'],
  }

  private _projectColumns(sql: string, rows: unknown[][]): unknown[][] {
    if (rows.length === 0) return rows
    const upper = sql.toUpperCase()
    const match = upper.match(/^SELECT\s+(.+?)\s+FROM\s+/)
    if (!match) return rows
    let selectCols = match[1].trim()
    // Handle COUNT, NVL, etc. - skip projection for aggregations
    if (selectCols.includes('COUNT(') || selectCols.includes('NVL(') || selectCols.includes('AVG(')) return rows
    // Skip projection for JOIN queries or SELECT *
    if (selectCols === '*') return rows
    if (upper.includes(' JOIN ')) return rows

    // Determine which table to find column names for
    const fromMatch = upper.match(/FROM\s+(\w+)/)
    if (!fromMatch) return rows
    const tableName = fromMatch[1]
    const tableCols = this._columnMap[tableName]
    if (!tableCols) return rows

    // Parse selected column names (strip table prefixes like "r." or "b.")
    const colNames = selectCols.split(',').map(c => {
      let col = c.trim().replace(/^(\w+\.)?/, '') // remove table prefix
      // Handle aliases: "STATUS s" -> "STATUS"
      col = col.split(/\s+/)[0]
      return col
    })

    // Map to indices
    const indices = colNames.map(name => tableCols.indexOf(name)).filter(i => i >= 0)
    if (indices.length === 0 || indices.length === tableCols.length) return rows

    return rows.map(row => indices.map(i => row[i]))
  }

  private _executeSelect(sql: string, binds: Record<string, unknown>) {
    const upper = sql.toUpperCase()
    let rows: unknown[][] = []

    // Aggregates and joins — check before individual table handlers
    if (upper.includes('COUNT(*)')) {
      if (upper.includes('FROM ROOMS')) {
        let filtered = [...ROOMS]
        if (binds.status) filtered = filtered.filter(r => r.STATUS === binds.status)
        if (binds.type_id) filtered = filtered.filter(r => r.TYPE_ID === Number(binds.type_id))
        rows = [[filtered.length]]
      } else if (upper.includes('FROM RESERVATIONS')) {
        let filtered = [...RESERVATIONS]
        if (binds.status) filtered = filtered.filter(r => r.STATUS === binds.status)
        if (binds.today) {
          filtered = filtered.filter(r => r.CHECK_IN_DATE === binds.today || r.CHECK_OUT_DATE === binds.today)
        }
        rows = [[filtered.length]]
      } else if (upper.includes('FROM GUESTS')) {
        rows = [[GUESTS.length]]
      } else if (upper.includes('FROM INVOICES')) {
        let filtered = [...INVOICES]
        if (binds.status) filtered = filtered.filter(i => i.STATUS === binds.status)
        rows = [[filtered.length]]
      } else if (upper.includes('FROM BOOKING_REQUESTS')) {
        rows = [[this._filterBookingRequests(sql, binds).length]]
      } else if (upper.includes('FROM CONTENT')) {
        rows = [[this._filterContent(binds).length]]
      } else if (upper.includes('FROM PROMOTIONS')) {
        rows = [[this._filterPromotions(binds).length]]
      } else if (upper.includes('FROM BOOKINGS')) {
        let filtered = [...BOOKINGS]
        if (binds.status) filtered = filtered.filter(b => b.STATUS === binds.status)
        rows = [[filtered.length]]
      } else {
        rows = [[0]]
      }
    } else if (upper.includes('NVL(SUM(') || upper.includes('NVL(AVG(')) {
      if (upper.includes('INVOICE_ITEMS')) {
        const boundInvSum = binds.invoice_id || binds.p_invoice_id
        const total = INVOICE_ITEMS.filter(i => Number(boundInvSum) ? i.INVOICE_ID === Number(boundInvSum) : true).reduce((sum, i) => sum + i.TOTAL, 0)
        rows = [[total]]
      } else if (upper.includes('PAYMENTS')) {
        const boundPaySum = binds.invoice_id || binds.p_invoice_id
        const paid = PAYMENTS.filter(p => Number(boundPaySum) ? p.INVOICE_ID === Number(boundPaySum) : true).reduce((sum, p) => sum + p.AMOUNT, 0)
        rows = [[paid]]
      } else if (upper.includes('INVOICES')) {
        const total = INVOICES.reduce((sum, i) => sum + i.TOTAL_AMOUNT, 0)
        rows = [[total]]
      } else {
        rows = [[0]]
      }
    } else if (upper.includes('NVL(AVG(')) {
      if (upper.includes('BOOKINGS')) {
        let filtered = [...BOOKINGS]
        if (binds.status) filtered = filtered.filter(b => b.STATUS === binds.status)
        const avg = filtered.length > 0 ? filtered.reduce((sum, b) => sum + b.RATE_PER_NIGHT, 0) / filtered.length : 0
        rows = [[avg]]
      } else {
        rows = [[0]]
      }
    } else if (upper.includes('FROM CHECKINS') && upper.includes('JOIN')) {
      const result = CHECKINS.map(c => {
        const booking = BOOKINGS.find(b => b.BOOKING_ID === c.BOOKING_ID)
        if (!booking) return null
        const reservation = RESERVATIONS.find(r => r.RESERVATION_ID === booking.RESERVATION_ID)
        if (!reservation) return null
        const guest = GUESTS.find(g => g.GUEST_ID === reservation.GUEST_ID)
        if (!guest) return null
        const room = ROOMS.find(r => r.ROOM_ID === booking.ROOM_ID)
        if (!room) return null
        return [c.CHECKIN_ID, c.BOOKING_ID, c.ACTUAL_CHECK_IN, c.CHECKED_IN_BY, c.NOTES,
                booking.ROOM_ID, booking.CHECK_IN_DATE, booking.CHECK_OUT_DATE, booking.RATE_PER_NIGHT,
                reservation.RESERVATION_ID, reservation.GUEST_ID, reservation.ROOM_TYPE_ID, reservation.STATUS,
                guest.FIRST_NAME, guest.LAST_NAME, guest.EMAIL, guest.PHONE,
                room.ROOM_NUMBER, room.FLOOR, room.STATUS]
      }).filter(Boolean)
      rows = result as unknown[][]
    } else if (upper.includes('FROM CHECKOUTS') && upper.includes('JOIN')) {
      const result = CHECKOUTS.map(co => {
        const checkin = CHECKINS.find(c => c.CHECKIN_ID === co.CHECKIN_ID)
        if (!checkin) return null
        const booking = BOOKINGS.find(b => b.BOOKING_ID === checkin.BOOKING_ID)
        if (!booking) return null
        const reservation = RESERVATIONS.find(r => r.RESERVATION_ID === booking.RESERVATION_ID)
        if (!reservation) return null
        const guest = GUESTS.find(g => g.GUEST_ID === reservation.GUEST_ID)
        if (!guest) return null
        const room = ROOMS.find(r => r.ROOM_ID === booking.ROOM_ID)
        if (!room) return null
        return [co.CHECKOUT_ID, co.CHECKIN_ID, co.ACTUAL_CHECK_OUT, co.CHECKED_OUT_BY, co.NOTES,
                checkin.BOOKING_ID, checkin.ACTUAL_CHECK_IN,
                booking.ROOM_ID, booking.CHECK_IN_DATE, booking.CHECK_OUT_DATE, booking.RATE_PER_NIGHT,
                reservation.RESERVATION_ID, reservation.GUEST_ID, reservation.ROOM_TYPE_ID,
                guest.FIRST_NAME, guest.LAST_NAME, guest.EMAIL, guest.PHONE,
                room.ROOM_NUMBER, room.FLOOR]
      }).filter(Boolean)
      rows = result as unknown[][]
    } else if (upper.includes('FROM USERS')) {
      const boundUser = binds.username || binds.p_username
      if (boundUser) {
        const u = USERS.find(u => u.USERNAME === String(boundUser))
        rows = u ? [[u.USER_ID, u.USERNAME, u.PASSWORD_HASH, u.FULL_NAME, u.EMAIL, u.ROLE_ID, u.IS_ACTIVE, u.FAILED_LOGIN_ATTEMPTS, u.LAST_LOGIN, u.CREATED_AT, u.UPDATED_AT]] : []
      } else {
        rows = USERS.map(u => [u.USER_ID, u.USERNAME, u.PASSWORD_HASH, u.FULL_NAME, u.EMAIL, u.ROLE_ID, u.IS_ACTIVE, u.FAILED_LOGIN_ATTEMPTS, u.LAST_LOGIN, u.CREATED_AT, u.UPDATED_AT])
      }
    } else if (upper.includes('FROM ROLES')) {
      const boundRole = binds.role_id || binds.p_role_id
      if (boundRole) {
        const r = ROLES.find(r => r.ROLE_ID === Number(boundRole))
        rows = r ? [[r.ROLE_ID, r.ROLE_NAME, r.DESCRIPTION]] : []
      } else {
        rows = ROLES.map(r => [r.ROLE_ID, r.ROLE_NAME, r.DESCRIPTION])
      }
    } else if (upper.includes('FROM ROOM_TYPES')) {
      rows = ROOM_TYPES.map(rt => [rt.TYPE_ID, rt.TYPE_NAME, rt.DESCRIPTION, rt.BASE_PRICE, rt.MAX_OCCUPANCY])
    } else if (upper.includes('FROM ROOMS')) {
      let filtered = [...ROOMS]
      if (binds.status) filtered = filtered.filter(r => r.STATUS === binds.status)
      if (binds.type_id) filtered = filtered.filter(r => r.TYPE_ID === Number(binds.type_id))
      if (binds.floor) filtered = filtered.filter(r => r.FLOOR === Number(binds.floor))
      const boundRoomId = binds.room_id || binds.p_room_id
      if (boundRoomId) filtered = filtered.filter(r => r.ROOM_ID === Number(boundRoomId))
      rows = filtered.map(r => [r.ROOM_ID, r.ROOM_NUMBER, r.TYPE_ID, r.FLOOR, r.STATUS, r.DESCRIPTION])
    } else if (upper.includes('FROM GUESTS')) {
      let filtered = [...GUESTS]
      const boundGuestId = binds.guest_id || binds.p_guest_id
      if (boundGuestId) filtered = filtered.filter(g => g.GUEST_ID === Number(boundGuestId))
      if (binds.id_number) filtered = filtered.filter(g => g.ID_NUMBER === binds.id_number)
      const searchVal = binds.search || binds.q
      if (searchVal) {
        const q = String(searchVal).replace(/%/g, '').toUpperCase()
        filtered = filtered.filter(g =>
          g.FIRST_NAME.toUpperCase().includes(q) ||
          g.LAST_NAME.toUpperCase().includes(q) ||
          g.EMAIL.toUpperCase().includes(q) ||
          g.PHONE.includes(q) ||
          g.ID_NUMBER.toUpperCase().includes(q)
        )
      }
      rows = filtered.map(g => [g.GUEST_ID, g.FIRST_NAME, g.LAST_NAME, g.EMAIL, g.PHONE, g.ID_TYPE, g.ID_NUMBER, g.ADDRESS, g.NATIONALITY, g.CREATED_AT, g.UPDATED_AT])
    } else if (upper.includes('FROM RESERVATIONS')) {
      let filtered = [...RESERVATIONS]
      const boundResId = binds.reservation_id || binds.p_reservation_id
      if (boundResId) filtered = filtered.filter(r => r.RESERVATION_ID === Number(boundResId))
      if (binds.status) filtered = filtered.filter(r => r.STATUS === binds.status)
      if (binds.guest_id) filtered = filtered.filter(r => r.GUEST_ID === Number(binds.guest_id))
      rows = filtered.map(r => [r.RESERVATION_ID, r.GUEST_ID, r.ROOM_TYPE_ID, r.CHECK_IN_DATE, r.CHECK_OUT_DATE, r.STATUS, r.SPECIAL_REQUESTS, r.CREATED_BY, r.CREATED_AT, r.UPDATED_AT])
    } else if (upper.includes('FROM BOOKINGS') && upper.includes('JOIN ROOMS') && upper.includes('JOIN RESERVATIONS') && upper.includes('JOIN GUESTS')) {
      // Housekeeping tasks query with joins
      let filtered = [...BOOKINGS]
      if (binds.today) filtered = filtered.filter(b => b.CHECK_OUT_DATE === binds.today)
      if (binds.status) filtered = filtered.filter(b => b.STATUS === binds.status)
      rows = filtered.map(b => {
        const room = ROOMS.find(r => r.ROOM_ID === b.ROOM_ID)
        const reservation = RESERVATIONS.find(r => r.RESERVATION_ID === b.RESERVATION_ID)
        const guest = reservation ? GUESTS.find(g => g.GUEST_ID === reservation.GUEST_ID) : null
        return [
          b.BOOKING_ID,
          b.ROOM_ID,
          room?.ROOM_NUMBER || '',
          b.CHECK_OUT_DATE,
          guest ? `${guest.FIRST_NAME} ${guest.LAST_NAME}` : '',
          '',
        ]
      })
    } else if (upper.includes('FROM BOOKINGS')) {
      let filtered = [...BOOKINGS]
      const boundBookingId = binds.booking_id || binds.p_booking_id
      if (boundBookingId) filtered = filtered.filter(b => b.BOOKING_ID === Number(boundBookingId))
      if (binds.reservation_id) filtered = filtered.filter(b => b.RESERVATION_ID === Number(binds.reservation_id))
      if (binds.status) filtered = filtered.filter(b => b.STATUS === binds.status)
      const boundRoomId2 = binds.room_id
      if (boundRoomId2) filtered = filtered.filter(b => b.ROOM_ID === Number(boundRoomId2))
      rows = filtered.map(b => [b.BOOKING_ID, b.RESERVATION_ID, b.ROOM_ID, b.CHECK_IN_DATE, b.CHECK_OUT_DATE, b.RATE_PER_NIGHT, b.STATUS, b.CREATED_AT])
    } else if (upper.includes('FROM BOOKING_REQUESTS')) {
      const filtered = this._filterBookingRequests(sql, binds)
      rows = filtered.map(r => [r.ID, r.GUEST_NAME, r.GUEST_EMAIL, r.GUEST_PHONE, r.ID_TYPE, r.ID_NUMBER, r.ROOM_TYPE_ID, r.ROOM_ID, r.CHECK_IN_DATE, r.CHECK_OUT_DATE, r.NUM_GUESTS, r.TOTAL_PRICE, r.SPECIAL_REQUESTS, r.PAYMENT_METHOD, r.PROMO_CODE, r.STATUS, r.REJECTION_REASON, r.NOTES, r.APPROVED_BY, r.APPROVED_AT, r.CREATED_AT, r.UPDATED_AT])
    } else if (upper.includes('FROM CHECKINS')) {
      let filtered = [...CHECKINS]
      const boundCheckinId = binds.checkin_id || binds.p_checkin_id
      if (boundCheckinId) filtered = filtered.filter(c => c.CHECKIN_ID === Number(boundCheckinId))
      if (binds.booking_id) filtered = filtered.filter(c => c.BOOKING_ID === Number(binds.booking_id))
      rows = filtered.map(c => [c.CHECKIN_ID, c.BOOKING_ID, c.ACTUAL_CHECK_IN, c.CHECKED_IN_BY, c.NOTES])
    } else if (upper.includes('FROM CHECKOUTS')) {
      let filtered = [...CHECKOUTS]
      const boundCheckoutId = binds.checkout_id || binds.p_checkout_id
      if (boundCheckoutId) filtered = filtered.filter(c => c.CHECKOUT_ID === Number(boundCheckoutId))
      if (binds.checkin_id) filtered = filtered.filter(c => c.CHECKIN_ID === Number(binds.checkin_id))
      rows = filtered.map(c => [c.CHECKOUT_ID, c.CHECKIN_ID, c.ACTUAL_CHECK_OUT, c.CHECKED_OUT_BY, c.NOTES])
    } else if (upper.includes('FROM INVOICES')) {
      let filtered = [...INVOICES]
      const boundInvoiceId = binds.invoice_id || binds.p_invoice_id
      if (boundInvoiceId) filtered = filtered.filter(i => i.INVOICE_ID === Number(boundInvoiceId))
      if (binds.booking_id) filtered = filtered.filter(i => i.BOOKING_ID === Number(binds.booking_id))
      if (binds.guest_id) filtered = filtered.filter(i => i.GUEST_ID === Number(binds.guest_id))
      if (binds.status) filtered = filtered.filter(i => i.STATUS === binds.status)
      rows = filtered.map(i => [i.INVOICE_ID, i.BOOKING_ID, i.GUEST_ID, i.TOTAL_AMOUNT, i.STATUS, i.CREATED_AT, i.UPDATED_AT])
    } else if (upper.includes('FROM INVOICE_ITEMS')) {
      let filtered = [...INVOICE_ITEMS]
      const boundInvId = binds.invoice_id || binds.p_invoice_id
      if (boundInvId) filtered = filtered.filter(i => i.INVOICE_ID === Number(boundInvId))
      rows = filtered.map(i => [i.ITEM_ID, i.INVOICE_ID, i.DESCRIPTION, i.QUANTITY, i.UNIT_PRICE, i.TOTAL])
    } else if (upper.includes('FROM PAYMENTS')) {
      let filtered = [...PAYMENTS]
      const boundPayInvId = binds.invoice_id
      if (boundPayInvId) filtered = filtered.filter(p => p.INVOICE_ID === Number(boundPayInvId))
      rows = filtered.map(p => [p.PAYMENT_ID, p.INVOICE_ID, p.AMOUNT, p.PAYMENT_METHOD, p.PAYMENT_DATE, p.REFERENCE_NUMBER, p.RECEIVED_BY])
    } else if (upper.includes('FROM MAINTENANCE')) {
      let filtered = [...MAINTENANCE]
      if (binds.status) filtered = filtered.filter(m => m.STATUS === binds.status)
      if (binds.id || binds.p_id) {
        const boundId = binds.id || binds.p_id
        filtered = filtered.filter(m => m.ID === Number(boundId))
      }
      if (binds.room_id) filtered = filtered.filter(m => m.ROOM_ID === Number(binds.room_id))
      if (upper.includes('WHERE RESOLVED = FALSE') || (upper.includes('WHERE') && upper.includes("STATUS != 'RESOLVED'"))) {
        filtered = filtered.filter(m => m.STATUS !== 'RESOLVED')
      }
      rows = filtered.map(m => [m.ID, m.ROOM_ID, m.ISSUE_TYPE, m.DESCRIPTION, m.STATUS, m.CREATED_DATE, m.ASSIGNED_TO, m.RESOLVED_DATE, m.NOTES])
    } else if (upper.includes('FROM STAFF')) {
      let filtered = [...STAFF]
      const boundId = binds.id || binds.p_id
      if (boundId) filtered = filtered.filter(s => s.ID === Number(boundId))
      if (binds.is_active !== undefined) filtered = filtered.filter(s => s.IS_ACTIVE === Number(binds.is_active))
      if (binds.department) filtered = filtered.filter(s => s.DEPARTMENT === binds.department)
      if (upper.includes('WHERE IS_ACTIVE = TRUE') || upper.includes("WHERE IS_ACTIVE = 'TRUE'") || upper.includes('WHERE IS_ACTIVE = 1')) {
        filtered = filtered.filter(s => s.IS_ACTIVE === 1)
      }
      rows = filtered.map(s => [s.ID, s.FULL_NAME, s.EMAIL, s.PHONE, s.DEPARTMENT, s.POSITION, s.SALARY, s.HIRE_DATE, s.IS_ACTIVE])
    } else if (upper.includes('FROM PAYROLL')) {
      let filtered = [...PAYROLL]
      const boundStaffId = binds.staff_id || binds.p_staff_id
      if (boundStaffId) filtered = filtered.filter(p => p.STAFF_ID === Number(boundStaffId))
      const boundPayId = binds.id || binds.p_id
      if (boundPayId) filtered = filtered.filter(p => p.ID === Number(boundPayId))
      rows = filtered.map(p => [p.ID, p.STAFF_ID, p.MONTH, p.SALARY_PAID, p.PAYMENT_DATE])
    } else if (upper.includes('FROM SYSTEM_SETTINGS')) {
      rows = SETTINGS.map(s => [s.SETTING_KEY, s.SETTING_VALUE, s.DESCRIPTION, s.UPDATED_AT, s.UPDATED_BY])
    } else if (upper.includes('FROM AUDIT_LOG')) {
      let filtered = [...AUDIT_LOG]
      if (binds.action) filtered = filtered.filter(a => a.ACTION === binds.action)
      if (binds.entity_type) filtered = filtered.filter(a => a.ENTITY_TYPE === binds.entity_type)
      if (upper.includes('JOIN USERS')) {
        rows = filtered.map(a => {
          const user = USERS.find(u => u.USER_ID === a.PERFORMED_BY_ID)
          return [a.ID, a.ACTION, a.ENTITY_TYPE, a.ENTITY_ID, a.PERFORMED_BY_ID, a.PERFORMED_AT, a.DETAILS, user ? user.FULL_NAME : null]
        })
      } else {
        rows = filtered.map(a => [a.ID, a.ACTION, a.ENTITY_TYPE, a.ENTITY_ID, a.PERFORMED_BY, a.PERFORMED_AT, a.DETAILS])
      }
    } else if (upper.includes('FROM CONTENT')) {
      const filtered = this._filterContent(binds)
      rows = filtered.map(c => [c.ID, c.TITLE, c.TYPE, c.BODY, c.FEATURED_IMAGE_URL, c.STATUS, c.PUBLISHED_AT, c.CREATED_BY, c.CREATED_AT, c.UPDATED_AT])
    } else if (upper.includes('FROM PROMOTIONS')) {
      const filtered = this._filterPromotions(binds)
      rows = filtered.map(p => [p.ID, p.TITLE, p.DESCRIPTION, p.DISCOUNT_PCT, p.START_DATE, p.END_DATE, p.APPLICABLE_ROOM_TYPES, p.STATUS, p.CREATED_BY, p.CREATED_AT, p.UPDATED_AT])
    } else if (upper.includes('FROM EMAIL_TEMPLATES')) {
      let filtered = [...EMAIL_TEMPLATES]
      const boundId = binds.id || binds.template_id || binds.p_id
      if (boundId) filtered = filtered.filter(t => t.ID === Number(boundId))
      if (binds.type) filtered = filtered.filter(t => t.TYPE === binds.type)
      rows = filtered.map(t => [t.ID, t.NAME, t.SUBJECT, t.BODY, t.TYPE, t.PLACEHOLDERS, t.IS_SYSTEM, t.CREATED_BY, t.CREATED_AT, t.UPDATED_AT])
    } else if (upper.includes('FROM EMAIL_CAMPAIGNS')) {
      let filtered = [...EMAIL_CAMPAIGNS]
      const boundId = binds.id || binds.campaign_id || binds.p_id
      if (boundId) filtered = filtered.filter(c => c.ID === Number(boundId))
      if (binds.status) filtered = filtered.filter(c => c.STATUS === binds.status)
      rows = filtered.map(c => [c.ID, c.TITLE, c.TEMPLATE_ID, c.RECIPIENT_TYPE, c.RECIPIENT_COUNT, c.STATUS, c.SCHEDULED_AT, c.SENT_AT, c.SUBJECT_OVERRIDE, c.BODY_OVERRIDE, c.OPEN_COUNT, c.CLICK_COUNT, c.CREATED_BY, c.CREATED_AT])
    } else if (upper.includes('FROM SUBSCRIBERS')) {
      let filtered = [...SUBSCRIBERS]
      const boundId = binds.id || binds.p_id
      if (boundId) filtered = filtered.filter(s => s.ID === Number(boundId))
      if (binds.email) filtered = filtered.filter(s => s.EMAIL === String(binds.email).toLowerCase())
      if (binds.status) filtered = filtered.filter(s => s.STATUS === binds.status)
      rows = filtered.map(s => [s.ID, s.EMAIL, s.STATUS, s.SUBSCRIBED_AT, s.CREATED_AT])
    } else if (upper.includes('FROM EMAIL_TRACKING')) {
      let filtered = [...EMAIL_TRACKING]
      const boundCampaign = binds.campaign_id || binds.p_campaign_id
      if (boundCampaign) filtered = filtered.filter(t => t.CAMPAIGN_ID === Number(boundCampaign))
      if (binds.recipient_email) filtered = filtered.filter(t => t.RECIPIENT_EMAIL === String(binds.recipient_email).toLowerCase())
      if (binds.event_type) filtered = filtered.filter(t => t.EVENT_TYPE === binds.event_type)
      rows = filtered.map(t => [t.ID, t.CAMPAIGN_ID, t.RECIPIENT_EMAIL, t.EVENT_TYPE, t.LINK_URL, t.USER_AGENT, t.IP_ADDRESS, t.CREATED_AT])
    } else if (upper.includes('FROM AI_GENERATED_CONTENT')) {
      let filtered = [...AI_GENERATED_CONTENT]
      const boundId = binds.id || binds.content_id || binds.p_id
      if (boundId) filtered = filtered.filter(c => c.ID === Number(boundId))
      if (binds.status) filtered = filtered.filter(c => c.STATUS === binds.status)
      if (binds.type) filtered = filtered.filter(c => c.TYPE === binds.type)
      const searchVal = binds.search
      if (searchVal) {
        const q = String(searchVal).replace(/%/g, '').toUpperCase()
        filtered = filtered.filter(c => c.TITLE.toUpperCase().includes(q))
      }
      rows = filtered.map(c => [c.ID, c.TITLE, c.TYPE, c.ADMIN_PROMPT, c.GENERATED_CONTENT, c.FLYER_IMAGE_URL, c.FLYER_DATA, c.STATUS, c.BRAND_GUIDELINES, c.CREATED_BY, c.CREATED_AT, c.UPDATED_AT, c.APPROVED_BY, c.APPROVED_AT])
    } else if (upper.includes('FROM AI_CONTENT_VERSIONS')) {
      let filtered = [...AI_CONTENT_VERSIONS]
      const boundId = binds.id || binds.version_id || binds.p_id
      if (boundId) filtered = filtered.filter(v => v.ID === Number(boundId))
      if (binds.content_id) filtered = filtered.filter(v => v.CONTENT_ID === Number(binds.content_id))
      rows = filtered.map(v => [v.ID, v.CONTENT_ID, v.VERSION_NUMBER, v.GENERATED_CONTENT, v.REASON, v.GENERATED_BY, v.GENERATED_AT])
    } else if (upper.includes('FROM AI_CONTENT_DISTRIBUTIONS')) {
      let filtered = [...AI_CONTENT_DISTRIBUTIONS]
      const boundId = binds.id || binds.distribution_id || binds.p_id
      if (boundId) filtered = filtered.filter(d => d.ID === Number(boundId))
      if (binds.content_id) filtered = filtered.filter(d => d.CONTENT_ID === Number(binds.content_id))
      if (binds.channel) filtered = filtered.filter(d => d.CHANNEL === binds.channel)
      if (binds.status) filtered = filtered.filter(d => d.STATUS === binds.status)
      rows = filtered.map(d => [d.ID, d.CONTENT_ID, d.CHANNEL, d.RECIPIENT_TYPE, d.RECIPIENT_COUNT, d.STATUS, d.SCHEDULED_AT, d.SENT_AT, d.ENGAGEMENT_COUNT, d.CAMPAIGN_ID, d.CREATED_BY, d.CREATED_AT])
    }

    // Generic OFFSET/FETCH pagination
    const pageMatch = upper.match(/OFFSET\s+(:?\w+)\s+ROWS\s+FETCH\s+(?:NEXT|FIRST)\s+(:?\w+)\s+ROWS?\s+ONLY/)
    if (pageMatch) {
      const resolveVal = (v: string) => v.startsWith(':') ? Number(binds[v.slice(1)] || 0) : Number(v)
      const offset = resolveVal(pageMatch[1])
      const limit = resolveVal(pageMatch[2])
      rows = rows.slice(offset, offset + limit)
    }

    return { rows: this._projectColumns(sql, rows), metaData: rows.length > 0 ? rows[0].map(() => ({})) : [] }
  }

  private _filterBookingRequests(sql: string, binds: Record<string, unknown>) {
    const upper = sql.toUpperCase()
    let filtered = [...BOOKING_REQUESTS]
    const boundId = binds.id || binds.request_id
    if (boundId) filtered = filtered.filter(r => r.ID === Number(boundId))
    if (binds.status) filtered = filtered.filter(r => r.STATUS === binds.status)
    const searchVal = binds.search
    if (searchVal) {
      const q = String(searchVal).replace(/%/g, '').toUpperCase()
      filtered = filtered.filter(r =>
        r.GUEST_NAME.toUpperCase().includes(q) ||
        r.GUEST_EMAIL.toUpperCase().includes(q) ||
        r.GUEST_PHONE.includes(q)
      )
    }
    if (binds.from_date) filtered = filtered.filter(r => r.CHECK_IN_DATE >= String(binds.from_date))
    if (binds.to_date) filtered = filtered.filter(r => r.CHECK_OUT_DATE <= String(binds.to_date))
    const orderMatch = upper.match(/ORDER BY\s+(?:\w+\.)?(\w+)\s+(ASC|DESC)/)
    if (orderMatch) {
      const [, col, dir] = orderMatch
      const key = col.toUpperCase() as keyof (typeof BOOKING_REQUESTS)[number]
      filtered.sort((a, b) => {
        const av = a[key], bv = b[key]
        let cmp = 0
        if (av !== bv) cmp = (av ?? '') < (bv ?? '') ? -1 : 1
        else cmp = a.ID - b.ID
        return dir === 'DESC' ? -cmp : cmp
      })
    }
    return filtered
  }

  private _filterContent(binds: Record<string, unknown>) {
    let filtered = [...CONTENT]
    const boundId = binds.id || binds.p_id
    if (boundId) filtered = filtered.filter(c => c.ID === Number(boundId))
    if (binds.status) filtered = filtered.filter(c => c.STATUS === binds.status)
    if (binds.type) filtered = filtered.filter(c => c.TYPE === binds.type)
    const searchVal = binds.search
    if (searchVal) {
      const q = String(searchVal).replace(/%/g, '').toUpperCase()
      filtered = filtered.filter(c => c.TITLE.toUpperCase().includes(q))
    }
    return filtered
  }

  private _filterPromotions(binds: Record<string, unknown>) {
    let filtered = [...PROMOTIONS]
    const boundId = binds.id || binds.p_id
    if (boundId) filtered = filtered.filter(p => p.ID === Number(boundId))
    if (binds.status) filtered = filtered.filter(p => p.STATUS === binds.status)
    const searchVal = binds.search
    if (searchVal) {
      const q = String(searchVal).replace(/%/g, '').toUpperCase()
      filtered = filtered.filter(p => p.TITLE.toUpperCase().includes(q))
    }
    return filtered
  }

  private _executeInsert(sql: string, binds: Record<string, unknown>) {
    const upper = sql.toUpperCase()
    const id = genId()

    if (upper.includes('INTO USERS')) {
      USERS.push({ USER_ID: id, USERNAME: String(binds.username || ''), PASSWORD_HASH: String(binds.password_hash || ''), FULL_NAME: String(binds.full_name || ''), EMAIL: String(binds.email || ''), ROLE_ID: Number(binds.role_id || 2), IS_ACTIVE: 1, FAILED_LOGIN_ATTEMPTS: 0, LAST_LOGIN: null, CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO ROOMS')) {
      ROOMS.push({ ROOM_ID: id, ROOM_NUMBER: String(binds.room_number || ''), TYPE_ID: Number(binds.type_id || 1), FLOOR: Number(binds.floor || 1), STATUS: String(binds.status || 'AVAILABLE'), DESCRIPTION: String(binds.description || '') })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO GUESTS')) {
      GUESTS.push({ GUEST_ID: id, FIRST_NAME: String(binds.fn || binds.first_name || ''), LAST_NAME: String(binds.ln || binds.last_name || ''), EMAIL: String(binds.email || ''), PHONE: String(binds.phone || ''), ID_TYPE: String(binds.id_type || ''), ID_NUMBER: String(binds.id_num || binds.id_number || ''), ADDRESS: String(binds.addr || binds.address || ''), NATIONALITY: String(binds.nat || binds.nationality || ''), CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO RESERVATIONS')) {
      RESERVATIONS.push({ RESERVATION_ID: id, GUEST_ID: Number(binds.guest_id || binds.p_guest_id || 0), ROOM_TYPE_ID: Number(binds.room_type_id || binds.type_id || 0), CHECK_IN_DATE: String(binds.check_in_date || binds.check_in || ''), CHECK_OUT_DATE: String(binds.check_out_date || binds.check_out || ''), STATUS: String(binds.status || 'PENDING'), SPECIAL_REQUESTS: String(binds.special_requests || binds.requests || ''), CREATED_BY: Number(binds.created_by || 1), CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO BOOKING_REQUESTS')) {
      const createdAt = new Date().toISOString()
      BOOKING_REQUESTS.push({ ID: id, GUEST_NAME: String(binds.guest_name || ''), GUEST_EMAIL: String(binds.guest_email || ''), GUEST_PHONE: String(binds.guest_phone || ''), ID_TYPE: String(binds.id_type || ''), ID_NUMBER: String(binds.id_number || ''), ROOM_TYPE_ID: Number(binds.room_type_id || 0), ROOM_ID: binds.room_id ? Number(binds.room_id) : null, CHECK_IN_DATE: String(binds.check_in_date || ''), CHECK_OUT_DATE: String(binds.check_out_date || ''), NUM_GUESTS: Number(binds.num_guests || 1), TOTAL_PRICE: Number(binds.total_price || 0), SPECIAL_REQUESTS: String(binds.special_requests || ''), PAYMENT_METHOD: String(binds.payment_method || ''), PROMO_CODE: String(binds.promo_code || ''), STATUS: String(binds.status || 'pending'), REJECTION_REASON: null, NOTES: String(binds.notes || ''), APPROVED_BY: null, APPROVED_AT: null, CREATED_AT: createdAt, UPDATED_AT: createdAt })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO BOOKINGS')) {
      BOOKINGS.push({ BOOKING_ID: id, RESERVATION_ID: Number(binds.reservation_id), ROOM_ID: Number(binds.room_id), CHECK_IN_DATE: String(binds.check_in_date || ''), CHECK_OUT_DATE: String(binds.check_out_date || ''), RATE_PER_NIGHT: Number(binds.rate_per_night || 0), STATUS: String(binds.status || 'ACTIVE'), CREATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO CHECKINS')) {
      CHECKINS.push({ CHECKIN_ID: id, BOOKING_ID: Number(binds.booking_id || 0), ACTUAL_CHECK_IN: now, CHECKED_IN_BY: Number(binds.checked_in_by || 1), NOTES: String(binds.notes || '') })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO CHECKOUTS')) {
      CHECKOUTS.push({ CHECKOUT_ID: id, CHECKIN_ID: Number(binds.checkin_id), ACTUAL_CHECK_OUT: now, CHECKED_OUT_BY: Number(binds.checked_out_by), NOTES: String(binds.notes || '') })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO INVOICES')) {
      INVOICES.push({ INVOICE_ID: id, BOOKING_ID: Number(binds.booking_id), GUEST_ID: Number(binds.guest_id), TOTAL_AMOUNT: 0, STATUS: 'PENDING', CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO INVOICE_ITEMS')) {
      const qty = Number(binds.quantity || 1)
      const price = Number(binds.unit_price || 0)
      INVOICE_ITEMS.push({ ITEM_ID: id, INVOICE_ID: Number(binds.invoice_id), DESCRIPTION: String(binds.description || ''), QUANTITY: qty, UNIT_PRICE: price, TOTAL: qty * price })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO PAYMENTS')) {
      PAYMENTS.push({ PAYMENT_ID: id, INVOICE_ID: Number(binds.invoice_id), AMOUNT: Number(binds.amount || 0), PAYMENT_METHOD: String(binds.payment_method || 'CASH'), PAYMENT_DATE: now, REFERENCE_NUMBER: String(binds.reference_number || ''), RECEIVED_BY: Number(binds.received_by) })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO MAINTENANCE')) {
      MAINTENANCE.push({ ID: id, ROOM_ID: Number(binds.room_id), ISSUE_TYPE: String(binds.issue_type || ''), DESCRIPTION: String(binds.description || ''), STATUS: String(binds.status || 'OPEN'), CREATED_DATE: new Date().toISOString(), ASSIGNED_TO: String(binds.assigned_to || ''), RESOLVED_DATE: null, NOTES: String(binds.notes || '') })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO STAFF')) {
      STAFF.push({ ID: id, FULL_NAME: String(binds.full_name || ''), EMAIL: String(binds.email || ''), PHONE: String(binds.phone || ''), DEPARTMENT: String(binds.department || ''), POSITION: String(binds.position || ''), SALARY: Number(binds.salary || 0), HIRE_DATE: String(binds.hire_date || ''), IS_ACTIVE: 1 })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO PAYROLL')) {
      PAYROLL.push({ ID: id, STAFF_ID: Number(binds.staff_id), MONTH: String(binds.month || ''), SALARY_PAID: Number(binds.salary_paid || 0), PAYMENT_DATE: String(binds.payment_date || '') })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO AUDIT_LOG')) {
      const performedBy = Number(binds.performed_by || 1)
      const user = USERS.find(u => u.USER_ID === performedBy)
      AUDIT_LOG.push({ ID: id, ACTION: String(binds.action || ''), ENTITY_TYPE: String(binds.entity_type || ''), ENTITY_ID: binds.entity_id ? Number(binds.entity_id) : null, PERFORMED_BY: user ? user.USERNAME : 'SYSTEM', PERFORMED_BY_ID: performedBy, PERFORMED_AT: now, DETAILS: String(binds.details || '') })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO CONTENT')) {
      const publishedAt = binds.published_at ? String(binds.published_at) : (String(binds.status || 'draft') === 'published' ? now : null)
      CONTENT.push({ ID: id, TITLE: String(binds.title || ''), TYPE: String(binds.type || 'news'), BODY: String(binds.body || ''), FEATURED_IMAGE_URL: binds.featured_image_url ? String(binds.featured_image_url) : null, STATUS: String(binds.status || 'draft'), PUBLISHED_AT: publishedAt, CREATED_BY: binds.created_by ? Number(binds.created_by) : null, CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO PROMOTIONS')) {
      PROMOTIONS.push({ ID: id, TITLE: String(binds.title || ''), DESCRIPTION: String(binds.description || ''), DISCOUNT_PCT: Number(binds.discount_pct || 0), START_DATE: String(binds.start_date || ''), END_DATE: String(binds.end_date || ''), APPLICABLE_ROOM_TYPES: String(binds.applicable_room_types || ''), STATUS: String(binds.status || 'draft'), CREATED_BY: binds.created_by ? Number(binds.created_by) : null, CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO EMAIL_TEMPLATES')) {
      EMAIL_TEMPLATES.push({ ID: id, NAME: String(binds.name || ''), SUBJECT: String(binds.subject || ''), BODY: String(binds.body || ''), TYPE: String(binds.type || 'custom'), PLACEHOLDERS: String(binds.placeholders || '[]'), IS_SYSTEM: 0, CREATED_BY: binds.created_by ? Number(binds.created_by) : null, CREATED_AT: now, UPDATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO EMAIL_CAMPAIGNS')) {
      EMAIL_CAMPAIGNS.push({ ID: id, TITLE: String(binds.title || ''), TEMPLATE_ID: binds.template_id ? Number(binds.template_id) : null, RECIPIENT_TYPE: String(binds.recipient_type || 'all_guests'), RECIPIENT_COUNT: Number(binds.recipient_count || 0), STATUS: String(binds.status || 'draft'), SCHEDULED_AT: binds.scheduled_at ? String(binds.scheduled_at) : null, SENT_AT: null, SUBJECT_OVERRIDE: binds.subject_override ? String(binds.subject_override) : null, BODY_OVERRIDE: binds.body_override ? String(binds.body_override) : null, OPEN_COUNT: 0, CLICK_COUNT: 0, CREATED_BY: binds.created_by ? Number(binds.created_by) : null, CREATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO SUBSCRIBERS')) {
      SUBSCRIBERS.push({ ID: id, EMAIL: String(binds.email || '').toLowerCase(), STATUS: String(binds.status || 'active'), SUBSCRIBED_AT: now, CREATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO EMAIL_TRACKING')) {
      const litEvent = upper.includes("'CLICK'") ? 'click' : upper.includes("'OPEN'") ? 'open' : 'open'
      EMAIL_TRACKING.push({ ID: id, CAMPAIGN_ID: Number(binds.campaign_id || 0), RECIPIENT_EMAIL: String(binds.recipient_email || '').toLowerCase(), EVENT_TYPE: String(binds.event_type || litEvent), LINK_URL: binds.link_url ? String(binds.link_url) : null, USER_AGENT: binds.user_agent ? String(binds.user_agent) : null, IP_ADDRESS: binds.ip_address ? String(binds.ip_address) : null, CREATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO AI_GENERATED_CONTENT')) {
      AI_GENERATED_CONTENT.push({ ID: id, TITLE: String(binds.title || ''), TYPE: String(binds.type || ''), ADMIN_PROMPT: String(binds.admin_prompt || ''), GENERATED_CONTENT: String(binds.generated_content || ''), FLYER_IMAGE_URL: binds.flyer_image_url ? String(binds.flyer_image_url) : null, FLYER_DATA: binds.flyer_data ? String(binds.flyer_data) : null, STATUS: String(binds.status || 'draft'), BRAND_GUIDELINES: binds.brand_guidelines ? String(binds.brand_guidelines) : null, CREATED_BY: binds.created_by ? Number(binds.created_by) : null, CREATED_AT: now, UPDATED_AT: now, APPROVED_BY: null, APPROVED_AT: null })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO AI_CONTENT_VERSIONS')) {
      AI_CONTENT_VERSIONS.push({ ID: id, CONTENT_ID: Number(binds.content_id || 0), VERSION_NUMBER: Number(binds.version_number || 1), GENERATED_CONTENT: String(binds.generated_content || ''), REASON: String(binds.reason || ''), GENERATED_BY: binds.generated_by ? Number(binds.generated_by) : null, GENERATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }
    if (upper.includes('INTO AI_CONTENT_DISTRIBUTIONS')) {
      AI_CONTENT_DISTRIBUTIONS.push({ ID: id, CONTENT_ID: Number(binds.content_id || 0), CHANNEL: String(binds.channel || ''), RECIPIENT_TYPE: binds.recipient_type ? String(binds.recipient_type) : null, RECIPIENT_COUNT: Number(binds.recipient_count || 0), STATUS: String(binds.status || 'pending'), SCHEDULED_AT: binds.scheduled_at ? String(binds.scheduled_at) : null, SENT_AT: binds.sent_at ? String(binds.sent_at) : null, ENGAGEMENT_COUNT: Number(binds.engagement_count || 0), CAMPAIGN_ID: binds.campaign_id ? Number(binds.campaign_id) : null, CREATED_BY: binds.created_by ? Number(binds.created_by) : null, CREATED_AT: now })
      return { rows: [[id]], rowsAffected: 1 }
    }

    return { rows: [[id]], rowsAffected: 1 }
  }

  private _executeUpdate(sql: string, binds: Record<string, unknown>) {
    const upper = sql.toUpperCase()

    if (upper.includes('UPDATE USERS')) {
      const boundUser = binds.username
      if (boundUser) {
        const u = USERS.find(u => u.USERNAME === String(boundUser))
        if (u) {
          if (binds.failed_login_attempts !== undefined) u.FAILED_LOGIN_ATTEMPTS = Number(binds.failed_login_attempts)
          if (binds.last_login !== undefined) u.LAST_LOGIN = String(binds.last_login)
          if (binds.password_hash) u.PASSWORD_HASH = String(binds.password_hash)
          u.UPDATED_AT = now
        }
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE ROOMS')) {
      const boundRoomId = binds.room_id || binds.p_room_id
      if (boundRoomId) {
        const r = ROOMS.find(r => r.ROOM_ID === Number(boundRoomId))
        if (r && binds.status) r.STATUS = String(binds.status)
      }
      // Handle text status values from SQL like 'OCCUPIED'
      const statusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
      if (statusMatch && !binds.status) {
        const newStatus = statusMatch[1]
        if (boundRoomId) {
          const r = ROOMS.find(r => r.ROOM_ID === Number(boundRoomId))
          if (r) r.STATUS = newStatus
        }
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE RESERVATIONS')) {
      let boundResId = binds.reservation_id || binds.p_reservation_id || binds.id
      if (boundResId) {
        const r = RESERVATIONS.find(r => r.RESERVATION_ID === Number(boundResId))
        if (r && binds.status) r.STATUS = String(binds.status)
      }
      // Handle text status values like 'CONFIRMED', 'CHECKED_IN', 'COMPLETED'
      const textStatusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
      if (textStatusMatch) {
        const newStatus = textStatusMatch[1]
        if (boundResId) {
          const r = RESERVATIONS.find(r => r.RESERVATION_ID === Number(boundResId))
          if (r) r.STATUS = newStatus
        }
        // Also try WHERE RESERVATION_ID = :id
        if (!boundResId && binds.id) {
          const r = RESERVATIONS.find(r => r.RESERVATION_ID === Number(binds.id))
          if (r) r.STATUS = newStatus
        }
      }
      // Handle subquery: UPDATE RESERVATIONS WHERE RESERVATION_ID = (SELECT ... FROM BOOKINGS WHERE BOOKING_ID = :booking_id)
      const bookingIdMatch = upper.match(/BOOKING_ID\s*=\s*:BOOKING_ID/)
      if (bookingIdMatch && binds.booking_id) {
        const booking = BOOKINGS.find(b => b.BOOKING_ID === Number(binds.booking_id))
        if (booking) {
          const r = RESERVATIONS.find(r => r.RESERVATION_ID === booking.RESERVATION_ID)
          if (r) {
            const statusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
            if (statusMatch) r.STATUS = statusMatch[1]
          }
        }
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE BOOKINGS')) {
      const boundBookingId = binds.booking_id
      if (boundBookingId) {
        const b = BOOKINGS.find(b => b.BOOKING_ID === Number(boundBookingId))
        if (b && binds.status) b.STATUS = String(binds.status)
        if (b && binds.room_id !== undefined) b.ROOM_ID = Number(binds.room_id)
      }
      // Handle text status values
      const statusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
      if (statusMatch && !binds.status && binds.booking_id) {
        const b = BOOKINGS.find(b => b.BOOKING_ID === Number(binds.booking_id))
        if (b) b.STATUS = statusMatch[1]
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE MAINTENANCE')) {
      const boundId = binds.id || binds.p_id
      if (boundId) {
        const m = MAINTENANCE.find(m => m.ID === Number(boundId))
        if (m) {
          if (binds.status) m.STATUS = String(binds.status)
          if (binds.notes) m.NOTES = String(binds.notes)
          if (binds.resolved_date) m.RESOLVED_DATE = String(binds.resolved_date)
          if (binds.assigned_to) m.ASSIGNED_TO = String(binds.assigned_to)
        }
      }
      const statusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
      if (statusMatch && !binds.status && boundId) {
        const m = MAINTENANCE.find(m => m.ID === Number(boundId))
        if (m) m.STATUS = statusMatch[1]
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE BOOKING_REQUESTS')) {
      const boundId = binds.id || binds.request_id
      const target = boundId ? BOOKING_REQUESTS.find(r => r.ID === Number(boundId)) : null
      if (target) {
        if (binds.status) target.STATUS = String(binds.status)
        else {
          const statusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
          if (statusMatch) target.STATUS = statusMatch[1].toLowerCase()
        }
        if (binds.approved_by !== undefined && binds.approved_by !== null) target.APPROVED_BY = Number(binds.approved_by)
        if (binds.approved_at !== undefined && binds.approved_at !== null) target.APPROVED_AT = binds.approved_at instanceof Date ? binds.approved_at.toISOString() : String(binds.approved_at)
        if (binds.rejection_reason !== undefined) target.REJECTION_REASON = binds.rejection_reason === null ? null : String(binds.rejection_reason)
        if (binds.notes !== undefined) target.NOTES = binds.notes === null ? '' : String(binds.notes)
        if (binds.room_id !== undefined) target.ROOM_ID = binds.room_id === null ? null : Number(binds.room_id)
        target.UPDATED_AT = now
      }
      return { rowsAffected: target ? 1 : 0 }
    }
    if (upper.includes('UPDATE STAFF')) {
      const boundId = binds.id || binds.p_id
      if (boundId) {
        const s = STAFF.find(s => s.ID === Number(boundId))
        if (s) {
          if (binds.full_name) s.FULL_NAME = String(binds.full_name)
          if (binds.email) s.EMAIL = String(binds.email)
          if (binds.phone) s.PHONE = String(binds.phone)
          if (binds.department) s.DEPARTMENT = String(binds.department)
          if (binds.position) s.POSITION = String(binds.position)
          if (binds.salary !== undefined) s.SALARY = Number(binds.salary)
          if (binds.is_active !== undefined) s.IS_ACTIVE = Number(binds.is_active)
        }
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE SYSTEM_SETTINGS')) {
      if (binds.setting_key) {
        const s = SETTINGS.find(s => s.SETTING_KEY === String(binds.setting_key))
        if (s) {
          if (binds.setting_value !== undefined) s.SETTING_VALUE = String(binds.setting_value)
          s.UPDATED_AT = now
          if (binds.updated_by) s.UPDATED_BY = Number(binds.updated_by)
        }
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE USERS') && binds.p_user_id) {
      const boundUserId = Number(binds.p_user_id)
      if (boundUserId) {
        const u = USERS.find(u => u.USER_ID === boundUserId)
        if (u && binds.role_id !== undefined) u.ROLE_ID = Number(binds.role_id)
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE INVOICES')) {
      const boundInvId = binds.invoice_id || binds.p_invoice_id
      if (boundInvId) {
        const inv = INVOICES.find(i => i.INVOICE_ID === Number(boundInvId))
        if (inv) {
          if (binds.total_amount !== undefined) inv.TOTAL_AMOUNT = Number(binds.total_amount)
          if (binds.status) inv.STATUS = String(binds.status)
          inv.UPDATED_AT = now
        }
      }
      const statusMatch = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
      if (statusMatch && !binds.status && boundInvId) {
        const inv = INVOICES.find(i => i.INVOICE_ID === Number(boundInvId))
        if (inv) {
          inv.STATUS = statusMatch[1]
          inv.UPDATED_AT = now
        }
      }
      return { rowsAffected: 1 }
    }

    if (upper.includes('UPDATE CONTENT')) {
      const boundId = binds.id || binds.p_id
      const target = boundId ? CONTENT.find(c => c.ID === Number(boundId)) : null
      if (target) {
        if (binds.title !== undefined) target.TITLE = String(binds.title)
        if (binds.type !== undefined) target.TYPE = String(binds.type)
        if (binds.body !== undefined) target.BODY = String(binds.body)
        if (binds.featured_image_url !== undefined) target.FEATURED_IMAGE_URL = binds.featured_image_url === null ? null : String(binds.featured_image_url)
        if (binds.status !== undefined) {
          target.STATUS = String(binds.status)
        } else {
          const lit = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
          if (lit) target.STATUS = lit[1].toLowerCase()
        }
        if (target.STATUS === 'published' && !target.PUBLISHED_AT) target.PUBLISHED_AT = now
        target.UPDATED_AT = now
      }
      return { rowsAffected: target ? 1 : 0 }
    }
    if (upper.includes('UPDATE PROMOTIONS')) {
      const boundId = binds.id || binds.p_id
      const target = boundId ? PROMOTIONS.find(p => p.ID === Number(boundId)) : null
      if (target) {
        if (binds.title !== undefined) target.TITLE = String(binds.title)
        if (binds.description !== undefined) target.DESCRIPTION = String(binds.description)
        if (binds.discount_pct !== undefined) target.DISCOUNT_PCT = Number(binds.discount_pct)
        if (binds.start_date !== undefined) target.START_DATE = String(binds.start_date)
        if (binds.end_date !== undefined) target.END_DATE = String(binds.end_date)
        if (binds.applicable_room_types !== undefined) target.APPLICABLE_ROOM_TYPES = String(binds.applicable_room_types)
        if (binds.status !== undefined) {
          target.STATUS = String(binds.status)
        } else {
          const lit = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
          if (lit) target.STATUS = lit[1].toLowerCase()
        }
        target.UPDATED_AT = now
      }
      return { rowsAffected: target ? 1 : 0 }
    }
    if (upper.includes('UPDATE EMAIL_TEMPLATES')) {
      const boundId = binds.id || binds.p_id
      const target = boundId ? EMAIL_TEMPLATES.find(t => t.ID === Number(boundId)) : null
      if (target) {
        if (binds.name !== undefined) target.NAME = String(binds.name)
        if (binds.subject !== undefined) target.SUBJECT = String(binds.subject)
        if (binds.body !== undefined) target.BODY = String(binds.body)
        if (binds.type !== undefined) target.TYPE = String(binds.type)
        if (binds.placeholders !== undefined) target.PLACEHOLDERS = String(binds.placeholders)
        target.UPDATED_AT = now
      }
      return { rowsAffected: target ? 1 : 0 }
    }
    if (upper.includes('UPDATE EMAIL_CAMPAIGNS')) {
      const boundId = binds.id || binds.campaign_id || binds.p_id
      const target = boundId ? EMAIL_CAMPAIGNS.find(c => c.ID === Number(boundId)) : null
      if (target) {
        if (binds.status !== undefined) {
          target.STATUS = String(binds.status)
        } else {
          const lit = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
          if (lit) target.STATUS = lit[1].toLowerCase()
        }
        if (target.STATUS === 'sent' && !target.SENT_AT) target.SENT_AT = now
        if (binds.scheduled_at !== undefined) target.SCHEDULED_AT = binds.scheduled_at === null ? null : String(binds.scheduled_at)
        if (binds.recipient_count !== undefined) target.RECIPIENT_COUNT = Number(binds.recipient_count)
        if (binds.subject_override !== undefined) target.SUBJECT_OVERRIDE = binds.subject_override === null ? null : String(binds.subject_override)
        if (binds.body_override !== undefined) target.BODY_OVERRIDE = binds.body_override === null ? null : String(binds.body_override)
        if (binds.open_count !== undefined) target.OPEN_COUNT = Number(binds.open_count)
        if (binds.click_count !== undefined) target.CLICK_COUNT = Number(binds.click_count)
      }
      return { rowsAffected: target ? 1 : 0 }
    }
    if (upper.includes('UPDATE SUBSCRIBERS')) {
      if (binds.email) {
        const target = SUBSCRIBERS.find(s => s.EMAIL === String(binds.email).toLowerCase())
        if (target) {
          if (binds.status) {
            target.STATUS = String(binds.status)
          } else {
            const lit = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
            if (lit) target.STATUS = lit[1].toLowerCase()
          }
        }
      }
      return { rowsAffected: 1 }
    }
    if (upper.includes('UPDATE AI_GENERATED_CONTENT')) {
      const boundId = binds.id || binds.content_id || binds.p_id
      const target = boundId ? AI_GENERATED_CONTENT.find(c => c.ID === Number(boundId)) : null
      if (target) {
        if (binds.title !== undefined) target.TITLE = String(binds.title)
        if (binds.type !== undefined) target.TYPE = String(binds.type)
        if (binds.admin_prompt !== undefined) target.ADMIN_PROMPT = String(binds.admin_prompt)
        if (binds.generated_content !== undefined) target.GENERATED_CONTENT = String(binds.generated_content)
        if (binds.flyer_image_url !== undefined) target.FLYER_IMAGE_URL = binds.flyer_image_url === null ? null : String(binds.flyer_image_url)
        if (binds.flyer_data !== undefined) target.FLYER_DATA = binds.flyer_data === null ? null : String(binds.flyer_data)
        if (binds.brand_guidelines !== undefined) target.BRAND_GUIDELINES = binds.brand_guidelines === null ? null : String(binds.brand_guidelines)
        if (binds.status !== undefined) {
          target.STATUS = String(binds.status)
        } else {
          const lit = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
          if (lit) target.STATUS = lit[1].toLowerCase()
        }
        if (binds.approved_by !== undefined) target.APPROVED_BY = binds.approved_by === null ? null : Number(binds.approved_by)
        if (binds.approved_at !== undefined) {
          target.APPROVED_AT = binds.approved_at === null ? null : String(binds.approved_at)
        } else if (target.STATUS === 'approved' && target.APPROVED_BY && !target.APPROVED_AT) {
          target.APPROVED_AT = now
        }
        target.UPDATED_AT = now
      }
      return { rowsAffected: target ? 1 : 0 }
    }
    if (upper.includes('UPDATE AI_CONTENT_DISTRIBUTIONS')) {
      const boundId = binds.id || binds.distribution_id || binds.p_id
      const target = boundId ? AI_CONTENT_DISTRIBUTIONS.find(d => d.ID === Number(boundId)) : null
      if (target) {
        if (binds.status !== undefined) {
          target.STATUS = String(binds.status)
        } else {
          const lit = upper.match(/SET\s+STATUS\s*=\s*'(\w+)'/)
          if (lit) target.STATUS = lit[1].toLowerCase()
        }
        if (target.STATUS === 'sent' && !target.SENT_AT) target.SENT_AT = now
        if (binds.sent_at !== undefined) target.SENT_AT = binds.sent_at === null ? null : String(binds.sent_at)
        if (binds.scheduled_at !== undefined) target.SCHEDULED_AT = binds.scheduled_at === null ? null : String(binds.scheduled_at)
        if (binds.recipient_count !== undefined) target.RECIPIENT_COUNT = Number(binds.recipient_count)
        if (binds.engagement_count !== undefined) target.ENGAGEMENT_COUNT = Number(binds.engagement_count)
        if (binds.campaign_id !== undefined) target.CAMPAIGN_ID = binds.campaign_id === null ? null : Number(binds.campaign_id)
        if (binds.recipient_type !== undefined) target.RECIPIENT_TYPE = binds.recipient_type === null ? null : String(binds.recipient_type)
      }
      return { rowsAffected: target ? 1 : 0 }
    }

    return { rowsAffected: 1 }
  }

  private _executeDelete(sql: string, binds: Record<string, unknown>) {
    const upper = sql.toUpperCase()
    const tableMatch = upper.match(/DELETE\s+FROM\s+(\w+)/)
    if (!tableMatch) return { rowsAffected: 0 }
    const table = tableMatch[1]

    if (table === 'EMAIL_TRACKING') {
      const boundCampaign = binds.campaign_id
      if (boundCampaign) {
        const before = EMAIL_TRACKING.length
        for (let i = EMAIL_TRACKING.length - 1; i >= 0; i--) {
          if (EMAIL_TRACKING[i].CAMPAIGN_ID === Number(boundCampaign)) EMAIL_TRACKING.splice(i, 1)
        }
        return { rowsAffected: before - EMAIL_TRACKING.length }
      }
      return { rowsAffected: 0 }
    }

    const boundId = binds.id || binds.p_id
    if (!boundId) return { rowsAffected: 0 }
    const idNum = Number(boundId)
    const tables: { name: string; rows: { ID: number }[] }[] = [
      { name: 'CONTENT', rows: CONTENT as unknown as { ID: number }[] },
      { name: 'PROMOTIONS', rows: PROMOTIONS as unknown as { ID: number }[] },
      { name: 'EMAIL_TEMPLATES', rows: EMAIL_TEMPLATES as unknown as { ID: number }[] },
      { name: 'EMAIL_CAMPAIGNS', rows: EMAIL_CAMPAIGNS as unknown as { ID: number }[] },
      { name: 'SUBSCRIBERS', rows: SUBSCRIBERS as unknown as { ID: number }[] },
      { name: 'AI_GENERATED_CONTENT', rows: AI_GENERATED_CONTENT as unknown as { ID: number }[] },
      { name: 'AI_CONTENT_VERSIONS', rows: AI_CONTENT_VERSIONS as unknown as { ID: number }[] },
      { name: 'AI_CONTENT_DISTRIBUTIONS', rows: AI_CONTENT_DISTRIBUTIONS as unknown as { ID: number }[] },
    ]
    const found = tables.find(t => t.name === table)
    if (!found) return { rowsAffected: 0 }
    const idx = found.rows.findIndex(r => r.ID === idNum)
    if (idx >= 0) {
      found.rows.splice(idx, 1)
      if (table === 'AI_GENERATED_CONTENT') {
        for (let i = AI_CONTENT_VERSIONS.length - 1; i >= 0; i--) {
          if (AI_CONTENT_VERSIONS[i].CONTENT_ID === idNum) AI_CONTENT_VERSIONS.splice(i, 1)
        }
        for (let i = AI_CONTENT_DISTRIBUTIONS.length - 1; i >= 0; i--) {
          if (AI_CONTENT_DISTRIBUTIONS[i].CONTENT_ID === idNum) AI_CONTENT_DISTRIBUTIONS.splice(i, 1)
        }
      }
      return { rowsAffected: 1 }
    }
    return { rowsAffected: 0 }
  }

  async close() {}
}

// --- Mock Pool ---
class MockPool {
  async getConnection() {
    return new MockConnection()
  }
  async close() {}
}

export function getMockPool(): MockPool {
  return new MockPool()
}
