# ALTONSHOTEL API Documentation

## Response Format

All API responses follow a standard envelope:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "message": "Human-readable message",
  "error": "Error description (only on failure)"
}
```

### Paginated Responses

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request — missing/invalid fields |
| 401 | Unauthorized — missing/invalid JWT |
| 403 | Forbidden — authenticated but wrong role |
| 404 | Not Found — resource doesn't exist |
| 405 | Method Not Allowed |
| 409 | Conflict — duplicate resource |
| 500 | Internal Server Error |

---

## Authentication

### Role-Based Access

| Role | Access |
|------|--------|
| Public | `POST /api/auth/login`, `POST /api/auth/refresh` |
| Any authenticated user | All endpoints not listed below |
| ADMIN / RECEPTIONIST | Check-in, check-out, billing create/add-item/payment |
| ADMIN / MANAGER | Staff CRUD, payroll, maintenance resolve |
| ADMIN / RECEPTIONIST / MANAGER | Maintenance create, housekeeping complete |
| ADMIN only | Room create/update/delete/status, room types create, users list/update-role, audit log, settings update |

### `POST /api/auth/login`

| Field | Value |
|-------|-------|
| Description | Authenticate user and receive JWT tokens |
| Request body | `{ "username": "string", "password": "string" }` |
| Success 200 | `{ "user": { user_id, username, full_name, email, role, is_active }, "accessToken": "string", "refreshToken": "string" }` |
| Errors | 400 — missing fields; 401 — invalid credentials or account disabled/locked |

### `POST /api/auth/refresh`

| Field | Value |
|-------|-------|
| Description | Refresh an expired access token |
| Request body | `{ "refreshToken": "string" }` |
| Success 200 | `{ "accessToken": "string" }` |
| Errors | 400 — missing token; 401 — invalid/expired token |

### `GET /api/auth/me`

| Field | Value |
|-------|-------|
| Description | Get current authenticated user profile |
| Auth | Any authenticated user |
| Success 200 | `{ "user": { user_id, username, full_name, email, role, is_active, last_login, created_at } }` |
| Errors | 401 — no auth; 404 — user not found |

### `POST /api/auth/change-password`

| Field | Value |
|-------|-------|
| Description | Change password for authenticated user |
| Auth | Any authenticated user |
| Request body | `{ "oldPassword": "string", "newPassword": "string" }` |
| Success 200 | `{ "success": true }` |
| Errors | 400 — missing fields, new password < 8 chars, incorrect old password; 404 — user not found |

---

## Dashboard

### `GET /api/dashboard/stats`

| Field | Value |
|-------|-------|
| Description | Get real-time dashboard statistics |
| Auth | Any authenticated user |
| Success 200 | `{ "todayArrivals": number, "todayDepartures": number, "occupancyRate": number, "todayRevenue": number }` |

---

## Rooms

### `GET /api/rooms`

| Field | Value |
|-------|-------|
| Description | List all rooms with optional filters |
| Auth | Any authenticated user |
| Query params | `status` (AVAILABLE/OCCUPIED/MAINTENANCE/RESERVED), `type_id`, `floor`, `page` (default 1), `pageSize` (default 20) |
| Success 200 | Paginated array of `DbRoom` |

### `GET /api/rooms/types`

| Field | Value |
|-------|-------|
| Description | List all room type definitions |
| Auth | Any authenticated user |
| Success 200 | Array of `{ type_id, type_name, description, base_price, max_occupancy }` |

### `POST /api/rooms/types`

| Field | Value |
|-------|-------|
| Description | Create a new room type |
| Auth | ADMIN only |
| Request body | `{ "type_name": "string", "description": "string", "base_price": number, "max_occupancy": number }` |
| Success 201 | Success message |
| Errors | 400 — missing fields |

### `GET /api/rooms/:id`

| Field | Value |
|-------|-------|
| Description | Get a single room by ID |
| Auth | Any authenticated user |
| Path params | `id` — room ID |
| Success 200 | `DbRoom` object |
| Errors | 404 — room not found |

### `POST /api/rooms`

| Field | Value |
|-------|-------|
| Description | Create a new room |
| Auth | ADMIN only |
| Request body | `{ "room_number": "string", "type_id": number, "floor": number, "description": "string" }` |
| Success 201 | `{ "room_id": number }` |
| Errors | 400 — missing required fields |

### `PUT /api/rooms/:id`

| Field | Value |
|-------|-------|
| Description | Update a room |
| Auth | ADMIN only |
| Path params | `id` — room ID |
| Request body | `{ "room_number": "string", "type_id": number, "floor": number, "description": "string" }` (all optional) |
| Success 200 | `{ "message": "Room updated" }` |
| Errors | 403 — insufficient permissions |

### `DELETE /api/rooms/:id`

| Field | Value |
|-------|-------|
| Description | Delete a room |
| Auth | ADMIN only |
| Path params | `id` — room ID |
| Success 200 | `{ "message": "Room deleted" }` |

### `PATCH /api/rooms/:id/status`

| Field | Value |
|-------|-------|
| Description | Update room status |
| Auth | ADMIN only |
| Path params | `id` — room ID |
| Request body | `{ "status": "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED" }` |
| Success 200 | `{ "message": "Room status updated" }` |
| Errors | 400 — invalid status value |

### `GET /api/rooms/availability`

| Field | Value |
|-------|-------|
| Description | Check room availability for dates and type |
| Auth | Any authenticated user |
| Query params | `check_in` (date), `check_out` (date), `room_type` (number) |
| Success 200 | `{ "available": number, "rooms": [{ room_id, room_number, floor, type_name, base_price }] }` |
| Errors | 400 — missing required params |

---

## Guests

### `GET /api/guests`

| Field | Value |
|-------|-------|
| Description | List all guests |
| Auth | Any authenticated user |
| Query params | `search`, `nationality`, `page` (default 1), `pageSize` (default 20) |
| Success 200 | Paginated array of `DbGuest` |

### `GET /api/guests/search`

| Field | Value |
|-------|-------|
| Description | Quick guest search (autocomplete) |
| Auth | Any authenticated user |
| Query params | `q` (min 2 characters) |
| Success 200 | Array of `DbGuest` (max 10 results) |
| Errors | 400 — query too short |

### `POST /api/guests`

| Field | Value |
|-------|-------|
| Description | Create a new guest record |
| Auth | Any authenticated user |
| Request body | `{ "first_name": "string", "last_name": "string", "email": "string", "phone": "string", "id_type": "string", "id_number": "string", "address": "string", "nationality": "string" }` |
| Success 201 | `{ "guest_id": number }` |
| Errors | 400 — missing required fields (first_name, last_name, phone, id_type, id_number) |

### `GET /api/guests/:id`

| Field | Value |
|-------|-------|
| Description | Get a single guest by ID |
| Auth | Any authenticated user |
| Path params | `id` — guest ID |
| Success 200 | `DbGuest` object |
| Errors | 404 — guest not found |

### `PUT /api/guests/:id`

| Field | Value |
|-------|-------|
| Description | Update a guest record |
| Auth | Any authenticated user |
| Path params | `id` — guest ID |
| Request body | Partial guest fields |
| Success 200 | `{ "message": "Guest updated" }` |
| Errors | 400 — invalid data |

---

## Reservations

### `GET /api/reservations`

| Field | Value |
|-------|-------|
| Description | List all reservations |
| Auth | Any authenticated user |
| Query params | `status`, `guest_id`, `from` (check-in >=), `to` (check-out <=), `page`, `pageSize` |
| Success 200 | Paginated array of `DbReservation` |

### `POST /api/reservations`

| Field | Value |
|-------|-------|
| Description | Create a new reservation |
| Auth | Any authenticated user |
| Request body | `{ "guest_id": number, "room_type_id": number, "check_in_date": "date", "check_out_date": "date", "special_requests": "string" }` |
| Success 201 | `{ "reservation_id": number }` |
| Errors | 400 — missing fields, checkout <= checkin, guest not found, no rooms available |

### `GET /api/reservations/:id`

| Field | Value |
|-------|-------|
| Description | Get a single reservation by ID |
| Auth | Any authenticated user |
| Path params | `id` — reservation ID |
| Success 200 | `DbReservation` object |
| Errors | 404 — not found |

### `PUT /api/reservations/:id`

| Field | Value |
|-------|-------|
| Description | Update a reservation |
| Auth | Any authenticated user |
| Path params | `id` — reservation ID |
| Request body | `{ "check_in_date": "date", "check_out_date": "date", "room_type_id": number, "special_requests": "string" }` (all optional) |
| Success 200 | `{ "message": "Reservation updated" }` |

### `POST /api/reservations/:id/confirm`

| Field | Value |
|-------|-------|
| Description | Confirm a pending reservation |
| Auth | Any authenticated user |
| Path params | `id` — reservation ID |
| Success 200 | `{ "message": "Reservation confirmed" }` |
| Errors | 400 — reservation not in PENDING status |

### `POST /api/reservations/:id/cancel`

| Field | Value |
|-------|-------|
| Description | Cancel a reservation |
| Auth | Any authenticated user |
| Path params | `id` — reservation ID |
| Success 200 | `{ "message": "Reservation cancelled" }` |
| Errors | 400 — reservation cannot be cancelled (not PENDING or CONFIRMED) |

---

## Check-in

### `GET /api/checkin/list`

| Field | Value |
|-------|-------|
| Description | List checked-in guests with full details |
| Auth | Any authenticated user |
| Success 200 | Array of check-in records with booking, reservation, guest, and room info |

### `POST /api/checkin/process`

| Field | Value |
|-------|-------|
| Description | Process a guest check-in |
| Auth | ADMIN or RECEPTIONIST |
| Request body | `{ "booking_id": number, "room_id": number, "notes": "string" }` |
| Success 201 | `{ "checkin_id": number }` |
| Errors | 400 — missing fields, booking not active, room not available; 404 — booking/room not found |

---

## Check-out

### `GET /api/checkout/list`

| Field | Value |
|-------|-------|
| Description | List checked-out guests with full details |
| Auth | Any authenticated user |
| Success 200 | Array of checkout records with check-in, booking, reservation, guest, and room info |

### `POST /api/checkout/process`

| Field | Value |
|-------|-------|
| Description | Process a guest check-out |
| Auth | ADMIN or RECEPTIONIST |
| Request body | `{ "checkin_id": number, "notes": "string" }` |
| Success 201 | `{ "checkout_id": number }` |
| Errors | 400 — missing fields, already checked out; 404 — check-in not found |

---

## Billing

### `GET /api/billing/invoices`

| Field | Value |
|-------|-------|
| Description | List all invoices |
| Auth | Any authenticated user |
| Query params | `status`, `guest_id`, `date_from`, `date_to`, `page` (default 1), `pageSize` (default 20) |
| Success 200 | Paginated array of `{ invoice_id, booking_id, guest_id, total_amount, status, created_at }` |

### `POST /api/billing/invoices`

| Field | Value |
|-------|-------|
| Description | Create an invoice from a booking |
| Auth | ADMIN or RECEPTIONIST |
| Request body | `{ "booking_id": number }` |
| Success 201 | `{ "invoice_id": number }` |
| Errors | 400 — missing booking_id, invoice already exists; 404 — booking not found |

### `GET /api/billing/invoices/:id`

| Field | Value |
|-------|-------|
| Description | Get invoice details with items and payments |
| Auth | Any authenticated user |
| Path params | `id` — invoice ID |
| Success 200 | `{ "invoice": DbInvoice, "items": [DbInvoiceItem], "payments": [DbPayment] }` |
| Errors | 404 — invoice not found |

### `GET /api/billing/invoices/:id/balance`

| Field | Value |
|-------|-------|
| Description | Get invoice balance |
| Auth | Any authenticated user |
| Path params | `id` — invoice ID |
| Success 200 | `{ "invoice_id": number, "total_amount": number, "total_paid": number, "balance": number }` |
| Errors | 404 — invoice not found |

### `POST /api/billing/invoices/:id/items`

| Field | Value |
|-------|-------|
| Description | Add a line item to an invoice |
| Auth | ADMIN or RECEPTIONIST |
| Path params | `id` — invoice ID |
| Request body | `{ "description": "string", "quantity": number, "unit_price": number }` |
| Success 201 | `{ "item_id": number }` |
| Errors | 400 — missing/invalid fields, invoice PAID or CANCELLED; 404 — invoice not found |

### `POST /api/billing/invoices/:id/payments`

| Field | Value |
|-------|-------|
| Description | Record a payment against an invoice |
| Auth | ADMIN or RECEPTIONIST |
| Path params | `id` — invoice ID |
| Request body | `{ "amount": number, "payment_method": "CASH"|"CARD"|"BANK_TRANSFER", "reference_number": "string" }` |
| Success 201 | `{ "payment_id": number }` |
| Errors | 400 — missing/invalid fields, payment exceeds balance, invoice PAID or CANCELLED; 404 — invoice not found |

---

## Reports

### `GET /api/reports/summary`

| Field | Value |
|-------|-------|
| Description | Get overall system summary statistics |
| Auth | Any authenticated user |
| Success 200 | `{ totalRooms, occupiedRooms, occupancyRate, totalGuests, totalReservations, completedBookings, totalRevenue, avgRatePerNight, avgStayLength }` |

### `GET /api/reports/occupancy`

| Field | Value |
|-------|-------|
| Description | Get monthly occupancy rates |
| Auth | Any authenticated user |
| Query params | `months` (default 6) |
| Success 200 | `[{ "month": "2026-01", "rate": 75.5 }]` |

### `GET /api/reports/revenue`

| Field | Value |
|-------|-------|
| Description | Get monthly revenue data |
| Auth | Any authenticated user |
| Query params | `months` (default 6) |
| Success 200 | `[{ "month": "2026-01", "amount": 45000 }]` |

### `GET /api/reports/room-types`

| Field | Value |
|-------|-------|
| Description | Get revenue breakdown by room type |
| Auth | Any authenticated user |
| Success 200 | `[{ "type_name": "string", "bookings": number, "revenue": number, "avg_rate": number }]` |

### `GET /api/reports/popular-guests`

| Field | Value |
|-------|-------|
| Description | Get most frequent guests by spend |
| Auth | Any authenticated user |
| Query params | `limit` (default 10) |
| Success 200 | `[{ "guest_id": number, "first_name": "string", "last_name": "string", "total_stays": number, "total_spend": number }]` |

---

## Maintenance

### `GET /api/maintenance`

| Field | Value |
|-------|-------|
| Description | List maintenance issues |
| Auth | Any authenticated user |
| Query params | `status` (optional filter — excludes RESOLVED by default) |
| Success 200 | Array of `{ id, room_id, issue_type, description, status, created_date, assigned_to, resolved_date, notes, room_number }` |

### `POST /api/maintenance`

| Field | Value |
|-------|-------|
| Description | Report a maintenance issue |
| Auth | ADMIN, RECEPTIONIST, or MANAGER |
| Request body | `{ "room_id": number, "issue_type": "string", "description": "string" }` |
| Success 201 | Full maintenance record object |
| Errors | 400 — missing required fields |

### `GET /api/maintenance/:id`

| Field | Value |
|-------|-------|
| Description | Get a single maintenance record |
| Auth | Any authenticated user |
| Path params | `id` — maintenance record ID |
| Success 200 | Full maintenance record with room details |
| Errors | 404 — not found |

### `POST /api/maintenance/:id/resolve`

| Field | Value |
|-------|-------|
| Description | Mark a maintenance issue as resolved |
| Auth | ADMIN or MANAGER |
| Path params | `id` — maintenance record ID |
| Request body | `{ "notes": "string", "resolved_date": "date" }` |
| Success 200 | `{ "message": "Maintenance issue resolved" }` |
| Errors | 400 — missing notes; 404 — record not found |

---

## Housekeeping

### `GET /api/housekeeping/tasks`

| Field | Value |
|-------|-------|
| Description | List today's checkout rooms for cleaning |
| Auth | Any authenticated user |
| Success 200 | Array of `{ booking_id, room_id, room_number, check_out_date, guest_name, assigned_staff }` |

### `POST /api/housekeeping/tasks/:id/complete`

| Field | Value |
|-------|-------|
| Description | Mark a housekeeping task as complete |
| Auth | ADMIN, RECEPTIONIST, or MANAGER |
| Path params | `id` — booking ID |
| Request body | `{ "assigned_staff": "string" }` |
| Success 200 | `{ "message": "Housekeeping task completed, room marked as available" }` |
| Errors | 400 — missing assigned_staff; 404 — booking not found |

---

## Staff

### `GET /api/staff`

| Field | Value |
|-------|-------|
| Description | List active staff members |
| Auth | Any authenticated user |
| Success 200 | Array of `DbStaff` (active only) |

### `POST /api/staff`

| Field | Value |
|-------|-------|
| Description | Add a new staff member |
| Auth | ADMIN or MANAGER |
| Request body | `{ "full_name": "string", "email": "string", "phone": "string", "department": "string", "position": "string", "salary": number, "hire_date": "date" }` |
| Success 201 | Created staff record |
| Errors | 400 — missing required fields |

### `PUT /api/staff/:id`

| Field | Value |
|-------|-------|
| Description | Update a staff member |
| Auth | ADMIN or MANAGER |
| Path params | `id` — staff ID |
| Request body | Partial staff fields |
| Success 200 | `{ "message": "Staff member updated" }` |
| Errors | 404 — not found |

### `POST /api/staff/:id/deactivate`

| Field | Value |
|-------|-------|
| Description | Deactivate a staff member |
| Auth | ADMIN or MANAGER |
| Path params | `id` — staff ID |
| Success 200 | `{ "message": "Staff member deactivated" }` |
| Errors | 404 — not found |

---

## Payroll

### `GET /api/payroll/:staff_id`

| Field | Value |
|-------|-------|
| Description | Get payroll records for a staff member |
| Auth | Any authenticated user |
| Path params | `staff_id` — staff ID |
| Success 200 | Array of `DbPayroll` ordered by month DESC |

### `POST /api/payroll`

| Field | Value |
|-------|-------|
| Description | Create a payroll record |
| Auth | ADMIN or MANAGER |
| Request body | `{ "staff_id": number, "month": "string", "salary_paid": number, "payment_date": "date" }` |
| Success 201 | Created payroll record |
| Errors | 400 — missing required fields |

---

## Settings

### `GET /api/settings`

| Field | Value |
|-------|-------|
| Description | Get all hotel settings |
| Auth | Any authenticated user |
| Success 200 | Array of `{ setting_key, setting_value, description, updated_at, updated_by }` |

### `PUT /api/settings`

| Field | Value |
|-------|-------|
| Description | Update hotel settings |
| Auth | ADMIN only |
| Request body | `{ "settings": { "key": "value", ... } }` |
| Success 200 | `{ "message": "Settings updated successfully" }` |
| Errors | 400 — no settings provided |

---

## Users (Admin)

### `GET /api/users`

| Field | Value |
|-------|-------|
| Description | List all system users |
| Auth | ADMIN only |
| Success 200 | Array of `{ user_id, username, full_name, email, role_id, is_active, last_login, created_at, role_name }` |

### `PUT /api/users/:id/role`

| Field | Value |
|-------|-------|
| Description | Update a user's role |
| Auth | ADMIN only |
| Path params | `id` — user ID |
| Request body | `{ "role_id": number }` |
| Success 200 | `{ "message": "User role updated successfully" }` |
| Errors | 400 — invalid user ID or missing role_id; 404 — user not found |

---

## Audit Log

### `GET /api/audit`

| Field | Value |
|-------|-------|
| Description | View system audit log |
| Auth | ADMIN only |
| Query params | `action`, `entity_type`, `from`, `to`, `page` (default 1), `pageSize` (default 50) |
| Success 200 | Paginated array of audit entries with user info |
