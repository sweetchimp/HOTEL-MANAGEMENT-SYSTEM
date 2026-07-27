-- ============================================================
-- Trigger: TRG_UPDATE_ROOM_STATUS
-- Description: Auto-update room status on check-in/check-out
-- ============================================================

CREATE OR REPLACE TRIGGER TRG_UPDATE_ROOM_STATUS
AFTER INSERT ON CHECKOUTS
FOR EACH ROW
DECLARE
    v_room_id NUMBER;
BEGIN
    -- Get the room_id from the booking associated with this check-in
    SELECT b.ROOM_ID INTO v_room_id
    FROM CHECKINS ci
    JOIN BOOKINGS b ON ci.BOOKING_ID = b.BOOKING_ID
    WHERE ci.CHECKIN_ID = :NEW.CHECKIN_ID;

    -- Set room back to available
    UPDATE ROOMS
    SET STATUS = 'AVAILABLE', UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ROOM_ID = v_room_id;
END;
/

-- ============================================================
-- Trigger: TRG_INVOICE_TOTAL_AUTO_UPDATE
-- Description: Auto-update invoice total when items change
-- ============================================================

CREATE OR REPLACE TRIGGER TRG_INVOICE_TOTAL_AUTO_UPDATE
AFTER INSERT OR UPDATE OR DELETE ON INVOICE_ITEMS
FOR EACH ROW
DECLARE
    v_invoice_id NUMBER;
    v_total NUMBER;
BEGIN
    -- Determine which invoice to update
    IF INSERTING THEN
        v_invoice_id := :NEW.INVOICE_ID;
    ELSIF DELETING THEN
        v_invoice_id := :OLD.INVOICE_ID;
    ELSE
        v_invoice_id := :NEW.INVOICE_ID;
    END IF;

    -- Recalculate total
    SELECT NVL(SUM(TOTAL), 0) INTO v_total
    FROM INVOICE_ITEMS
    WHERE INVOICE_ID = v_invoice_id;

    UPDATE INVOICES
    SET TOTAL_AMOUNT = v_total, UPDATED_AT = CURRENT_TIMESTAMP
    WHERE INVOICE_ID = v_invoice_id;
END;
/

-- ============================================================
-- Trigger: TRG_AUDIT_TRAIL
-- Description: Audit trail for critical table changes
-- ============================================================

-- Create audit table first
CREATE TABLE AUDIT_LOG (
    AUDIT_ID      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    TABLE_NAME    VARCHAR2(50) NOT NULL,
    RECORD_ID     NUMBER NOT NULL,
    ACTION        VARCHAR2(10) NOT NULL,
    CHANGES       CLOB,
    PERFORMED_BY  VARCHAR2(50),
    PERFORMED_AT  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER TRG_AUDIT_ROOMS
AFTER INSERT OR UPDATE OR DELETE ON ROOMS
FOR EACH ROW
DECLARE
    v_action VARCHAR2(10);
    v_changes CLOB;
BEGIN
    IF INSERTING THEN
        v_action := 'INSERT';
        v_changes := 'Room ' || :NEW.ROOM_NUMBER || ' created';
    ELSIF UPDATING THEN
        v_action := 'UPDATE';
        v_changes := '';
        IF :OLD.STATUS != :NEW.STATUS THEN
            v_changes := v_changes || 'Status: ' || :OLD.STATUS || ' -> ' || :NEW.STATUS || '; ';
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
END;
/
