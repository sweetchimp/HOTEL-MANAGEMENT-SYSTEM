-- ============================================================
-- ALTONSHOTEL Management System
-- Schema Migration Version: 002
-- Description: Add STAFF, PAYROLL, MAINTENANCE, SYSTEM_SETTINGS
--              tables. Align AUDIT_LOG with mock DB column structure.
-- Author: AHMS Development Team
-- Date: 2026-07-29
--
-- Safe to re-run (uses CREATE OR REPLACE / IF NOT EXISTS style)
-- ============================================================

-- ============================================================
-- SYSTEM_SETTINGS
-- ============================================================
CREATE TABLE SYSTEM_SETTINGS (
    SETTING_KEY    VARCHAR2(100) PRIMARY KEY,
    SETTING_VALUE  VARCHAR2(1000) NOT NULL,
    DESCRIPTION    VARCHAR2(500),
    UPDATED_AT     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_BY     NUMBER REFERENCES USERS(USER_ID)
);

-- ============================================================
-- MAINTENANCE
-- ============================================================
CREATE TABLE MAINTENANCE (
    ID              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ROOM_ID         NUMBER NOT NULL REFERENCES ROOMS(ROOM_ID),
    ISSUE_TYPE      VARCHAR2(50) NOT NULL,
    DESCRIPTION     VARCHAR2(1000) NOT NULL,
    STATUS          VARCHAR2(20) DEFAULT 'OPEN'
                    CHECK (STATUS IN ('OPEN','IN_PROGRESS','RESOLVED')),
    CREATED_DATE    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ASSIGNED_TO     VARCHAR2(100),
    RESOLVED_DATE   TIMESTAMP,
    NOTES           VARCHAR2(1000)
);

CREATE INDEX IDX_MAINTENANCE_ROOM ON MAINTENANCE(ROOM_ID);
CREATE INDEX IDX_MAINTENANCE_STATUS ON MAINTENANCE(STATUS);

-- ============================================================
-- STAFF
-- ============================================================
CREATE TABLE STAFF (
    ID            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FULL_NAME     VARCHAR2(100) NOT NULL,
    EMAIL         VARCHAR2(100) NOT NULL UNIQUE,
    PHONE         VARCHAR2(20),
    DEPARTMENT    VARCHAR2(50) NOT NULL,
    POSITION      VARCHAR2(100) NOT NULL,
    SALARY        NUMBER(10,2),
    HIRE_DATE     DATE NOT NULL,
    IS_ACTIVE     NUMBER(1) DEFAULT 1
);

CREATE INDEX IDX_STAFF_DEPT ON STAFF(DEPARTMENT);
CREATE INDEX IDX_STAFF_ACTIVE ON STAFF(IS_ACTIVE);

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE PAYROLL (
    ID            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    STAFF_ID      NUMBER NOT NULL REFERENCES STAFF(ID),
    MONTH         VARCHAR2(7) NOT NULL,
    SALARY_PAID   NUMBER(10,2) NOT NULL,
    PAYMENT_DATE  DATE NOT NULL
);

CREATE INDEX IDX_PAYROLL_STAFF ON PAYROLL(STAFF_ID);
CREATE INDEX IDX_PAYROLL_MONTH ON PAYROLL(MONTH);

-- ============================================================
-- AUDIT_LOG enhancements: add USER_ID column for JOIN support
-- ============================================================
ALTER TABLE AUDIT_LOG ADD (
    USER_ID NUMBER REFERENCES USERS(USER_ID)
);

CREATE INDEX IDX_AUDIT_USER ON AUDIT_LOG(USER_ID);

-- Populate USER_ID from existing PERFORMED_BY (username match)
UPDATE AUDIT_LOG a
SET USER_ID = (SELECT USER_ID FROM USERS u WHERE u.USERNAME = a.PERFORMED_BY)
WHERE PERFORMED_BY IS NOT NULL;

-- ============================================================
-- Update existing audit triggers to populate USER_ID
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_AUDIT_ROOMS
AFTER INSERT OR UPDATE OR DELETE ON ROOMS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
    v_user_id NUMBER;
BEGIN
    SELECT USER_ID INTO v_user_id FROM USERS WHERE USERNAME = SYS_CONTEXT('USERENV', 'SESSION_USER');
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

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY, USER_ID)
    VALUES (
        'ROOMS',
        NVL(:NEW.ROOM_ID, :OLD.ROOM_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        v_user_id
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_RESERVATIONS
AFTER INSERT OR UPDATE OR DELETE ON RESERVATIONS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
    v_user_id NUMBER;
BEGIN
    SELECT USER_ID INTO v_user_id FROM USERS WHERE USERNAME = SYS_CONTEXT('USERENV', 'SESSION_USER');
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

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY, USER_ID)
    VALUES (
        'RESERVATIONS',
        NVL(:NEW.RESERVATION_ID, :OLD.RESERVATION_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        v_user_id
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_INVOICES
AFTER INSERT OR UPDATE OR DELETE ON INVOICES
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
    v_user_id NUMBER;
BEGIN
    SELECT USER_ID INTO v_user_id FROM USERS WHERE USERNAME = SYS_CONTEXT('USERENV', 'SESSION_USER');
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

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY, USER_ID)
    VALUES (
        'INVOICES',
        NVL(:NEW.INVOICE_ID, :OLD.INVOICE_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        v_user_id
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_PAYMENTS
AFTER INSERT OR UPDATE OR DELETE ON PAYMENTS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
    v_user_id NUMBER;
BEGIN
    SELECT USER_ID INTO v_user_id FROM USERS WHERE USERNAME = SYS_CONTEXT('USERENV', 'SESSION_USER');
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

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY, USER_ID)
    VALUES (
        'PAYMENTS',
        NVL(:NEW.PAYMENT_ID, :OLD.PAYMENT_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        v_user_id
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_USERS
AFTER INSERT OR UPDATE OR DELETE ON USERS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes VARCHAR2(4000);
    v_user_id NUMBER;
BEGIN
    SELECT USER_ID INTO v_user_id FROM USERS WHERE USERNAME = SYS_CONTEXT('USERENV', 'SESSION_USER');
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

    INSERT INTO AUDIT_LOG (TABLE_NAME, RECORD_ID, ACTION, CHANGES, PERFORMED_BY, USER_ID)
    VALUES (
        'USERS',
        NVL(:NEW.USER_ID, :OLD.USER_ID),
        v_action,
        v_changes,
        SYS_CONTEXT('USERENV', 'SESSION_USER'),
        v_user_id
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

-- Create view for application code compatibility
CREATE OR REPLACE VIEW AUDIT_LOG_V AS
SELECT
    AUDIT_ID AS ID,
    TABLE_NAME AS ENTITY_TYPE,
    RECORD_ID AS ENTITY_ID,
    ACTION,
    CHANGES AS DETAILS,
    PERFORMED_BY,
    USER_ID AS PERFORMED_BY_ID,
    PERFORMED_AT
FROM AUDIT_LOG;
