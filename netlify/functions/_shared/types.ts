export interface Env {
  ORACLE_USER: string
  ORACLE_PASSWORD: string
  ORACLE_HOST: string
  ORACLE_PORT: string
  ORACLE_SERVICE_NAME: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  APP_URL: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface CreateRoomRequest {
  room_number: string
  type_id: number
  floor: number
  description?: string
}

export interface CreateGuestRequest {
  first_name: string
  last_name: string
  email: string
  phone: string
  id_type: string
  id_number: string
  address?: string
  nationality?: string
}

export interface CreateReservationRequest {
  guest_id: number
  room_type_id: number
  check_in_date: string
  check_out_date: string
  special_requests?: string
}

export interface ProcessCheckInRequest {
  booking_id: number
  room_id: number
  notes?: string
}

export interface ProcessCheckOutRequest {
  checkin_id: number
  notes?: string
}

export interface CreateInvoiceRequest {
  booking_id: number
  items: {
    description: string
    quantity: number
    unit_price: number
  }[]
}

export interface RecordPaymentRequest {
  invoice_id: number
  amount: number
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER'
  reference_number?: string
}
