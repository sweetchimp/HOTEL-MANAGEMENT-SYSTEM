-- ============================================================
-- Package: PKG_BILLING
-- Description: Billing and payment management procedures
-- ============================================================

CREATE OR REPLACE PACKAGE PKG_BILLING AS
    -- Create an invoice for a booking
    PROCEDURE CREATE_INVOICE(
        p_booking_id IN NUMBER,
        p_invoice_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    -- Add item to an invoice
    PROCEDURE ADD_INVOICE_ITEM(
        p_invoice_id IN NUMBER,
        p_description IN VARCHAR2,
        p_quantity IN NUMBER,
        p_unit_price IN NUMBER,
        p_item_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    -- Record a payment against an invoice
    PROCEDURE RECORD_PAYMENT(
        p_invoice_id IN NUMBER,
        p_amount IN NUMBER,
        p_payment_method IN VARCHAR2,
        p_reference_number IN VARCHAR2,
        p_received_by IN NUMBER,
        p_payment_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    -- Get invoice balance
    FUNCTION GET_INVOICE_BALANCE(p_invoice_id IN NUMBER) RETURN NUMBER;

    -- Update invoice total from items
    PROCEDURE UPDATE_INVOICE_TOTAL(p_invoice_id IN NUMBER);
END PKG_BILLING;
/

CREATE OR REPLACE PACKAGE BODY PKG_BILLING AS

    PROCEDURE CREATE_INVOICE(
        p_booking_id IN NUMBER,
        p_invoice_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_guest_id NUMBER;
    BEGIN
        SELECT GUEST_ID INTO v_guest_id
        FROM RESERVATIONS r
        JOIN BOOKINGS b ON r.RESERVATION_ID = b.RESERVATION_ID
        WHERE b.BOOKING_ID = p_booking_id;

        INSERT INTO INVOICES (BOOKING_ID, GUEST_ID)
        VALUES (p_booking_id, v_guest_id)
        RETURNING INVOICE_ID INTO p_invoice_id;

        p_result := 'SUCCESS';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'BOOKING_NOT_FOUND';
    END CREATE_INVOICE;

    PROCEDURE ADD_INVOICE_ITEM(
        p_invoice_id IN NUMBER,
        p_description IN VARCHAR2,
        p_quantity IN NUMBER,
        p_unit_price IN NUMBER,
        p_item_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
    BEGIN
        INSERT INTO INVOICE_ITEMS (INVOICE_ID, DESCRIPTION, QUANTITY, UNIT_PRICE)
        VALUES (p_invoice_id, p_description, p_quantity, p_unit_price)
        RETURNING ITEM_ID INTO p_item_id;

        UPDATE_INVOICE_TOTAL(p_invoice_id);
        p_result := 'SUCCESS';
    EXCEPTION
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLERRM;
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
    BEGIN
        v_balance := GET_INVOICE_BALANCE(p_invoice_id);

        IF p_amount > v_balance THEN
            p_result := 'AMOUNT_EXCEEDS_BALANCE';
            RETURN;
        END IF;

        INSERT INTO PAYMENTS (INVOICE_ID, AMOUNT, PAYMENT_METHOD, REFERENCE_NUMBER, RECEIVED_BY)
        VALUES (p_invoice_id, p_amount, p_payment_method, p_reference_number, p_received_by)
        RETURNING PAYMENT_ID INTO p_payment_id;

        -- Update invoice status
        v_balance := v_balance - p_amount;
        IF v_balance = 0 THEN
            UPDATE INVOICES SET STATUS = 'PAID', UPDATED_AT = CURRENT_TIMESTAMP
            WHERE INVOICE_ID = p_invoice_id;
        ELSE
            UPDATE INVOICES SET STATUS = 'PARTIALLY_PAID', UPDATED_AT = CURRENT_TIMESTAMP
            WHERE INVOICE_ID = p_invoice_id;
        END IF;

        p_result := 'SUCCESS';
    EXCEPTION
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLERRM;
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
    END GET_INVOICE_BALANCE;

    PROCEDURE UPDATE_INVOICE_TOTAL(p_invoice_id IN NUMBER) IS
        v_total NUMBER;
    BEGIN
        SELECT NVL(SUM(TOTAL), 0) INTO v_total
        FROM INVOICE_ITEMS WHERE INVOICE_ID = p_invoice_id;

        UPDATE INVOICES SET TOTAL_AMOUNT = v_total, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE INVOICE_ID = p_invoice_id;
    END UPDATE_INVOICE_TOTAL;

END PKG_BILLING;
/
