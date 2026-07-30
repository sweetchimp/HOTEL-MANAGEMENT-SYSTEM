# ALTONSHOTEL User Guide

A guide for hotel staff on using the ALTONSHOTEL Management System.

---

## 1. Getting Started

### Logging In

1. Open the ALTONSHOTEL application in your browser
2. Enter your **username** and **password**
3. Click **Sign In**

Your role determines what you can see and do:
- **ADMIN** — Full access to all features including settings, users, and audit log
- **RECEPTIONIST** — Front desk operations: check-in, check-out, reservations, billing
- **MANAGER** — Reports, staff management, maintenance resolution

---

## 2. Dashboard

The dashboard is the first screen you see after logging in. It shows real-time hotel statistics:

| Metric | Description |
|--------|-------------|
| **Today's Arrivals** | Number of guests expected to check in today |
| **Today's Departures** | Number of guests expected to check out today |
| **Occupancy Rate** | Percentage of rooms currently occupied |
| **Today's Revenue** | Total revenue generated today |

Use the sidebar on the left to navigate between modules.

---

## 3. Room Management

### Viewing Rooms

Navigate to **Rooms** in the sidebar. You'll see a list of all rooms with their:
- Room number
- Type (Standard, Deluxe, Suite, Presidential)
- Floor
- Current status (color-coded)

### Room Statuses

| Status | Meaning |
|--------|---------|
| **Available** | Room is clean and ready for guests |
| **Occupied** | Guest is currently staying in the room |
| **Maintenance** | Room is being repaired or serviced |
| **Reserved** | Room is booked for an upcoming arrival |

### Adding a New Room

1. Go to **Rooms**
2. Click **Add Room**
3. Enter the room number, select the type and floor
4. Add an optional description
5. Click **Save**

### Updating Room Status

1. Find the room in the list
2. Click **Edit Status**
3. Select the new status from the dropdown
4. Click **Save**

### Deleting a Room

1. Find the room in the list
2. Click **Delete**
3. Confirm the action

### Room Types and Pricing

| Type | Description | Base Price | Max Occupancy |
|------|-------------|------------|---------------|
| Standard | Single room with basic amenities | $80/night | 2 guests |
| Deluxe | Spacious room with premium amenities | $150/night | 2 guests |
| Suite | Luxury suite with separate living area | $250/night | 4 guests |
| Presidential | Top-floor suite with panoramic views | $500/night | 4 guests |

---

## 4. Guest Management

### Adding a Guest

1. Go to **Guests**
2. Click **Add Guest**
3. Fill in required information:
   - First name and last name
   - Phone number
   - ID type and ID number (Passport, Driver's License, National ID)
4. Add optional details: email, address, nationality
5. Click **Save**

### Searching for Guests

1. Go to **Guests**
2. Use the **search bar** to find guests by name, email, phone, or ID number
3. Results update as you type

### Updating Guest Information

1. Find the guest using search or the guest list
2. Click on the guest's name
3. Edit the fields you need to change
4. Click **Save**

---

## 5. Reservations

### Creating a Reservation

1. Go to **Reservations**
2. Click **New Reservation**
3. Select the **guest** (search by name)
4. Choose the **room type**
5. Select **check-in** and **check-out dates**
6. Add any **special requests** (e.g., "Non-smoking", "Extra pillows")
7. Click **Create Reservation**

The reservation is created in **PENDING** status.

### Confirming a Reservation

A PENDING reservation needs to be confirmed before check-in:
1. Go to **Reservations**
2. Find the PENDING reservation
3. Click **Confirm**
4. The status changes to **CONFIRMED**

### Checking Availability

Before creating a reservation, you can check if rooms are available:
1. Go to **Reservations**
2. Click **Check Availability**
3. Enter dates and room type
4. The system shows available rooms

### Cancelling a Reservation

1. Go to **Reservations**
2. Find the reservation (must be PENDING or CONFIRMED)
3. Click **Cancel**
4. The status changes to **CANCELLED**

### Reservation Status Lifecycle

```
PENDING → CONFIRMED → CHECKED_IN → COMPLETED
  |          |
  +---> CANCELLED    +---> CANCELLED
```

---

## 6. Check-in Process

### Before Check-in

Ensure the reservation is **CONFIRMED** and a room has been assigned.

### Checking In a Guest

1. Go to **Check-in**
2. You'll see a list of guests expected to arrive today
3. Select the booking to check in
4. Choose an **available room** from the list
5. Add optional notes (e.g., "ID verified")
6. Click **Check In**

### What Happens During Check-in

When you check in a guest:
- The room status changes to **OCCUPIED**
- The reservation status changes to **CHECKED_IN**
- A check-in record is created with timestamp

### Viewing Checked-in Guests

Go to **Check-in** to see all currently checked-in guests with their room assignments.

---

## 7. Check-out Process

### Before Check-out

Review the guest's invoice for any outstanding charges (mini-bar, room service, etc.).

### Checking Out a Guest

1. Go to **Check-out**
2. Find the guest who is checking out
3. Review their **final invoice** (balance, items, payments)
4. Add any **final charges** if needed
5. Process any **final payment**
6. Click **Check Out**

### What Happens During Check-out

When you check out a guest:
- The room status changes to **AVAILABLE**
- The reservation status changes to **COMPLETED**
- A check-out record is created with timestamp
- The booking is marked as **COMPLETED**

---

## 8. Billing

### Invoice Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Invoice created, no payments yet |
| **Partially Paid** | Some payments received, balance remains |
| **Paid** | Full amount received |
| **Cancelled** | Invoice voided |

### Creating an Invoice

1. Go to **Billing**
2. Click **New Invoice**
3. Enter the **booking ID**
4. The system creates an invoice and auto-adds the room charges
5. The invoice starts in **PENDING** status

### Adding Items to an Invoice

1. Find the invoice (must not be PAID or CANCELLED)
2. Click **Add Item**
3. Enter a **description** (e.g., "Mini-bar", "Room service", "Laundry")
4. Enter **quantity** and **unit price**
5. Click **Add**
6. The system recalculates the total

### Recording a Payment

1. Find the invoice
2. Click **Record Payment**
3. Enter the **amount**
4. Select the **payment method** (Cash, Card, Bank Transfer)
5. Add an optional **reference number** (e.g., transaction ID)
6. Click **Record**

The system automatically updates the invoice status:
- If payment = total → **Paid**
- If payment < total → **Partially Paid**

### Viewing Balance

1. Open an invoice
2. The balance panel shows:
   - **Total amount** charged
   - **Total paid** so far
   - **Outstanding balance**

---

## 9. Reports

### Occupancy Report

1. Go to **Reports**
2. View the **Occupancy** chart showing monthly occupancy rates
3. Use the dropdown to adjust the number of months displayed

### Revenue Report

1. Go to **Reports**
2. View the **Revenue** chart showing monthly revenue
3. Hover over data points for exact amounts

### Guest Statistics

1. Go to **Reports**
2. View **Popular Guests** to see your most frequent visitors
3. View **Room Type Performance** to see which room types generate the most revenue

### Summary

The **Summary** section shows key metrics at a glance:
- Total rooms and occupancy rate
- Total guests and reservations
- Completed bookings
- Total revenue
- Average rate per night
- Average stay length

---

## 10. Maintenance

### Reporting an Issue

1. Go to **Maintenance**
2. Click **Report Issue**
3. Select the **room** with the problem
4. Choose the **issue type** (Plumbing, Electrical, HVAC, etc.)
5. Describe the issue in detail
6. Click **Submit**

The issue is created in **OPEN** status.

### Viewing Maintenance Records

Go to **Maintenance** to see all reported issues with their current status:
- **OPEN** — Reported, not yet assigned
- **IN_PROGRESS** — Being worked on
- **RESOLVED** — Fixed and closed

### Resolving an Issue

1. Find the issue in the list
2. Click **Resolve**
3. Add resolution notes
4. Click **Confirm**

The issue status changes to **RESOLVED**.

---

## 11. Housekeeping

### Viewing Tasks

1. Go to **Housekeeping**
2. You'll see a list of rooms that need cleaning today (guests checking out)
3. Each task shows: room number, guest name, check-out date

### Completing a Task

1. Find the room that has been cleaned
2. Click **Complete**
3. Enter the staff member's name
4. Click **Confirm**
5. The room is marked as **AVAILABLE** for the next guest

---

## 12. Staff Management

### Adding a Staff Member

1. Go to **Staff**
2. Click **Add Staff**
3. Enter:
   - Full name
   - Email address
   - Phone number
   - Department (e.g., Front Desk, Housekeeping, Maintenance)
   - Position (e.g., Receptionist, Housekeeper, Technician)
   - Salary
   - Hire date
4. Click **Save**

### Viewing Payroll

1. Go to **Staff**
2. Click on a staff member's name
3. You'll see their payroll history with monthly records

### Deactivating a Staff Member

1. Find the staff member
2. Click **Deactivate**
3. The member is marked inactive but their records are preserved

---

## 13. Settings (Admin Only)

### Editing Hotel Information

1. Go to **Settings**
2. You can update:
   - **Hotel name** — Displayed on invoices and reports
   - **Address** — Hotel location
   - **Phone** — Main contact number
   - **Email** — Contact email address

### Configuring Business Rules

- **Tax rate** — Default tax percentage for invoices
- **Currency** — Default currency (e.g., USD)
- **Check-in time** — Standard check-in hour
- **Check-out time** — Standard check-out hour
- **Max guests per booking** — Maximum allowed per reservation
- **Cancellation policy** — Text displayed to guests

To update: change the value and click **Save Settings**.

---

## 14. Audit Log (Admin Only)

### Viewing Activity

1. Go to **Audit Log**
2. You'll see a chronological list of all system actions
3. Each entry shows: who performed the action, what they did, and when

### Filtering the Log

Use the filters to narrow down results:
- **Action** — Filter by type (CREATE, UPDATE, DELETE, LOGIN, CHECKIN, etc.)
- **Entity** — Filter by module (GUEST, ROOM, RESERVATION, INVOICE, etc.)
- **Date Range** — Filter by time period

### Why the Audit Log Matters

The audit trail helps with:
- Security monitoring — see who logged in and when
- Dispute resolution — track changes to guest records and invoices
- Compliance — maintain records for accounting and regulations

---

## 15. Common Tasks (Quick Reference)

| Task | Navigation | Steps |
|------|-----------|-------|
| Check in a guest | Check-in | Find reservation → Select room → Click Check In |
| Check out a guest | Check-out | Find guest → Review invoice → Click Check Out |
| Create a reservation | Reservations | New Reservation → Select guest/room/dates → Save |
| Record a payment | Billing | Find invoice → Record Payment → Enter amount → Save |
| Report a maintenance issue | Maintenance | Report Issue → Select room → Describe → Submit |
| Add a new room | Rooms | Add Room → Enter details → Save |
| Search for a guest | Guests | Type name in search bar |
| View today's arrivals | Dashboard | View the arrivals counter |

---

## 16. Troubleshooting

### Can't log in?
- Check your username and password
- Contact an administrator if your account is locked
- Admins can reset passwords

### Room shows as unavailable?
- Check if it's under maintenance or occupied
- Available rooms may change as guests check in/out

### Invoice won't accept payment?
- The invoice may already be marked as PAID
- Payment amount cannot exceed the outstanding balance
- Only CASH, CARD, and BANK_TRANSFER are accepted methods

### Need help?
Contact your system administrator or refer to the technical documentation.
