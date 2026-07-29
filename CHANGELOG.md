# Changelog

All notable changes to the ALTONSHOTEL Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-27

### Added

- **Project Scaffolding**
  - Vite + React + TypeScript frontend setup
  - Tailwind CSS v3 with custom hotel theme (primary navy, accent gold)
  - React Router v6 with route protection
  - ESLint configuration

- **Frontend Structure**
  - Auth context with JWT token management
  - Protected route component
  - Dashboard layout with role-based sidebar navigation
  - Login page with form validation
  - Page stubs for all modules (Rooms, Guests, Reservations, Check-in/out, Billing, Reports)
  - API client service with token interceptor
  - Shared UI component classes (btn-primary, btn-secondary, card, badge, input-field)
  - TypeScript type definitions for all entities

- **Backend Structure (Netlify Functions)**
  - Oracle Database connection pool (`_shared/db.ts`)
  - Authentication middleware with JWT verification (`_shared/middleware.ts`)
  - Standardized API response utilities (`_shared/response.ts`)
  - Shared TypeScript types (`_shared/types.ts`)
  - Sample auth login function stub

- **Database Schema**
  - 12 normalized tables: ROLES, USERS, ROOM_TYPES, ROOMS, GUESTS, RESERVATIONS, BOOKINGS, CHECKINS, CHECKOUTS, INVOICES, INVOICE_ITEMS, PAYMENTS
  - Comprehensive constraints, foreign keys, and indexes
  - PL/SQL packages: PKG_AUTH, PKG_RESERVATIONS, PKG_BILLING
  - Database triggers: room status updates, invoice total auto-calculation, audit trail
  - Seed data: roles, room types, sample rooms, users, guests

- **Configuration**
  - `.gitignore` with comprehensive exclusions
  - `.env.example` with all environment variables
  - `netlify.toml` with build config, redirects, and security headers

## [0.2.0] - 2026-07-27

### Fixed

- **Schema Hardening**
  - Added `CHECK (FLOOR >= 1)` constraint on ROOMS
  - Added `CHECK` constraint on `GUESTS.ID_TYPE` for valid ID types
  - Added `FAILED_LOGIN_ATTEMPTS` and `LAST_LOGIN` columns to USERS
  - Added `AUDIT_LOG` table to schema (moved from trigger file)
  - Removed redundant `IDX_USERS_USERNAME` index (UNIQUE constraint already creates one)
  - Added composite index `IDX_BOOKINGS_RES_STATUS` on BOOKINGS
  - Removed inline seed data from schema file (now in separate migration)

- **PL/SQL Package Fixes**
  - PKG_AUTH: Fixed `RAWTOHEX()` conversion for password hashing compatibility
  - PKG_AUTH: Added password complexity validation (min 8 chars, uppercase, lowercase, digit)
  - PKG_AUTH: Added login attempt tracking (lock after 5 failures)
  - PKG_AUTH: Added `LAST_LOGIN` timestamp update on successful login
  - PKG_RESERVATIONS: Added room-type validation in CHECK_IN
  - PKG_RESERVATIONS: Added date-range validation (current date within booking window)
  - PKG_RESERVATIONS: Fixed CHECK_AVAILABILITY to exclude PENDING/CONFIRMED reservations
  - PKG_RESERVATIONS: Added DUP_VAL_ON_INDEX handlers in CHECK_OUT
  - PKG_RESERVATIONS: Added room status validation before check-in (must be AVAILABLE)
  - PKG_RESERVATIONS: Added guest and room-type existence validation in CREATE_RESERVATION
  - PKG_BILLING: Fixed floating-point comparison using ROUND()
  - PKG_BILLING: Added PAYMENT_METHOD validation before insert
  - PKG_BILLING: Moved UPDATE_INVOICE_TOTAL to package body (private)
  - PKG_BILLING: Added duplicate invoice check in CREATE_INVOICE
  - PKG_BILLING: Added auto-populate room charges as first invoice item
  - All packages: Replaced WHEN OTHERS with specific exception handlers

- **Trigger Improvements**
  - Added TRG_CHECKIN_ROOM_STATUS trigger (sets room OCCUPIED on check-in)
  - Added exception handlers to all triggers (prevents transaction rollback)
  - Changed audit CHANGES from CLOB to VARCHAR2(4000)
  - Added audit triggers for RESERVATIONS, INVOICES, PAYMENTS, USERS
  - Expanded ROOMS audit to capture floor, type, and description changes

### Added

- **Idempotent Seed Data** (`database/migrations/001_idempotent_seed.sql`)
  - All MERGE statements (safe to re-run)
  - Proper password hashes using RAWTOHEX(DBMS_CRYPTO.HASH(...))
  - 3 users (admin, receptionist, manager) — password: Admin123!
  - 14 rooms across 6 floors
  - 4 guests with varied ID types
  - 3 test scenarios:
    - Completed workflow (guest stayed 3 nights, fully paid)
    - Active stay (guest currently checked in, partial payment)
    - Upcoming reservation (confirmed, not yet checked in)

## [0.3.0] - 2026-07-27

### Added

- **Backend Infrastructure**
  - Root `package.json` with backend dependencies (oracledb, jsonwebtoken, bcryptjs)
  - `withConnection()` wrapper for guaranteed connection release in serverless
  - `testConnection()` health check function
  - Mock DB layer (`_shared/db-mock.ts`) for local development without Oracle
  - DB_MODE env var to switch between mock and real Oracle
  - Row mapper utility for converting Oracle result arrays to typed objects
  - JWT utility (`_shared/jwt.ts`) for token generation and verification
  - Pagination response utility in `_shared/response.ts`
  - DB entity types for all 12 tables in `_shared/types.ts`
  - Request/response types for all modules

- **Authentication Endpoints**
  - `POST /api/auth/login` — Real Oracle DB authentication with bcrypt
  - `POST /api/auth/refresh` — JWT refresh token rotation
  - `GET /api/auth/me` — Current user profile
  - `POST /api/auth/change-password` — Password change with validation
  - Login attempt tracking and account lockout after 5 failures

- **Rooms Module (7 endpoints)**
  - `GET /api/rooms` — List with filters (status, type, floor) and pagination
  - `GET /api/rooms/:id` — Single room detail
  - `POST /api/rooms` — Create room (admin only)
  - `PUT /api/rooms/:id` — Update room (admin only)
  - `DELETE /api/rooms/:id` — Delete room (admin only)
  - `PATCH /api/rooms/:id/status` — Change room status (admin only)
  - `GET /api/rooms/types` — List room types

- **Guests Module (5 endpoints)**
  - `GET /api/guests` — List with search and pagination
  - `GET /api/guests/:id` — Guest profile
  - `POST /api/guests` — Register new guest
  - `PUT /api/guests/:id` — Update guest info
  - `GET /api/guests/search?q=` — Autocomplete search

- **Reservations Module (7 endpoints)**
  - `GET /api/reservations` — List with filters (status, guest, date range)
  - `GET /api/reservations/:id` — Reservation detail
  - `POST /api/reservations` — Create with availability check
  - `PUT /api/reservations/:id` — Modify reservation
  - `POST /api/reservations/:id/cancel` — Cancel reservation
  - `POST /api/reservations/:id/confirm` — Confirm reservation
  - `GET /api/reservations/availability` — Check room availability for dates

### Changed

- **Frontend API Client** (`services/api.ts`)
  - Added automatic token refresh on 401 (attempts refresh before logout)
  - Added network error handling
  - Added graceful non-JSON response handling

- **Frontend Types** (`types/index.ts`)
  - `Booking.status` typed as `BookingStatus` union type
  - `Booking` interface updated to match DB schema (flat IDs instead of nested objects)

- **netlify.toml**
  - Added `NODE_VERSION = "20"`
  - Added `DB_MODE = "mock"` for local dev

### Infrastructure

- 24 new backend files across auth, rooms, guests, reservations
- 9 modified files (configs, DB layer, types, frontend)
- Total backend: 17 API endpoints ready for testing

## [0.5.0] - 2026-07-29

### Added

- **Welcome Page** — Navy gradient landing page with ALTONS HOTEL branding, feature list, and "Go to Dashboard" button; replaces login as the entry point

### Changed

- **AuthProvider** — Auto-sets ADMIN user on mount (no login required in dev mode); `isAuthenticated` always `true`; removed `login` method
- **AuthContext** — Simplified interface (removed `login`)
- **App.tsx** — `/` points to WelcomePage, `/dashboard` and child routes protected but auto-authenticated; removed `/login` route
- **LoginPage** — Removed (unused)

## [0.4.0] - 2026-07-28

### Added

- **Dashboard Stats Endpoint**
  - `GET /api/dashboard/stats` — Today's arrivals, departures, occupancy rate, revenue
  - Returns real-time metrics from DB aggregations

- **Check-in Module (2 endpoints)**
  - `POST /api/checkin/process` — Process guest check-in with room assignment
  - `GET /api/checkin/list` — List all check-ins with guest/room details (JOIN query)

- **Check-out Module (2 endpoints)**
  - `POST /api/checkout/process` — Process guest check-out, auto-complete booking/reservation
  - `GET /api/checkout/list` — List all check-outs with full guest/room details (JOIN query)

### Changed

- **Dashboard Page** — Fetches real stats from API, loading states, error handling

- **Rooms Page** — Full CRUD with table view, status/type/floor filters, pagination, admin-only actions (create/edit/delete/status change), modal form

- **Guests Page** — Full CRUD with table view, debounced search, pagination, modal form with ID type dropdown

- **Reservations Page** — Full CRUD with table view, status filter, guest search autocomplete, confirm/cancel actions, modal form with date pickers

- **Check-in Page** — Shows confirmed arrivals, room availability check, check-in processing with room assignment, recent check-ins history

- **Check-out Page** — Shows current guests, check-out processing with notes, recent check-outs history

- **Frontend Types** — Added DashboardStats, CheckinRecord, CheckoutRecord, RoomListItem, GuestListItem, ReservationListItem interfaces

- **Mock DB** — Enhanced to handle JOIN queries (checkin/checkout lists), dashboard COUNT/SUM queries, subquery UPDATEs, text status values in SQL

### Infrastructure

- 6 new backend files (dashboard/stats, checkin/process, checkin/list, checkout/process, checkout/list)
- 7 modified frontend pages (Dashboard, Rooms, Guests, Reservations, Check-in, Check-out)
- 2 modified backend files (mock DB, types)
- Total backend: 23 API endpoints (4 new)
