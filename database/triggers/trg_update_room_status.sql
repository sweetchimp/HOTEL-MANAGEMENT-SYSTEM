-- ============================================================
-- ALTONSHOTEL Management System
-- Triggers Version: 002
-- Description: Business logic triggers and audit trail
-- Changes: Added exception handlers, removed AUDIT_LOG table
--           creation (now in schema), switched to VARCHAR2(4000),
--           added audit triggers for PAYMENTS, RESERVATIONS, INVOICES
-- Note: Triggers are the single source of truth for room status
--       updates and invoice total recalculation.
-- ============================================================

-- ============================================================
-- TRIGGER: TRG_CHECKOUT_ROOM_STATUS
-- Fires AFTER INSERT ON CHECKOUTS
-- Sets room status back to AVAILABLE after guest checks out
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_CHECKOUT_ROOM_STATUS
AFTER INSERT ON CHECKOUTS
FOR EACH ROW
DECLARE
    v_room_id NUMBER;
BEGIN
    SELECT b.ROOM_ID INTO v_room_id
    FROM CHECKINS ci
    JOIN BOOKINGS b ON ci.BOOKING_ID = b.BOOKING_ID
    WHERE ci.CHECKIN_ID = :NEW.CHECKIN_ID;

    UPDATE ROOMS
    SET STATUS = 'AVAILABLE', UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ROOM_ID = v_room_id;

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- TRIGGER: TRG_CHECKIN_ROOM_STATUS
-- Fires AFTER INSERT ON CHECKINS
-- Sets room status to OCCUPIED when guest checks in
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_CHECKIN_ROOM_STATUS
AFTER INSERT ON CHECKINS
FOR EACH ROW
DECLARE
    v_room_id NUMBER;
BEGIN
    SELECT b.ROOM_ID INTO v_room_id
    FROM BOOKINGS b
    WHERE b.BOOKING_ID = :NEW.BOOKING_ID;

    UPDATE ROOMS
    SET STATUS = 'OCCUPIED', UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ROOM_ID = v_room_id;

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- TRIGGER: TRG_INVOICE_TOTAL_AUTO_UPDATE
-- Fires AFTER INSERT OR UPDATE OR DELETE ON INVOICE_ITEMS
-- Recalculates invoice total whenever items change
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_INVOICE_TOTAL_AUTO_UPDATE
AFTER INSERT OR UPDATE OR DELETE ON INVOICE_ITEMS
FOR EACH ROW
DECLARE
    v_invoice_id NUMBER;
    v_total NUMBER;
BEGIN
    IF INSERTING THEN
        v_invoice_id := :NEW.INVOICE_ID;
    ELSIF DELETING THEN
        v_invoice_id := :OLD.INVOICE_ID;
    ELSE
        v_invoice_id := :NEW.INVOICE_ID;
    END IF;

    SELECT NVL(SUM(TOTAL), 0) INTO v_total
    FROM INVOICE_ITEMS
    WHERE INVOICE_ID = v_invoice_id;

    UPDATE INVOICES
    SET TOTAL_AMOUNT = v_total, UPDATED_AT = CURRENT_TIMESTAMP
    WHERE INVOICE_ID = v_invoice_id;

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- AUDIT TRIGGER: TRG_AUDIT_ROOMS
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_AUDIT_ROOMS
AFTER INSERT OR UPDATE OR DELETE ON ROOMS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_changes := 'Room ' || :NEW.ROOM_NUMBER || ' created';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_changes := '';
        IF NVL(:OLD.STATUS, 'X') != NVL(:NEW.STATUS, 'X') THEN
            v_changes := v_changes || 'Status: ' || :OLD.STATUS || ' -> ' || :NEW.STATUS || '; ';
        END IF;
        IF NVL(:OLD.FLOOR, 0) != NVL(:NEW.FLOOR, 0) THEN
            v_changes := v_changes || 'Floor: ' || :OLD.FLOOR || ' -> ' || :NEW.FLOOR || '; ';
        END IF;
        IF NVL(:OLD.TYPE_ID, 0) != NVL(:NEW.TYPE_ID, 0) THEN
            v_changes := v_changes || 'Type: ' || :OLD.TYPE_ID || ' -> ' || :NEW.TYPE_ID || '; ';
        END IF;
        IF NVL(:OLD.DESCRIPTION, 'X') != NVL(:NEW.DESCRIPTION, 'X') THEN
            v_changes := v_changes || 'Description updated; ';
        END IF;
    ELSE
        v_action := 'DELETE';
        v_changes := 'Room ' || :OLD.ROOM_NUMBER || ' deleted';
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY)
    VALUES (
        'ROOMS',
        NVL(:NEW.ROOM_ID, :OLD.ROOM_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER')
    );

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- AUDIT TRIGGER: TRG_AUDIT_RESERVATIONS
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_AUDIT_RESERVATIONS
AFTER INSERT OR UPDATE OR DELETE ON RESERVATIONS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_changes := 'Reservation created for guest ' || :NEW.GUEST_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_changes := '';
        IF NVL(:OLD.STATUS, 'X') != NVL(:NEW.STATUS, 'X') THEN
            v_changes := v_changes || 'Status: ' || :OLD.STATUS || ' -> ' || :NEW.STATUS || '; ';
        END IF;
        IF :OLD.CHECK_IN_DATE != :NEW.CHECK_IN_DATE THEN
            v_changes := v_changes || 'Check-in: ' || :OLD.CHECK_IN_DATE || ' -> ' || :NEW.CHECK_IN_DATE || '; ';
        END IF;
        IF :OLD.CHECK_OUT_DATE != :NEW.CHECK_OUT_DATE THEN
            v_changes := v_changes || 'Check-out: ' || :OLD.CHECK_OUT_DATE || ' -> ' || :NEW.CHECK_OUT_DATE || '; ';
        END IF;
    ELSE
        v_action := 'DELETE';
        v_changes := 'Reservation ' || :OLD.RESERVATION_ID || ' deleted';
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY)
    VALUES (
        'RESERVATIONS',
        NVL(:NEW.RESERVATION_ID, :OLD.RESERVATION_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER')
    );

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- AUDIT TRIGGER: TRG_AUDIT_INVOICES
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_AUDIT_INVOICES
AFTER INSERT OR UPDATE OR DELETE ON INVOICES
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_changes := 'Invoice created for booking ' || :NEW.BOOKING_ID || ', amount: ' || :NEW.TOTAL_AMOUNT;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_changes := '';
        IF NVL(:OLD.STATUS, 'X') != NVL(:NEW.STATUS, 'X') THEN
            v_changes := v_changes || 'Status: ' || :OLD.STATUS || ' -> ' || :NEW.STATUS || '; ';
        END IF;
        IF NVL(:OLD.TOTAL_AMOUNT, 0) != NVL(:NEW.TOTAL_AMOUNT, 0) THEN
            v_changes := v_changes || 'Amount: ' || :OLD.TOTAL_AMOUNT || ' -> ' || :NEW.TOTAL_AMOUNT || '; ';
        END IF;
    ELSE
        v_action := 'DELETE';
        v_changes := 'Invoice ' || :OLD.INVOICE_ID || ' deleted';
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY)
    VALUES (
        'INVOICES',
        NVL(:NEW.INVOICE_ID, :OLD.INVOICE_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER')
    );

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- AUDIT TRIGGER: TRG_AUDIT_PAYMENTS
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_AUDIT_PAYMENTS
AFTER INSERT OR UPDATE OR DELETE ON PAYMENTS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_changes := 'Payment of ' || :NEW.AMOUNT || ' via ' || :NEW.PAYMENT_METHOD || ' for invoice ' || :NEW.INVOICE_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_changes := '';
        IF NVL(:OLD.AMOUNT, 0) != NVL(:NEW.AMOUNT, 0) THEN
            v_changes := v_changes || 'Amount: ' || :OLD.AMOUNT || ' -> ' || :NEW.AMOUNT || '; ';
        END IF;
        IF NVL(:OLD.PAYMENT_METHOD, 'X') != NVL(:NEW.PAYMENT_METHOD, 'X') THEN
            v_changes := v_changes || 'Method: ' || :OLD.PAYMENT_METHOD || ' -> ' || :NEW.PAYMENT_METHOD || '; ';
        END IF;
    ELSE
        v_action := 'DELETE';
        v_changes := 'Payment ' || :OLD.PAYMENT_ID || ' deleted';
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY)
    VALUES (
        'PAYMENTS',
        NVL(:NEW.PAYMENT_ID, :OLD.PAYMENT_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER')
    );

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/

-- ============================================================
-- AUDIT TRIGGER: TRG_AUDIT_USERS
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_AUDIT_USERS
AFTER INSERT OR UPDATE OR DELETE ON USERS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_changes := 'User ' || :NEW.USERNAME || ' created with role ' || :NEW.ROLE_ID;
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_changes := '';
        IF NVL(:OLD.IS_ACTIVE, 0) != NVL(:NEW.IS_ACTIVE, 0) THEN
            v_changes := v_changes || 'Active: ' || :OLD.IS_ACTIVE || ' -> ' || :NEW.IS_ACTIVE || '; ';
        END IF;
        IF NVL(:OLD.ROLE_ID, 0) != NVL(:NEW.ROLE_ID, 0) THEN
            v_changes := v_changes || 'Role: ' || :OLD.ROLE_ID || ' -> ' || :NEW.ROLE_ID || '; ';
        END IF;
        IF :OLD.PASSWORD_HASH != :NEW.PASSWORD_HASH THEN
            v_changes := v_changes || 'Password changed; ';
        END IF;
    ELSE
        v_action := 'DELETE';
        v_changes := 'User ' || :OLD.USERNAME || ' deleted';
    END IF;

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY)
    VALUES (
        'USERS',
        NVL(:NEW.USER_ID, :OLD.USER_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER')
    );

EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
/
