// ============================================================
// Backend Type Definitions
// ============================================================

// --- Environment ---
export interface Env {
  DB_MODE: string
  ORACLE_USER: string
  ORACLE_PASSWORD: string
  ORACLE_HOST: string
  ORACLE_PORT: string
  ORACLE_SERVICE_NAME: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  APP_URL: string
}

// --- DB Entity Types (match Oracle column order) ---
export interface DbUser {
  USER_ID: number
  USERNAME: string
  PASSWORD_HASH: string
  FULL_NAME: string
  EMAIL: string
  ROLE_ID: number
  IS_ACTIVE: number
  FAILED_LOGIN_ATTEMPTS: number
  LAST_LOGIN: string | null
  CREATED_AT: string
  UPDATED_AT: string
}

export interface DbRole {
  ROLE_ID: number
  ROLE_NAME: string
  DESCRIPTION: string
}

export interface DbRoomType {
  TYPE_ID: number
  TYPE_NAME: string
  DESCRIPTION: string
  BASE_PRICE: number
  MAX_OCCUPANCY: number
}

export interface DbRoom {
  ROOM_ID: number
  ROOM_NUMBER: string
  TYPE_ID: number
  FLOOR: number
  STATUS: string
  DESCRIPTION: string
}

export interface DbGuest {
  GUEST_ID: number
  FIRST_NAME: string
  LAST_NAME: string
  EMAIL: string
  PHONE: string
  ID_TYPE: string
  ID_NUMBER: string
  ADDRESS: string
  NATIONALITY: string
  CREATED_AT: string
  UPDATED_AT: string
}

export interface DbReservation {
  RESERVATION_ID: number
  GUEST_ID: number
  ROOM_TYPE_ID: number
  CHECK_IN_DATE: string
  CHECK_OUT_DATE: string
  STATUS: string
  SPECIAL_REQUESTS: string
  CREATED_BY: number
  CREATED_AT: string
  UPDATED_AT: string
}

export interface DbBooking {
  BOOKING_ID: number
  RESERVATION_ID: number
  ROOM_ID: number
  CHECK_IN_DATE: string
  CHECK_OUT_DATE: string
  RATE_PER_NIGHT: number
  STATUS: string
  CREATED_AT: string
}

export interface DbCheckin {
  CHECKIN_ID: number
  BOOKING_ID: number
  ACTUAL_CHECK_IN: string
  CHECKED_IN_BY: number
  NOTES: string
}

export interface DbCheckout {
  CHECKOUT_ID: number
  CHECKIN_ID: number
  ACTUAL_CHECK_OUT: string
  CHECKED_OUT_BY: number
  NOTES: string
}

export interface DbInvoice {
  INVOICE_ID: number
  BOOKING_ID: number
  GUEST_ID: number
  TOTAL_AMOUNT: number
  STATUS: string
  CREATED_AT: string
  UPDATED_AT: string
}

export interface DbInvoiceItem {
  ITEM_ID: number
  INVOICE_ID: number
  DESCRIPTION: string
  QUANTITY: number
  UNIT_PRICE: number
  TOTAL: number
}

export interface DbPayment {
  PAYMENT_ID: number
  INVOICE_ID: number
  AMOUNT: number
  PAYMENT_METHOD: string
  PAYMENT_DATE: string
  REFERENCE_NUMBER: string
  RECEIVED_BY: number
}

// --- Auth ---
export interface LoginRequest {
  username: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// --- Rooms ---
export interface CreateRoomRequest {
  room_number: string
  type_id: number
  floor: number
  description?: string
}

export interface UpdateRoomRequest {
  room_number?: string
  type_id?: number
  floor?: number
  description?: string
}

export interface UpdateRoomStatusRequest {
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
}

export interface RoomListParams {
  status?: string
  type_id?: number
  floor?: number
  search?: string
  page?: number
  pageSize?: number
}

// --- Guests ---
export interface CreateGuestRequest {
  first_name: string
  last_name: string
  email?: string
  phone: string
  id_type: string
  id_number: string
  address?: string
  nationality?: string
}

export interface UpdateGuestRequest {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  id_type?: string
  id_number?: string
  address?: string
  nationality?: string
}

export interface GuestListParams {
  search?: string
  nationality?: string
  page?: number
  pageSize?: number
}

// --- Reservations ---
export interface CreateReservationRequest {
  guest_id: number
  room_type_id: number
  check_in_date: string
  check_out_date: string
  special_requests?: string
}

export interface UpdateReservationRequest {
  check_in_date?: string
  check_out_date?: string
  room_type_id?: number
  special_requests?: string
}

export interface ReservationListParams {
  status?: string
  guest_id?: number
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface AvailabilityParams {
  check_in: string
  check_out: string
  room_type: number
}

// --- Check-in / Check-out ---
export interface ProcessCheckInRequest {
  booking_id: number
  room_id: number
  notes?: string
}

export interface ProcessCheckOutRequest {
  checkin_id: number
  notes?: string
}

// --- Billing ---
export interface CreateInvoiceRequest {
  booking_id: number
}

export interface AddInvoiceItemRequest {
  description: string
  quantity: number
  unit_price: number
}

export interface RecordPaymentRequest {
  amount: number
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER'
  reference_number?: string
}
