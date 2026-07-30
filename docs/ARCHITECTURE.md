# ALTONSHOTEL Architecture

## System Overview

The ALTONSHOTEL Management System (AHMS) is a full-stack hotel management application built with:

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Netlify Functions (serverless), TypeScript |
| **Database** | Oracle Database (production), In-memory mock (development) |
| **Auth** | JWT (access + refresh tokens), bcryptjs (mock) / SHA-256 (Oracle) |
| **Deployment** | Netlify |

---

## Directory Structure

```
ALTONSHOTEL/
├── frontend/                          # React SPA
│   ├── src/
│   │   ├── main.tsx                   # Entry point
│   │   ├── App.tsx                    # Route definitions
│   │   ├── index.css                  # Tailwind + custom styles
│   │   ├── components/
│   │   │   └── auth/                  # AuthProvider, ProtectedRoute
│   │   ├── context/                   # AuthContext
│   │   ├── layouts/                   # DashboardLayout with sidebar
│   │   ├── pages/                     # 16 page components
│   │   ├── services/                  # API client (api.ts)
│   │   └── types/                     # Frontend type definitions
│   ├── vite.config.ts                 # Vite config + API proxy
│   └── tailwind.config.js             # Theme customization
│
├── netlify/
│   └── functions/                     # Backend (58 endpoint handlers)
│       ├── _shared/                   # Shared utilities
│       │   ├── db.ts                  # Oracle DB connection
│       │   ├── db-mock.ts             # In-memory mock database
│       │   ├── jwt.ts                 # JWT sign/verify
│       │   ├── middleware.ts          # Auth guards + error classes
│       │   ├── response.ts           # Response helpers
│       │   ├── row-mapper.ts          # Oracle row → object mapper
│       │   ├── types.ts               # Backend type definitions
│       │   └── password.ts            # Password utilities
│       ├── auth/                      # login, refresh, me, change-password
│       ├── rooms/                     # list, create, get, update, delete, status, types
│       ├── guests/                    # list, search, create, get, update
│       ├── reservations/              # list, create, get, update, cancel, confirm, availability
│       ├── checkin/                   # list, process
│       ├── checkout/                  # list, process
│       ├── dashboard/                 # stats
│       ├── billing/                   # list, create, detail, add-item, record-payment, balance
│       ├── reports/                   # summary, occupancy, revenue, room-types, popular-guests
│       ├── maintenance/               # list, create, detail, resolve
│       ├── housekeeping/              # tasks, complete
│       ├── staff/                     # list, create, update, deactivate
│       ├── payroll/                   # list, create
│       ├── settings/                  # get, update
│       ├── audit/                     # list
│       └── users/                     # list, update-role
│
├── database/                          # Oracle SQL
│   ├── schema/                        # CREATE TABLE scripts
│   ├── seeds/                         # Sample data
│   ├── procedures/                    # PL/SQL packages
│   ├── triggers/                      # Oracle triggers
│   └── migrations/                    # Versioned migration scripts
│
├── dev-server.js                      # Local Netlify Functions emulator
├── netlify.toml                       # Netlify deployment config
├── package.json                       # Backend dependencies
└── .env                               # Environment variables
```

---

## Frontend Architecture

### Framework & Tooling

- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized production builds
- **Tailwind CSS** with custom hotel theme (navy/gold color scheme)
- **React Router v6** for client-side routing

### Routing Structure

```
/                    → WelcomePage (public landing)
/dashboard           → DashboardLayout (protected, with sidebar)
  /                  → DashboardPage (stats overview)
  /rooms             → RoomsPage
  /guests            → GuestsPage
  /reservations      → ReservationsPage
  /checkin           → CheckInPage
  /checkout          → CheckOutPage
  /billing           → BillingPage
  /reports           → ReportsPage
  /maintenance       → MaintenancePage
  /housekeeping      → HousekeepingPage
  /staff             → StaffPage
  /schedule          → SchedulePage
  /settings          → SettingsPage
  /audit             → AuditLogPage
  /users             → AdminUsersPage
```

All dashboard routes are wrapped in `ProtectedRoute` that checks authentication state from `AuthContext`.

### Auth Flow (Frontend)

1. `AuthProvider` checks for stored JWT in `localStorage` on mount
2. If token exists, it's attached to all API requests via the `ApiClient` interceptor
3. On 401 response, the client attempts token refresh automatically
4. If refresh fails, the user is redirected to the login page

### API Client (`frontend/src/services/api.ts`)

The custom `ApiClient` class:
- Auto-attaches `Authorization: Bearer <token>` header
- Intercepts 401 responses and attempts token refresh
- Stores tokens in `localStorage` keys: `ahms_token`, `ahms_refresh_token`, `ahms_user`

---

## Backend Architecture

### Serverless Functions Pattern

Each endpoint is a standalone TypeScript file that exports a default async function:

```typescript
export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    const user = requireAuth(req)    // Auth guard
    // ... business logic ...
    return successResponse(data)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
```

### Local Dev Server (`dev-server.js`)

A lightweight HTTP server that mimics Netlify Functions locally:
- Runs on port **8889**
- Route table mapping ~58 HTTP method+path combinations to TypeScript handlers
- Dynamic imports via `tsx` (TypeScript execution)
- CORS headers for cross-origin requests
- URL parameter extraction (e.g., `:id` → `/api/rooms/:id`)

### Request Flow

```
Browser/Vite Proxy
       │
       ▼
  dev-server.js (port 8889)
       │
       ├── Route matching (method + path pattern)
       ├── URL params extraction
       ├── Body parsing (JSON)
       │
       ▼
  Handler function (e.g., rooms/list.ts)
       │
       ├── requireAuth/requireRole (JWT verification)
       ├── Request validation
       ├── Database operation (via `withConnection`)
       │
       ▼
  Response → JSON envelope
```

### Shared Utilities (`netlify/functions/_shared/`)

| Module | Purpose |
|--------|---------|
| `db.ts` | Oracle DB connection pool + `withConnection` helper |
| `db-mock.ts` | In-memory mock database with full query/insert/update/delete support |
| `jwt.ts` | JWT token creation and verification |
| `middleware.ts` | `requireAuth`, `requireRole`, `requireAdmin`, error classes |
| `response.ts` | `successResponse`, `errorResponse`, `optionsResponse` helpers |
| `row-mapper.ts` | Maps flat Oracle rows to typed objects using column metadata |
| `types.ts` | All database entity interfaces and request/response types |

---

## Mock Database Architecture

When `DB_MODE=mock` in `.env`, the system uses an in-memory mock instead of Oracle.

### Design

- **MockConnection** class implements the same `execute(sql, binds)` interface as the Oracle driver
- SQL parsing is done via `String.toUpperCase()` and pattern matching
- Each table is an in-memory array of objects
- `genId()` auto-increments from 100 for new records

### SQL Support

| Operation | Implementation |
|-----------|---------------|
| `SELECT` | Pattern-matched table detection, filter by binds, column projection |
| `INSERT` | Table detection, object creation from binds, RETURNING support |
| `UPDATE` | Table detection, bind-based field matching, text status extraction |
| `DELETE` | Stub (returns `{ rowsAffected: 0 }`) |
| `MERGE` | Stub (returns `{ rowsAffected: 1 }`) |

### Mock Data

The mock database is pre-seeded with:
- 3 users (admin, reception1, manager1)
- 4 room types, 14 rooms
- 4 guests, 3 reservations, 2 bookings
- 2 check-ins, 1 check-out
- 2 invoices with items and payments
- 3 maintenance issues
- 5 staff members with 13 payroll records
- 10 system settings
- 10 audit log entries

---

## Database Schema

### Entity Relationship

```
USERS ──> ROLES
  │
  ├──> RESERVATIONS ──> GUESTS
  │        │
  │        ▼
  │     BOOKINGS ──> ROOMS ──> ROOM_TYPES
  │        │
  │        ├──> CHECKINS
  │        │        │
  │        │        ▼
  │        │     CHECKOUTS
  │        │
  │        └──> INVOICES
  │                  │
  │                  ├──> INVOICE_ITEMS
  │                  └──> PAYMENTS
  │
  ├──> MAINTENANCE ──> ROOMS
  ├──> AUDIT_LOG
  └──> PAYROLL ──> STAFF
```

### Core Tables (17 total)

| Table | Key Columns | Description |
|-------|-------------|-------------|
| `ROLES` | ROLE_ID, ROLE_NAME | ADMIN, RECEPTIONIST, MANAGER |
| `USERS` | USER_ID, USERNAME, PASSWORD_HASH, ROLE_ID | System login accounts |
| `ROOM_TYPES` | TYPE_ID, TYPE_NAME, BASE_PRICE, MAX_OCCUPANCY | Room categories |
| `ROOMS` | ROOM_ID, ROOM_NUMBER, TYPE_ID, FLOOR, STATUS | Individual rooms |
| `GUESTS` | GUEST_ID, FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_NUMBER | Guest profiles |
| `RESERVATIONS` | RESERVATION_ID, GUEST_ID, ROOM_TYPE_ID, DATES, STATUS | Booking requests |
| `BOOKINGS` | BOOKING_ID, RESERVATION_ID, ROOM_ID, RATE, STATUS | Actual room assignments |
| `CHECKINS` | CHECKIN_ID, BOOKING_ID, ACTUAL_CHECK_IN | Check-in records |
| `CHECKOUTS` | CHECKOUT_ID, CHECKIN_ID, ACTUAL_CHECK_OUT | Check-out records |
| `INVOICES` | INVOICE_ID, BOOKING_ID, GUEST_ID, TOTAL_AMOUNT, STATUS | Billing invoices |
| `INVOICE_ITEMS` | ITEM_ID, INVOICE_ID, DESCRIPTION, QUANTITY, PRICE | Line items |
| `PAYMENTS` | PAYMENT_ID, INVOICE_ID, AMOUNT, METHOD | Payment records |
| `MAINTENANCE` | ID, ROOM_ID, ISSUE_TYPE, STATUS | Maintenance issues |
| `STAFF` | ID, FULL_NAME, DEPARTMENT, POSITION, SALARY | Employee records |
| `PAYROLL` | ID, STAFF_ID, MONTH, SALARY_PAID | Payroll history |
| `SYSTEM_SETTINGS` | SETTING_KEY, SETTING_VALUE | Key-value hotel settings |
| `AUDIT_LOG` | ID, ACTION, ENTITY_TYPE, PERFORMED_BY, DETAILS | Activity audit trail |

---

## Auth Flow

### Authentication Sequence

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { username, password }       │
  │ ───────────────────────────>  │
  │                               ├── Validate credentials
  │                               ├── Check account active/locked
  │                               ├── Generate accessToken (15 min)
  │                               ├── Generate refreshToken (7 days)
  │ <───────────────────────────  │
  │  { user, accessToken,         │
  │    refreshToken }             │
  │                               │
  │  GET /api/rooms               │
  │  Authorization: Bearer <jwt>  │
  │ ───────────────────────────>  │
  │                               ├── Verify JWT signature
  │                               ├── Extract user_id + role
  │                               ├── Execute query
  │ <───────────────────────────  │
  │  { rooms: [...] }             │
```

### Role Authorization

Each handler uses middleware to enforce role-based access:

```typescript
requireAuth(req)                              // Any authenticated user
requireRole(req, ['ADMIN', 'RECEPTIONIST'])   // Specific roles
requireAdmin(req)                             // ADMIN only
```

### Error Classes

| Class | HTTP Status | Usage |
|-------|-------------|-------|
| `AppError` | Custom | Base class for all application errors |
| `BadRequestError` | 400 | Missing/invalid request data |
| `UnauthorizedError` | 401 | Missing or invalid JWT |
| `ForbiddenError` | 403 | Authenticated but wrong role |
| `NotFoundError` | 404 | Resource not found |

---

## Data Flows

### Reservation Lifecycle

```
  PENDING ──(confirm)──> CONFIRMED ──(check-in)──> CHECKED_IN ──(check-out)──> COMPLETED
     │                        │
     └──(cancel)──> CANCELLED  └──(cancel)──> CANCELLED
```

### Check-in Flow

```
1. Verify booking STATUS = 'ACTIVE'
2. Verify room STATUS = 'AVAILABLE'
3. INSERT into CHECKINS
4. UPDATE ROOMS SET STATUS = 'OCCUPIED'
5. UPDATE RESERVATIONS SET STATUS = 'CHECKED_IN'
```

### Check-out Flow

```
1. Verify check-in exists
2. Verify not already checked out
3. INSERT into CHECKOUTS
4. UPDATE ROOMS SET STATUS = 'AVAILABLE'
5. UPDATE BOOKINGS SET STATUS = 'COMPLETED'
6. UPDATE RESERVATIONS SET STATUS = 'COMPLETED'
```

### Billing Flow

```
1. POST /api/billing/invoices
   → Creates invoice with room charges from booking
   → Invoice status = PENDING

2. POST /api/billing/invoices/:id/items
   → Adds line items (mini-bar, room service, etc.)
   → Recalculates total_amount

3. POST /api/billing/invoices/:id/payments
   → Records payment
   → If amount >= total: status → PAID
   → If amount < total: status → PARTIALLY_PAID
```

---

## Deployment

### Netlify Deployment

The `netlify.toml` configuration handles:

```
[build]
  command = "cd frontend && npm run build"
  publish = "frontend/dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[functions]
  node_bundler = "esbuild"
  included_files = ["netlify/functions/_shared/**/*"]

[functions.environment]
  DB_MODE = "mock"
```

### Redirect Rules

```
/api/* → /.netlify/functions/:splat (status 200)
```

### Dev vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Backend** | `dev-server.js` (localhost:8889) | Netlify Functions (serverless) |
| **Frontend** | Vite dev server (localhost:5173) | Static build in `frontend/dist` |
| **Database** | In-memory mock (`DB_MODE=mock`) | Oracle Database |
| **API Proxy** | Vite proxy (`/api` → `:8889`) | Netlify redirect (`/api/*` → functions) |

---

## Technology Stack Summary

| Category | Choice |
|----------|--------|
| Frontend framework | React 18.3 |
| Build tool | Vite 5.4 |
| CSS | Tailwind CSS 3.4 |
| Routing | React Router DOM 6.26 |
| Backend runtime | Node.js 20+ (serverless) |
| Backend language | TypeScript (via tsx) |
| Database | Oracle Database / Mock |
| Authentication | JWT (jsonwebtoken) |
| Password hashing | bcryptjs (mock), SHA-256 (Oracle) |
| Deployment | Netlify |
| Package manager | npm |
| Version control | Git |
