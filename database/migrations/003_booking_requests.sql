-- ============================================================
-- ALTONSHOTEL Management System
-- Schema Migration Version: 003
-- Description: Add BOOKING_REQUESTS table for the public
--              customer-facing booking workflow.
-- Author: AHMS Development Team
-- Date: 2026-10-08
--
-- Safe to re-run (guard included)
-- ============================================================

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'BOOKING_REQUESTS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE BOOKING_REQUESTS (
                ID                NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                GUEST_NAME        VARCHAR2(120) NOT NULL,
                GUEST_EMAIL       VARCHAR2(120) NOT NULL,
                GUEST_PHONE       VARCHAR2(40) NOT NULL,
                ID_TYPE           VARCHAR2(20) NOT NULL
                                  CHECK (ID_TYPE IN (''PASSPORT'',''NATIONAL_ID'',''DRIVERS_LICENSE'',''OTHER'')),
                ID_NUMBER         VARCHAR2(60) NOT NULL,
                ROOM_TYPE_ID      NUMBER NOT NULL REFERENCES ROOM_TYPES(TYPE_ID),
                ROOM_ID           NUMBER REFERENCES ROOMS(ROOM_ID),
                CHECK_IN_DATE     DATE NOT NULL,
                CHECK_OUT_DATE    DATE NOT NULL,
                NUM_GUESTS        NUMBER(2) NOT NULL,
                TOTAL_PRICE       NUMBER(10,2) NOT NULL,
                SPECIAL_REQUESTS  VARCHAR2(1000),
                PAYMENT_METHOD    VARCHAR2(20),
                PROMO_CODE        VARCHAR2(30),
                STATUS            VARCHAR2(20) DEFAULT ''pending''
                                  CHECK (STATUS IN (''pending'',''approved'',''rejected'')),
                REJECTION_REASON  VARCHAR2(500),
                NOTES             VARCHAR2(1000),
                APPROVED_BY       NUMBER REFERENCES USERS(USER_ID),
                APPROVED_AT       TIMESTAMP,
                CREATED_AT        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UPDATED_AT        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_BOOKING_REQUESTS_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_BOOKING_REQUESTS_STATUS ON BOOKING_REQUESTS(STATUS)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_BOOKING_REQUESTS_DATES';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_BOOKING_REQUESTS_DATES ON BOOKING_REQUESTS(CHECK_IN_DATE, CHECK_OUT_DATE)';
    END IF;
END;
/
