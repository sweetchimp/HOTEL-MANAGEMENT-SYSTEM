-- ============================================================
-- Package: PKG_RESERVATIONS
-- Description: Reservation and booking management procedures
-- ============================================================

CREATE OR REPLACE PACKAGE PKG_RESERVATIONS AS
    -- Check room availability for given dates
    FUNCTION CHECK_AVAILABILITY(
        p_room_type_id IN NUMBER,
        p_check_in IN DATE,
        p_check_out IN DATE
    ) RETURN NUMBER;  -- Returns count of available rooms

    -- Create a new reservation
    PROCEDURE CREATE_RESERVATION(
        p_guest_id IN NUMBER,
        p_room_type_id IN NUMBER,
        p_check_in_date IN DATE,
        p_check_out_date IN DATE,
        p_special_requests IN VARCHAR2,
        p_created_by IN NUMBER,
        p_reservation_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    -- Confirm a reservation
    PROCEDURE CONFIRM_RESERVATION(
        p_reservation_id IN NUMBER,
        p_result OUT VARCHAR2
    );

    -- Cancel a reservation
    PROCEDURE CANCEL_RESERVATION(
        p_reservation_id IN NUMBER,
        p_result OUT VARCHAR2
    );

    -- Check in a guest (assign room)
    PROCEDURE CHECK_IN(
        p_booking_id IN NUMBER,
        p_room_id IN NUMBER,
        p_checked_in_by IN NUMBER,
        p_notes IN VARCHAR2,
        p_checkin_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

    -- Check out a guest
    PROCEDURE CHECK_OUT(
        p_checkin_id IN NUMBER,
        p_checked_out_by IN NUMBER,
        p_notes IN VARCHAR2,
        p_checkout_id OUT NUMBER,
        p_result OUT VARCHAR2
    );
END PKG_RESERVATIONS;
/

CREATE OR REPLACE PACKAGE BODY PKG_RESERVATIONS AS

    FUNCTION CHECK_AVAILABILITY(
        p_room_type_id IN NUMBER,
        p_check_in IN DATE,
        p_check_out IN DATE
    ) RETURN NUMBER IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count
        FROM ROOMS r
        WHERE r.TYPE_ID = p_room_type_id
          AND r.STATUS = 'AVAILABLE'
          AND r.ROOM_ID NOT IN (
              SELECT b.ROOM_ID
              FROM BOOKINGS b
              WHERE b.STATUS = 'ACTIVE'
                AND b.CHECK_IN_DATE < p_check_out
                AND b.CHECK_OUT_DATE > p_check_in
          );

        RETURN v_count;
    END CHECK_AVAILABILITY;

    PROCEDURE CREATE_RESERVATION(
        p_guest_id IN NUMBER,
        p_room_type_id IN NUMBER,
        p_check_in_date IN DATE,
        p_check_out_date IN DATE,
        p_special_requests IN VARCHAR2,
        p_created_by IN NUMBER,
        p_reservation_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
    BEGIN
        IF p_check_out_date <= p_check_in_date THEN
            p_result := 'CHECK_OUT_MUST_BE_AFTER_CHECK_IN';
            RETURN;
        END IF;

        INSERT INTO RESERVATIONS (
            GUEST_ID, ROOM_TYPE_ID, CHECK_IN_DATE,
            CHECK_OUT_DATE, SPECIAL_REQUESTS, CREATED_BY
        ) VALUES (
            p_guest_id, p_room_type_id, p_check_in_date,
            p_check_out_date, p_special_requests, p_created_by
        )
        RETURNING RESERVATION_ID INTO p_reservation_id;

        p_result := 'SUCCESS';
    EXCEPTION
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLERRM;
    END CREATE_RESERVATION;

    PROCEDURE CONFIRM_RESERVATION(
        p_reservation_id IN NUMBER,
        p_result OUT VARCHAR2
    ) IS
    BEGIN
        UPDATE RESERVATIONS
        SET STATUS = 'CONFIRMED', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE RESERVATION_ID = p_reservation_id AND STATUS = 'PENDING';

        IF SQL%ROWCOUNT > 0 THEN
            p_result := 'SUCCESS';
        ELSE
            p_result := 'RESERVATION_NOT_FOUND_OR_NOT_PENDING';
        END IF;
    END CONFIRM_RESERVATION;

    PROCEDURE CANCEL_RESERVATION(
        p_reservation_id IN NUMBER,
        p_result OUT VARCHAR2
    ) IS
    BEGIN
        UPDATE RESERVATIONS
        SET STATUS = 'CANCELLED', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE RESERVATION_ID = p_reservation_id
          AND STATUS IN ('PENDING', 'CONFIRMED');

        IF SQL%ROWCOUNT > 0 THEN
            p_result := 'SUCCESS';
        ELSE
            p_result := 'RESERVATION_CANNOT_BE_CANCELLED';
        END IF;
    END CANCEL_RESERVATION;

    PROCEDURE CHECK_IN(
        p_booking_id IN NUMBER,
        p_room_id IN NUMBER,
        p_checked_in_by IN NUMBER,
        p_notes IN VARCHAR2,
        p_checkin_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_booking BOOKINGS%ROWTYPE;
    BEGIN
        SELECT * INTO v_booking
        FROM BOOKINGS
        WHERE BOOKING_ID = p_booking_id AND STATUS = 'ACTIVE';

        -- Create check-in record
        INSERT INTO CHECKINS (BOOKING_ID, CHECKED_IN_BY, NOTES)
        VALUES (p_booking_id, p_checked_in_by, p_notes)
        RETURNING CHECKIN_ID INTO p_checkin_id;

        -- Update room status
        UPDATE ROOMS SET STATUS = 'OCCUPIED', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ROOM_ID = p_room_id;

        -- Update reservation status
        UPDATE RESERVATIONS SET STATUS = 'CHECKED_IN', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE RESERVATION_ID = (
            SELECT RESERVATION_ID FROM BOOKINGS WHERE BOOKING_ID = p_booking_id
        );

        p_result := 'SUCCESS';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'BOOKING_NOT_FOUND_OR_NOT_ACTIVE';
    END CHECK_IN;

    PROCEDURE CHECK_OUT(
        p_checkin_id IN NUMBER,
        p_checked_out_by IN NUMBER,
        p_notes IN VARCHAR2,
        p_checkout_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_checkin CHECKINS%ROWTYPE;
        v_room_id NUMBER;
    BEGIN
        SELECT * INTO v_checkin
        FROM CHECKINS
        WHERE CHECKIN_ID = p_checkin_id;

        -- Get room_id from booking
        SELECT ROOM_ID INTO v_room_id
        FROM BOOKINGS
        WHERE BOOKING_ID = v_checkin.BOOKING_ID;

        -- Create check-out record
        INSERT INTO CHECKOUTS (CHECKIN_ID, CHECKED_OUT_BY, NOTES)
        VALUES (p_checkin_id, p_checked_out_by, p_notes)
        RETURNING CHECKOUT_ID INTO p_checkout_id;

        -- Free up the room
        UPDATE ROOMS SET STATUS = 'AVAILABLE', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ROOM_ID = v_room_id;

        -- Update booking status
        UPDATE BOOKINGS SET STATUS = 'COMPLETED'
        WHERE BOOKING_ID = v_checkin.BOOKING_ID;

        -- Update reservation status
        UPDATE RESERVATIONS SET STATUS = 'COMPLETED', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE RESERVATION_ID = (
            SELECT RESERVATION_ID FROM BOOKINGS WHERE BOOKING_ID = v_checkin.BOOKING_ID
        );

        p_result := 'SUCCESS';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'CHECKIN_NOT_FOUND';
    END CHECK_OUT;

END PKG_RESERVATIONS;
/
