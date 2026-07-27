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
