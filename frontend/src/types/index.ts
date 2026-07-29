export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'MANAGER'

export interface User {
  user_id: number
  username: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'

export interface RoomType {
  type_id: number
  type_name: string
  description: string
  base_price: number
  max_occupancy: number
}

export interface Room {
  room_id: number
  room_number: string
  type: RoomType
  floor: number
  status: RoomStatus
  description: string
}

export interface Guest {
  guest_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  id_type: string
  id_number: string
  address: string
  nationality: string
  created_at: string
}

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'CHECKED_IN'
  | 'COMPLETED'

export interface Reservation {
  reservation_id: number
  guest: Guest
  room_type: RoomType
  check_in_date: string
  check_out_date: string
  status: ReservationStatus
  special_requests: string
  created_by: User
  created_at: string
}

export type BookingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface Booking {
  booking_id: number
  reservation_id: number
  room_id: number
  check_in_date: string
  check_out_date: string
  rate_per_night: number
  status: BookingStatus
  created_at: string
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER'

export interface Invoice {
  invoice_id: number
  booking: Booking
  guest: Guest
  total_amount: number
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED'
  items: InvoiceItem[]
  payments: Payment[]
  created_at: string
}

export interface InvoiceItem {
  item_id: number
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Payment {
  payment_id: number
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  todayArrivals: number
  todayDepartures: number
  occupancyRate: number
  todayRevenue: number
}

export interface CheckinRecord {
  CHECKIN_ID: number
  BOOKING_ID: number
  ACTUAL_CHECK_IN: string
  CHECKED_IN_BY: number
  NOTES: string
  ROOM_ID: number
  CHECK_IN_DATE: string
  CHECK_OUT_DATE: string
  RATE_PER_NIGHT: number
  RESERVATION_ID: number
  GUEST_ID: number
  ROOM_TYPE_ID: number
  RESERVATION_STATUS: string
  FIRST_NAME: string
  LAST_NAME: string
  EMAIL: string
  PHONE: string
  ROOM_NUMBER: string
  FLOOR: number
  ROOM_STATUS: string
}

export interface CheckoutRecord {
  CHECKOUT_ID: number
  CHECKIN_ID: number
  ACTUAL_CHECK_OUT: string
  CHECKED_OUT_BY: number
  NOTES: string
  BOOKING_ID: number
  ACTUAL_CHECK_IN: string
  ROOM_ID: number
  CHECK_IN_DATE: string
  CHECK_OUT_DATE: string
  RATE_PER_NIGHT: number
  RESERVATION_ID: number
  GUEST_ID: number
  ROOM_TYPE_ID: number
  FIRST_NAME: string
  LAST_NAME: string
  EMAIL: string
  PHONE: string
  ROOM_NUMBER: string
  FLOOR: number
}

export interface RoomListItem {
  ROOM_ID: number
  ROOM_NUMBER: string
  TYPE_ID: number
  FLOOR: number
  STATUS: string
  DESCRIPTION: string
}

export interface GuestListItem {
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

export interface ReservationListItem {
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

// --- Billing ---
export interface InvoiceListItem {
  invoice_id: number
  booking_id: number
  guest_id: number
  total_amount: number
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED'
  created_at: string
}

export interface InvoiceDetail {
  invoice: Invoice
  items: InvoiceItem[]
  payments: Payment[]
}

export interface InvoiceBalance {
  invoice_id: number
  total_amount: number
  total_paid: number
  balance: number
}

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
  payment_method: PaymentMethod
  reference_number?: string
}

// --- Maintenance ---
export interface MaintenanceRecord {
  id: number
  room_id: number
  room_number: string
  issue_type: string
  description: string
  status: string
  created_date: string
  assigned_to: string
  resolved_date: string | null
  notes: string
}

// --- Housekeeping ---
export interface HousekeepingTask {
  booking_id: number
  room_id: number
  room_number: string
  check_out_date: string
  guest_name: string
  assigned_staff: string
}

// --- Staff ---
export interface StaffMember {
  id: number
  full_name: string
  email: string
  phone: string
  department: string
  position: string
  salary: number
  hire_date: string
  is_active: number
}

export interface PayrollRecord {
  id: number
  staff_id: number
  month: string
  salary_paid: number
  payment_date: string
}

// --- Reports ---
export interface ReportSummary {
  totalRooms: number
  occupiedRooms: number
  occupancyRate: number
  totalGuests: number
  totalReservations: number
  completedBookings: number
  totalRevenue: number
  avgRatePerNight: number
  avgStayLength: number
}

export interface MonthlyOccupancy {
  month: string
  rate: number
}

export interface MonthlyRevenue {
  month: string
  amount: number
}

export interface RoomTypeReport {
  type_name: string
  bookings: number
  revenue: number
  avg_rate: number
}

export interface PopularGuest {
  guest_id: number
  first_name: string
  last_name: string
  total_stays: number
  total_spend: number
}
