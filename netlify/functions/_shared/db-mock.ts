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
  { ID: 1, ACTION: 'LOGIN', ENTITY_TYPE: 'USER', ENTITY_ID: 1, PERFORMED_BY: 1, PERFORMED_AT: '2026-07-29T08:00:00', DETAILS: 'User admin logged in' },
  { ID: 2, ACTION: 'CREATE', ENTITY_TYPE: 'ROOM', ENTITY_ID: 15, PERFORMED_BY: 1, PERFORMED_AT: '2026-07-29T08:30:00', DETAILS: 'Created room 701' },
  { ID: 3, ACTION: 'UPDATE', ENTITY_TYPE: 'RESERVATION', ENTITY_ID: 3, PERFORMED_BY: 2, PERFORMED_AT: '2026-07-29T09:15:00', DETAILS: 'Updated reservation #3 - changed dates' },
  { ID: 4, ACTION: 'CHECKIN', ENTITY_TYPE: 'BOOKING', ENTITY_ID: 2, PERFORMED_BY: 2, PERFORMED_AT: '2026-07-29T10:00:00', DETAILS: 'Checked in booking #2' },
  { ID: 5, ACTION: 'PAYMENT', ENTITY_TYPE: 'INVOICE', ENTITY_ID: 1, PERFORMED_BY: 2, PERFORMED_AT: '2026-07-29T10:30:00', DETAILS: 'Recorded payment of $290 on invoice #1' },
  { ID: 6, ACTION: 'CREATE', ENTITY_TYPE: 'GUEST', ENTITY_ID: 5, PERFORMED_BY: 2, PERFORMED_AT: '2026-07-28T14:00:00', DETAILS: 'Created guest record for Alex Brown' },
  { ID: 7, ACTION: 'LOGOUT', ENTITY_TYPE: 'USER', ENTITY_ID: 2, PERFORMED_BY: 2, PERFORMED_AT: '2026-07-28T18:00:00', DETAILS: 'User reception1 logged out' },
  { ID: 8, ACTION: 'UPDATE', ENTITY_TYPE: 'SETTINGS', ENTITY_ID: null, PERFORMED_BY: 1, PERFORMED_AT: '2026-07-27T12:00:00', DETAILS: 'Updated hotel settings' },
  { ID: 9, ACTION: 'CREATE', ENTITY_TYPE: 'MAINTENANCE', ENTITY_ID: 3, PERFORMED_BY: 3, PERFORMED_AT: '2026-07-28T14:15:00', DETAILS: 'Reported HVAC issue in room 302' },
  { ID: 10, ACTION: 'LOGIN', ENTITY_TYPE: 'USER', ENTITY_ID: 3, PERFORMED_BY: 3, PERFORMED_AT: '2026-07-29T07:45:00', DETAILS: 'User manager1 logged in' },
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
      if (binds.search) {
        const q = String(binds.search).toUpperCase()
        filtered = filtered.filter(g =>
          g.FIRST_NAME.toUpperCase().includes(q) ||
          g.LAST_NAME.toUpperCase().includes(q) ||
          g.EMAIL.toUpperCase().includes(q) ||
          g.PHONE.includes(q)
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
      rows = filtered.map(a => [a.ID, a.ACTION, a.ENTITY_TYPE, a.ENTITY_ID, a.PERFORMED_BY, a.PERFORMED_AT, a.DETAILS])
    }

    return { rows, metaData: rows.length > 0 ? rows[0].map(() => ({})) : [] }
  }

  private _executeInsert(sql: string, binds: Record<string, unknown>) {
    const upper = sql.toUpperCase()
    const id = genId()

    if (upper.includes('INTO USERS')) {
      USERS.push({ USER_ID: id, USERNAME: String(binds.username || ''), PASSWORD_HASH: String(binds.password_hash || ''), FULL_NAME: String(binds.full_name || ''), EMAIL: String(binds.email || ''), ROLE_ID: Number(binds.role_id || 2), IS_ACTIVE: 1, FAILED_LOGIN_ATTEMPTS: 0, LAST_LOGIN: null, CREATED_AT: now, UPDATED_AT: now })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO ROOMS')) {
      ROOMS.push({ ROOM_ID: id, ROOM_NUMBER: String(binds.room_number || ''), TYPE_ID: Number(binds.type_id || 1), FLOOR: Number(binds.floor || 1), STATUS: String(binds.status || 'AVAILABLE'), DESCRIPTION: String(binds.description || '') })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO GUESTS')) {
      GUESTS.push({ GUEST_ID: id, FIRST_NAME: String(binds.first_name || ''), LAST_NAME: String(binds.last_name || ''), EMAIL: String(binds.email || ''), PHONE: String(binds.phone || ''), ID_TYPE: String(binds.id_type || ''), ID_NUMBER: String(binds.id_number || ''), ADDRESS: String(binds.address || ''), NATIONALITY: String(binds.nationality || ''), CREATED_AT: now, UPDATED_AT: now })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO RESERVATIONS')) {
      RESERVATIONS.push({ RESERVATION_ID: id, GUEST_ID: Number(binds.guest_id), ROOM_TYPE_ID: Number(binds.room_type_id), CHECK_IN_DATE: String(binds.check_in_date || ''), CHECK_OUT_DATE: String(binds.check_out_date || ''), STATUS: String(binds.status || 'PENDING'), SPECIAL_REQUESTS: String(binds.special_requests || ''), CREATED_BY: Number(binds.created_by), CREATED_AT: now, UPDATED_AT: now })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO BOOKINGS')) {
      BOOKINGS.push({ BOOKING_ID: id, RESERVATION_ID: Number(binds.reservation_id), ROOM_ID: Number(binds.room_id), CHECK_IN_DATE: String(binds.check_in_date || ''), CHECK_OUT_DATE: String(binds.check_out_date || ''), RATE_PER_NIGHT: Number(binds.rate_per_night || 0), STATUS: String(binds.status || 'ACTIVE'), CREATED_AT: now })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO CHECKINS')) {
      CHECKINS.push({ CHECKIN_ID: id, BOOKING_ID: Number(binds.booking_id), ACTUAL_CHECK_IN: now, CHECKED_IN_BY: Number(binds.checked_in_by), NOTES: String(binds.notes || '') })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO CHECKOUTS')) {
      CHECKOUTS.push({ CHECKOUT_ID: id, CHECKIN_ID: Number(binds.checkin_id), ACTUAL_CHECK_OUT: now, CHECKED_OUT_BY: Number(binds.checked_out_by), NOTES: String(binds.notes || '') })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO INVOICES')) {
      INVOICES.push({ INVOICE_ID: id, BOOKING_ID: Number(binds.booking_id), GUEST_ID: Number(binds.guest_id), TOTAL_AMOUNT: 0, STATUS: 'PENDING', CREATED_AT: now, UPDATED_AT: now })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO INVOICE_ITEMS')) {
      const qty = Number(binds.quantity || 1)
      const price = Number(binds.unit_price || 0)
      INVOICE_ITEMS.push({ ITEM_ID: id, INVOICE_ID: Number(binds.invoice_id), DESCRIPTION: String(binds.description || ''), QUANTITY: qty, UNIT_PRICE: price, TOTAL: qty * price })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO PAYMENTS')) {
      PAYMENTS.push({ PAYMENT_ID: id, INVOICE_ID: Number(binds.invoice_id), AMOUNT: Number(binds.amount || 0), PAYMENT_METHOD: String(binds.payment_method || 'CASH'), PAYMENT_DATE: now, REFERENCE_NUMBER: String(binds.reference_number || ''), RECEIVED_BY: Number(binds.received_by) })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO MAINTENANCE')) {
      MAINTENANCE.push({ ID: id, ROOM_ID: Number(binds.room_id), ISSUE_TYPE: String(binds.issue_type || ''), DESCRIPTION: String(binds.description || ''), STATUS: String(binds.status || 'OPEN'), CREATED_DATE: new Date().toISOString(), ASSIGNED_TO: String(binds.assigned_to || ''), RESOLVED_DATE: null, NOTES: String(binds.notes || '') })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO STAFF')) {
      STAFF.push({ ID: id, FULL_NAME: String(binds.full_name || ''), EMAIL: String(binds.email || ''), PHONE: String(binds.phone || ''), DEPARTMENT: String(binds.department || ''), POSITION: String(binds.position || ''), SALARY: Number(binds.salary || 0), HIRE_DATE: String(binds.hire_date || ''), IS_ACTIVE: 1 })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO PAYROLL')) {
      PAYROLL.push({ ID: id, STAFF_ID: Number(binds.staff_id), MONTH: String(binds.month || ''), SALARY_PAID: Number(binds.salary_paid || 0), PAYMENT_DATE: String(binds.payment_date || '') })
      return { rowsAffected: 1, lastRowid: id }
    }
    if (upper.includes('INTO AUDIT_LOG')) {
      AUDIT_LOG.push({ ID: id, ACTION: String(binds.action || ''), ENTITY_TYPE: String(binds.entity_type || ''), ENTITY_ID: binds.entity_id ? Number(binds.entity_id) : null, PERFORMED_BY: Number(binds.performed_by || 1), PERFORMED_AT: now, DETAILS: String(binds.details || '') })
      return { rowsAffected: 1, lastRowid: id }
    }

    return { rowsAffected: 1, lastRowid: id }
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
      const boundResId = binds.reservation_id || binds.p_reservation_id
      if (boundResId) {
        const r = RESERVATIONS.find(r => r.RESERVATION_ID === Number(boundResId))
        if (r && binds.status) r.STATUS = String(binds.status)
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

    return { rowsAffected: 1 }
  }

  private _executeDelete(sql: string, binds: Record<string, unknown>) {
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
