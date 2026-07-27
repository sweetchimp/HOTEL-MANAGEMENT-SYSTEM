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
