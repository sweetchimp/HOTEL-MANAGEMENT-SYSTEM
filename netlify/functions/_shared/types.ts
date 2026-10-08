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

export interface DbBookingRequest {
  ID: number
  GUEST_NAME: string
  GUEST_EMAIL: string
  GUEST_PHONE: string
  ID_TYPE: string
  ID_NUMBER: string
  ROOM_TYPE_ID: number
  ROOM_ID: number | null
  CHECK_IN_DATE: string
  CHECK_OUT_DATE: string
  NUM_GUESTS: number
  TOTAL_PRICE: number
  SPECIAL_REQUESTS: string | null
  PAYMENT_METHOD: string | null
  PROMO_CODE: string | null
  STATUS: string
  REJECTION_REASON: string | null
  NOTES: string | null
  APPROVED_BY: number | null
  APPROVED_AT: string | null
  CREATED_AT: string
  UPDATED_AT: string
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

// --- Public Booking (Phase 5) ---
export interface PublicBookingRequest {
  guest_name: string
  guest_email: string
  guest_phone: string
  id_type: string
  id_number: string
  room_type_id: number
  room_id?: number | null
  check_in_date: string
  check_out_date: string
  num_guests: number
  special_requests?: string
  payment_method?: string
  promo?: string
}

export interface BookingRequestListParams {
  status?: string
  search?: string
  from?: string
  to?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface RejectBookingRequest {
  reason: string
}

export interface AvailableRoom {
  room_id: number
  room_number: string
  type_id: number
  type_name: string
  base_price: number
  max_occupancy: number
  nights: number
  total: number
}

// --- Check-in / Check-out ---
export interface ProcessCheckInRequest {
  reservation_id: number
  room_id: number
  notes?: string
}

export interface WalkInCheckInRequest {
  guest_name: string
  guest_email?: string
  guest_phone: string
  id_type: string
  id_number: string
  room_type_id: number
  room_id: number
  check_in_date: string
  check_out_date: string
  num_guests: number
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

// --- Maintenance ---
export interface DbMaintenance {
  ID: number
  ROOM_ID: number
  ISSUE_TYPE: string
  DESCRIPTION: string
  STATUS: string
  CREATED_DATE: string
  ASSIGNED_TO: string
  RESOLVED_DATE: string | null
  NOTES: string
}

export interface CreateMaintenanceRequest {
  room_id: number
  issue_type: string
  description: string
}

export interface ResolveMaintenanceRequest {
  notes: string
  resolved_date: string
}

// --- Housekeeping ---
export interface DbHousekeepingTask {
  BOOKING_ID: number
  ROOM_ID: number
  ROOM_NUMBER: string
  CHECK_OUT_DATE: string
  GUEST_NAME: string
  ASSIGNED_STAFF: string
}

// --- Staff ---
export interface DbStaff {
  ID: number
  FULL_NAME: string
  EMAIL: string
  PHONE: string
  DEPARTMENT: string
  POSITION: string
  SALARY: number
  HIRE_DATE: string
  IS_ACTIVE: number
}

export interface CreateStaffRequest {
  full_name: string
  email: string
  phone: string
  department: string
  position: string
  salary: number
  hire_date: string
}

export interface UpdateStaffRequest {
  full_name?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  salary?: number
}

// --- Payroll ---
export interface DbPayroll {
  ID: number
  STAFF_ID: number
  MONTH: string
  SALARY_PAID: number
  PAYMENT_DATE: string
}

export interface CreatePayrollRequest {
  staff_id: number
  month: string
  salary_paid: number
  payment_date: string
}

// --- Settings & Admin ---
export interface DbSystemSetting {
  SETTING_KEY: string
  SETTING_VALUE: string
  DESCRIPTION: string
  UPDATED_AT: string
  UPDATED_BY: number
}

export interface DbAuditEntry {
  ID: number
  ACTION: string
  ENTITY_TYPE: string
  ENTITY_ID: number | null
  PERFORMED_BY: string
  PERFORMED_BY_ID: number
  PERFORMED_AT: string
  DETAILS: string
}

export interface UpdateSettingRequest {
  settings: Record<string, string>
}

export interface UpdateUserRoleRequest {
  role_id: number
}

export interface AuditListParams {
  action?: string
  entity_type?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

// ============================================================
// Phase 4 � Content Creation & Marketing
// ============================================================

export interface DbContent {
  ID: number
  TITLE: string
  TYPE: 'news' | 'announcement' | 'event'
  BODY: string
  FEATURED_IMAGE_URL: string | null
  STATUS: 'draft' | 'published' | 'archived'
  PUBLISHED_AT: string | null
  CREATED_BY: number | null
  CREATED_AT: string
  UPDATED_AT: string
}

export interface ContentListParams {
  type?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface CreateContentRequest {
  title: string
  type: string
  body: string
  featured_image_url?: string | null
  status: 'draft' | 'published'
}

export interface UpdateContentRequest extends CreateContentRequest {}

export interface DbPromotion {
  ID: number
  TITLE: string
  DESCRIPTION: string
  DISCOUNT_PCT: number
  START_DATE: string
  END_DATE: string
  APPLICABLE_ROOM_TYPES: string
  STATUS: 'draft' | 'active' | 'archived'
  CREATED_BY: number | null
  CREATED_AT: string
  UPDATED_AT: string
}

export interface PromotionListParams {
  status?: string
  search?: string
  sort?: string
  page?: number
  pageSize?: number
}

export interface CreatePromotionRequest {
  title: string
  description?: string
  discount_pct: number
  start_date: string
  end_date: string
  applicable_room_types?: number[] | string
  status: 'draft' | 'active'
}

export interface UpdatePromotionRequest extends CreatePromotionRequest {
  status: 'draft' | 'active' | 'archived'
}

export interface DbEmailTemplate {
  ID: number
  NAME: string
  SUBJECT: string
  BODY: string
  TYPE: string
  PLACEHOLDERS: string
  IS_SYSTEM: number
  CREATED_BY: number | null
  CREATED_AT: string
  UPDATED_AT: string
}

export interface CreateTemplateRequest {
  name: string
  subject: string
  body: string
  type: string
  placeholders?: string[]
}

export interface DbEmailCampaign {
  ID: number
  TITLE: string
  TEMPLATE_ID: number | null
  RECIPIENT_TYPE: 'all_guests' | 'past_guests' | 'newsletter_subscribers'
  RECIPIENT_COUNT: number
  STATUS: 'draft' | 'scheduled' | 'sent' | 'failed'
  SCHEDULED_AT: string | null
  SENT_AT: string | null
  SUBJECT_OVERRIDE: string | null
  BODY_OVERRIDE: string | null
  OPEN_COUNT: number
  CLICK_COUNT: number
  CREATED_BY: number | null
  CREATED_AT: string
}

export interface SendCampaignRequest {
  title: string
  template_id?: number | null
  recipient_type: 'all_guests' | 'past_guests' | 'newsletter_subscribers'
  subject?: string
  body?: string
  scheduled_at?: string
}

export interface DbTrackingEvent {
  ID: number
  CAMPAIGN_ID: number
  RECIPIENT_EMAIL: string
  EVENT_TYPE: 'open' | 'click'
  LINK_URL: string | null
  USER_AGENT: string | null
  IP_ADDRESS: string | null
  CREATED_AT: string
}

export interface CampaignStats {
  campaign_id: number
  total_sent: number
  total_opens: number
  open_rate: number
  total_clicks: number
  click_rate: number
  opens_by_day: { date: string; count: number }[]
  top_links: { url: string; count: number }[]
}

export interface RecipientCounts {
  all_guests: number
  past_guests: number
  newsletter_subscribers: number
}

export interface DbSubscriber {
  ID: number
  EMAIL: string
  STATUS: 'active' | 'unsubscribed'
  SUBSCRIBED_AT: string
  CREATED_AT: string
}

// ============================================================
// Phase AI Content — AI-powered content generator
// ============================================================

export type AiContentType = 'flyer' | 'email' | 'instagram_post' | 'whatsapp_message' | 'newsletter'
export type AiContentStatus = 'draft' | 'approved' | 'scheduled' | 'published'
export type AiChannel = 'email' | 'newsletter' | 'instagram' | 'whatsapp'
export type AiDistributionStatus = 'pending' | 'scheduled' | 'sent' | 'failed' | 'manual'
export type AiProvider = 'anthropic' | 'mock'

export interface DbAiGeneratedContent {
  ID: number
  TITLE: string
  TYPE: AiContentType
  ADMIN_PROMPT: string
  GENERATED_CONTENT: string
  FLYER_IMAGE_URL: string | null
  FLYER_DATA: string | null
  STATUS: AiContentStatus
  BRAND_GUIDELINES: string | null
  CREATED_BY: number | null
  CREATED_AT: string
  UPDATED_AT: string
  APPROVED_BY: number | null
  APPROVED_AT: string | null
}

export interface DbAiContentVersion {
  ID: number
  CONTENT_ID: number
  VERSION_NUMBER: number
  GENERATED_CONTENT: string
  REASON: string
  GENERATED_BY: number | null
  GENERATED_AT: string
}

export interface DbAiDistribution {
  ID: number
  CONTENT_ID: number
  CHANNEL: AiChannel
  RECIPIENT_TYPE: 'all_guests' | 'past_guests' | 'newsletter_subscribers' | null
  RECIPIENT_COUNT: number
  STATUS: AiDistributionStatus
  SCHEDULED_AT: string | null
  SENT_AT: string | null
  ENGAGEMENT_COUNT: number
  CAMPAIGN_ID: number | null
  CREATED_BY: number | null
  CREATED_AT: string
}

// Structured payloads produced by the generator (serialized to
// GENERATED_CONTENT as JSON).
export interface AiGeneratedFlyer {
  headline: string
  subtitle: string
  details: string
  cta_text: string
  accent_color: string
}

export interface AiGeneratedEmail {
  subject: string
  preheader: string
  headline: string
  body_html: string
  cta_label: string
  cta_url: string
}

export interface AiGeneratedInstagram {
  caption: string
  hashtags: string
}

export interface AiGeneratedWhatsapp {
  message: string
}

export type AiGeneratedBundle =
  | { type: 'flyer'; content: AiGeneratedFlyer; flyerSvg: string }
  | { type: 'email'; content: AiGeneratedEmail }
  | { type: 'instagram_post'; content: AiGeneratedInstagram }
  | { type: 'whatsapp_message'; content: AiGeneratedWhatsapp }
  | { type: 'newsletter'; content: AiGeneratedEmail }

export interface GenerateContentRequest {
  type: AiContentType
  prompt: string
  brand_guidelines?: string
  title?: string
}

export interface RegenerateContentRequest {
  reason?: string
}

export interface DistributeContentRequest {
  channel: AiChannel
  recipient_type?: 'all_guests' | 'past_guests' | 'newsletter_subscribers'
  scheduled_at?: string | null
}

export interface AiContentListParams {
  type?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface AiContentDetail {
  content: DbAiGeneratedContent
  content_payload: Record<string, unknown> | null
  versions: DbAiContentVersion[]
  distributions: DbAiDistribution[]
}

export interface AiChannelStats {
  channel: AiChannel
  sent_count: number
  scheduled_count: number
  total_recipients: number
  engagement_count: number
}

export interface AiAnalytics {
  total_content: number
  total_approved: number
  total_sent: number
  total_recipients: number
  total_engagements: number
  approval_rate: number
  by_type: { type: AiContentType; count: number }[]
  by_status: { status: AiContentStatus; count: number }[]
  by_channel: AiChannelStats[]
  recent_generated: { id: number; title: string; type: AiContentType; status: AiContentStatus; created_at: string }[]
}

export interface DistributeResult {
  distribution_id: number
  channel: AiChannel
  status: AiDistributionStatus
  recipient_count: number
  campaign_id: number | null
  scheduled_at: string | null
  sent_at: string | null
  preview?: string
}
