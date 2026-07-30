// ============================================================
// Row Mapper — Convert Oracle result arrays to objects
// ============================================================

type ColumnMap = Record<string, number>

const COLUMN_MAPS: Record<string, ColumnMap> = {
  USERS: {
    USER_ID: 0, USERNAME: 1, PASSWORD_HASH: 2, FULL_NAME: 3, EMAIL: 4,
    ROLE_ID: 5, IS_ACTIVE: 6, FAILED_LOGIN_ATTEMPTS: 7, LAST_LOGIN: 8,
    CREATED_AT: 9, UPDATED_AT: 10,
  },
  ROLES: { ROLE_ID: 0, ROLE_NAME: 1, DESCRIPTION: 2 },
  ROOM_TYPES: { TYPE_ID: 0, TYPE_NAME: 1, DESCRIPTION: 2, BASE_PRICE: 3, MAX_OCCUPANCY: 4 },
  ROOMS: { ROOM_ID: 0, ROOM_NUMBER: 1, TYPE_ID: 2, FLOOR: 3, STATUS: 4, DESCRIPTION: 5 },
  GUESTS: {
    GUEST_ID: 0, FIRST_NAME: 1, LAST_NAME: 2, EMAIL: 3, PHONE: 4,
    ID_TYPE: 5, ID_NUMBER: 6, ADDRESS: 7, NATIONALITY: 8,
    CREATED_AT: 9, UPDATED_AT: 10,
  },
  RESERVATIONS: {
    RESERVATION_ID: 0, GUEST_ID: 1, ROOM_TYPE_ID: 2, CHECK_IN_DATE: 3,
    CHECK_OUT_DATE: 4, STATUS: 5, SPECIAL_REQUESTS: 6, CREATED_BY: 7,
    CREATED_AT: 8, UPDATED_AT: 9,
  },
  BOOKINGS: {
    BOOKING_ID: 0, RESERVATION_ID: 1, ROOM_ID: 2, CHECK_IN_DATE: 3,
    CHECK_OUT_DATE: 4, RATE_PER_NIGHT: 5, STATUS: 6, CREATED_AT: 7,
  },
  CHECKINS: {
    CHECKIN_ID: 0, BOOKING_ID: 1, ACTUAL_CHECK_IN: 2,
    CHECKED_IN_BY: 3, NOTES: 4,
  },
  CHECKOUTS: {
    CHECKOUT_ID: 0, CHECKIN_ID: 1, ACTUAL_CHECK_OUT: 2,
    CHECKED_OUT_BY: 3, NOTES: 4,
  },
  INVOICES: {
    INVOICE_ID: 0, BOOKING_ID: 1, GUEST_ID: 2, TOTAL_AMOUNT: 3,
    STATUS: 4, CREATED_AT: 5, UPDATED_AT: 6,
  },
  INVOICE_ITEMS: {
    ITEM_ID: 0, INVOICE_ID: 1, DESCRIPTION: 2, QUANTITY: 3,
    UNIT_PRICE: 4, TOTAL: 5,
  },
  PAYMENTS: {
    PAYMENT_ID: 0, INVOICE_ID: 1, AMOUNT: 2, PAYMENT_METHOD: 3,
    PAYMENT_DATE: 4, REFERENCE_NUMBER: 5, RECEIVED_BY: 6,
  },
  MAINTENANCE: {
    ID: 0, ROOM_ID: 1, ISSUE_TYPE: 2, DESCRIPTION: 3,
    STATUS: 4, CREATED_DATE: 5, ASSIGNED_TO: 6, RESOLVED_DATE: 7, NOTES: 8,
  },
  STAFF: {
    ID: 0, FULL_NAME: 1, EMAIL: 2, PHONE: 3,
    DEPARTMENT: 4, POSITION: 5, SALARY: 6, HIRE_DATE: 7, IS_ACTIVE: 8,
  },
  PAYROLL: {
    ID: 0, STAFF_ID: 1, MONTH: 2, SALARY_PAID: 3, PAYMENT_DATE: 4,
  },
  SYSTEM_SETTINGS: {
    SETTING_KEY: 0, SETTING_VALUE: 1, DESCRIPTION: 2,
    UPDATED_AT: 3, UPDATED_BY: 4,
  },
  AUDIT_LOG: {
    ID: 0, ACTION: 1, ENTITY_TYPE: 2, ENTITY_ID: 3,
    PERFORMED_BY: 4, PERFORMED_BY_ID: 5, PERFORMED_AT: 6, DETAILS: 7,
  },
}

export function mapRow<T>(row: unknown[], tableName: string): T {
  const colMap = COLUMN_MAPS[tableName]
  if (!colMap) {
    return row as unknown as T
  }

  const obj: Record<string, unknown> = {}
  for (const [key, idx] of Object.entries(colMap)) {
    obj[key] = row[idx]
  }
  return obj as T
}

export function mapRows<T>(rows: unknown[][], tableName: string): T[] {
  return rows.map(row => mapRow<T>(row, tableName))
}
