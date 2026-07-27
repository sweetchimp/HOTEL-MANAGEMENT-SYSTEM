-- ============================================================
-- Package: PKG_BILLING
-- Version: 002
-- Description: Billing and payment management procedures
-- Changes: Fixed float comparison, moved UPDATE_INVOICE_TOTAL
--           to body only (private), added auto room charge on
--           invoice creation, improved exception handling,
--           removed redundant UPDATE_INVOICE_TOTAL call
--           (trigger handles it)
-- ============================================================

CREATE OR REPLACE PACKAGE PKG_BILLING AS
    PROCEDURE CREATE_INVOICE(
        p_booking_id IN NUMBER,
        p_invoice_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    PROCEDURE ADD_INVOICE_ITEM(
        p_invoice_id IN NUMBER,
        p_description IN VARCHAR2,
        p_quantity IN NUMBER,
        p_unit_price IN NUMBER,
        p_item_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    PROCEDURE RECORD_PAYMENT(
        p_invoice_id IN NUMBER,
        p_amount IN NUMBER,
        p_payment_method IN VARCHAR2,
        p_reference_number IN VARCHAR2,
        p_received_by IN NUMBER,
        p_payment_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    FUNCTION GET_INVOICE_BALANCE(p_invoice_id IN NUMBER) RETURN NUMBER;
END PKG_BILLING;
/

CREATE OR REPLACE PACKAGE BODY PKG_BILLING AS

    PROCEDURE UPDATE_INVOICE_TOTAL(p_invoice_id IN NUMBER) IS
        v_total NUMBER;
    BEGIN
        SELECT NVL(SUM(TOTAL), 0) INTO v_total
        FROM INVOICE_ITEMS WHERE INVOICE_ID = p_invoice_id;

        UPDATE INVOICES SET TOTAL_AMOUNT = v_total, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE INVOICE_ID = p_invoice_id;
    END UPDATE_INVOICE_TOTAL;

    PROCEDURE CREATE_INVOICE(
        p_booking_id IN NUMBER,
        p_invoice_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_guest_id NUMBER;
        v_booking BOOKINGS%ROWTYPE;
        v_existing NUMBER;
        v_room_desc VARCHAR2(200);
        v_nights NUMBER;
        v_room_total NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_existing
        FROM INVOICES
        WHERE BOOKING_ID = p_booking_id AND STATUS != 'CANCELLED';

        IF v_existing > 0 THEN
            p_result := 'INVOICE_ALREADY_EXISTS';
            RETURN;
        END IF;

        SELECT b.GUEST_ID, b.BOOKING_ID, b.CHECK_IN_DATE, b.CHECK_OUT_DATE, b.RATE_PER_NIGHT
        INTO v_guest_id, v_booking.BOOKING_ID, v_booking.CHECK_IN_DATE, v_booking.CHECK_OUT_DATE, v_booking.RATE_PER_NIGHT
        FROM BOOKINGS b
        WHERE b.BOOKING_ID = p_booking_id;

        SELECT r.ROOM_NUMBER || ' - ' || rt.TYPE_NAME
        INTO v_room_desc
        FROM BOOKINGS b
        JOIN ROOMS r ON b.ROOM_ID = r.ROOM_ID
        JOIN ROOM_TYPES rt ON r.TYPE_ID = rt.TYPE_ID
        WHERE b.BOOKING_ID = p_booking_id;

        INSERT INTO INVOICES (BOOKING_ID, GUEST_ID)
        VALUES (p_booking_id, v_guest_id)
        RETURNING INVOICE_ID INTO p_invoice_id;

        v_nights := v_booking.CHECK_OUT_DATE - v_booking.CHECK_IN_DATE;
        IF v_nights < 1 THEN v_nights := 1; END IF;
        v_room_total := v_booking.RATE_PER_NIGHT * v_nights;

        INSERT INTO INVOICE_ITEMS (INVOICE_ID, DESCRIPTION, QUANTITY, UNIT_PRICE)
        VALUES (p_invoice_id, 'Room: ' || v_room_desc || ' (' || v_nights || ' nights)', 1, v_room_total);

        p_result := 'SUCCESS';

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'BOOKING_NOT_FOUND';
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END CREATE_INVOICE;

    PROCEDURE ADD_INVOICE_ITEM(
        p_invoice_id IN NUMBER,
        p_description IN VARCHAR2,
        p_quantity IN NUMBER,
        p_unit_price IN NUMBER,
        p_item_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_inv_status VARCHAR2(20);
    BEGIN
        SELECT STATUS INTO v_inv_status
        FROM INVOICES WHERE INVOICE_ID = p_invoice_id;

        IF v_inv_status = 'PAID' THEN
            p_result := 'INVOICE_ALREADY_PAID';
            RETURN;
        END IF;

        IF v_inv_status = 'CANCELLED' THEN
            p_result := 'INVOICE_CANCELLED';
            RETURN;
        END IF;

        INSERT INTO INVOICE_ITEMS (INVOICE_ID, DESCRIPTION, QUANTITY, UNIT_PRICE)
        VALUES (p_invoice_id, p_description, p_quantity, p_unit_price)
        RETURNING ITEM_ID INTO p_item_id;

        p_result := 'SUCCESS';

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'INVOICE_NOT_FOUND';
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END ADD_INVOICE_ITEM;

    PROCEDURE RECORD_PAYMENT(
        p_invoice_id IN NUMBER,
        p_amount IN NUMBER,
        p_payment_method IN VARCHAR2,
        p_reference_number IN VARCHAR2,
        p_received_by IN NUMBER,
        p_payment_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_balance NUMBER;
        v_inv_status VARCHAR2(20);
    BEGIN
        IF p_payment_method NOT IN ('CASH', 'CARD', 'BANK_TRANSFER') THEN
            p_result := 'INVALID_PAYMENT_METHOD';
            RETURN;
        END IF;

        IF p_amount <= 0 THEN
            p_result := 'AMOUNT_MUST_BE_POSITIVE';
            RETURN;
        END IF;

        SELECT STATUS INTO v_inv_status
        FROM INVOICES WHERE INVOICE_ID = p_invoice_id;

        IF v_inv_status = 'PAID' THEN
            p_result := 'INVOICE_ALREADY_PAID';
            RETURN;
        END IF;

        IF v_inv_status = 'CANCELLED' THEN
            p_result := 'INVOICE_CANCELLED';
            RETURN;
        END IF;

        v_balance := GET_INVOICE_BALANCE(p_invoice_id);

        IF p_amount > v_balance + 0.01 THEN
            p_result := 'AMOUNT_EXCEEDS_BALANCE';
            RETURN;
        END IF;

        INSERT INTO PAYMENTS (INVOICE_ID, AMOUNT, PAYMENT_METHOD, REFERENCE_NUMBER, RECEIVED_BY)
        VALUES (p_invoice_id, p_amount, p_payment_method, p_reference_number, p_received_by)
        RETURNING PAYMENT_ID INTO p_payment_id;

        v_balance := v_balance - p_amount;
        IF ROUND(v_balance, 2) <= 0 THEN
            UPDATE INVOICES SET STATUS = 'PAID', UPDATED_AT = CURRENT_TIMESTAMP
            WHERE INVOICE_ID = p_invoice_id;
        ELSE
            UPDATE INVOICES SET STATUS = 'PARTIALLY_PAID', UPDATED_AT = CURRENT_TIMESTAMP
            WHERE INVOICE_ID = p_invoice_id;
        END IF;

        p_result := 'SUCCESS';

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'INVOICE_NOT_FOUND';
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END RECORD_PAYMENT;

    FUNCTION GET_INVOICE_BALANCE(p_invoice_id IN NUMBER) RETURN NUMBER IS
        v_total NUMBER;
        v_paid NUMBER;
    BEGIN
        SELECT NVL(SUM(TOTAL), 0) INTO v_total
        FROM INVOICE_ITEMS WHERE INVOICE_ID = p_invoice_id;

        SELECT NVL(SUM(AMOUNT), 0) INTO v_paid
        FROM PAYMENTS WHERE INVOICE_ID = p_invoice_id;

        RETURN v_total - v_paid;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN 0;
    END GET_INVOICE_BALANCE;

END PKG_BILLING;
/
