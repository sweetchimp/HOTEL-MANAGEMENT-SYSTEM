-- ============================================================
-- Package: PKG_RESERVATIONS
-- Version: 002
-- Description: Reservation and booking management procedures
-- Changes: Added room-type validation, date-range checks,
--           fixed availability query, improved exception handling,
--           removed redundant room status update (handled by trigger)
-- ============================================================

CREATE OR REPLACE PACKAGE PKG_RESERVATIONS AS
    FUNCTION CHECK_AVAILABILITY(
        p_room_type_id IN NUMBER,
        p_check_in IN DATE,
        p_check_out IN DATE
    ) RETURN NUMBER;

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

    PROCEDURE CONFIRM_RESERVATION(
        p_reservation_id IN NUMBER,
        p_result OUT VARCHAR2
    );

    PROCEDURE CANCEL_RESERVATION(
        p_reservation_id IN NUMBER,
        p_result OUT VARCHAR2
    );

    PROCEDURE CHECK_IN(
        p_booking_id IN NUMBER,
        p_room_id IN NUMBER,
        p_checked_in_by IN NUMBER,
        p_notes IN VARCHAR2,
        p_checkin_id OUT NUMBER,
        p_result OUT VARCHAR2
    );

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
              JOIN RESERVATIONS res ON b.RESERVATION_ID = res.RESERVATION_ID
              WHERE b.STATUS = 'ACTIVE'
                AND res.STATUS IN ('CONFIRMED', 'CHECKED_IN')
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
        v_guest_count NUMBER;
        v_type_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_guest_count FROM GUESTS WHERE GUEST_ID = p_guest_id;
        IF v_guest_count = 0 THEN
            p_result := 'GUEST_NOT_FOUND';
            RETURN;
        END IF;

        SELECT COUNT(*) INTO v_type_count FROM ROOM_TYPES WHERE TYPE_ID = p_room_type_id;
        IF v_type_count = 0 THEN
            p_result := 'ROOM_TYPE_NOT_FOUND';
            RETURN;
        END IF;

        IF p_check_out_date <= p_check_in_date THEN
            p_result := 'CHECK_OUT_MUST_BE_AFTER_CHECK_IN';
            RETURN;
        END IF;

        IF p_check_in_date < TRUNC(SYSDATE) THEN
            p_result := 'CHECK_IN_DATE_CANNOT_BE_IN_PAST';
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
        WHEN DUP_VAL_ON_INDEX THEN
            p_result := 'DUPLICATE_RESERVATION';
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
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

    EXCEPTION
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
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
            UPDATE BOOKINGS
            SET STATUS = 'CANCELLED'
            WHERE RESERVATION_ID = p_reservation_id
              AND STATUS = 'ACTIVE';
            p_result := 'SUCCESS';
        ELSE
            p_result := 'RESERVATION_CANNOT_BE_CANCELLED';
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
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
        v_room ROOMS%ROWTYPE;
        v_reservation RESERVATIONS%ROWTYPE;
    BEGIN
        SELECT * INTO v_booking
        FROM BOOKINGS
        WHERE BOOKING_ID = p_booking_id AND STATUS = 'ACTIVE';

        SELECT * INTO v_reservation
        FROM RESERVATIONS
        WHERE RESERVATION_ID = v_booking.RESERVATION_ID;

        IF v_reservation.STATUS NOT IN ('CONFIRMED', 'CHECKED_IN') THEN
            p_result := 'RESERVATION_NOT_CONFIRMED';
            RETURN;
        END IF;

        SELECT * INTO v_room
        FROM ROOMS
        WHERE ROOM_ID = p_room_id;

        IF v_room.TYPE_ID != v_reservation.ROOM_TYPE_ID THEN
            p_result := 'ROOM_TYPE_MISMATCH';
            RETURN;
        END IF;

        IF v_room.STATUS != 'AVAILABLE' THEN
            p_result := 'ROOM_NOT_AVAILABLE';
            RETURN;
        END IF;

        IF TRUNC(SYSDATE) < v_booking.CHECK_IN_DATE THEN
            p_result := 'CHECK_IN_TOO_EARLY';
            RETURN;
        END IF;

        IF TRUNC(SYSDATE) > v_booking.CHECK_OUT_DATE + 1 THEN
            p_result := 'BOOKING_EXPIRED';
            RETURN;
        END IF;

        INSERT INTO CHECKINS (BOOKING_ID, CHECKED_IN_BY, NOTES)
        VALUES (p_booking_id, p_checked_in_by, p_notes)
        RETURNING CHECKIN_ID INTO p_checkin_id;

        UPDATE RESERVATIONS SET STATUS = 'CHECKED_IN', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE RESERVATION_ID = v_booking.RESERVATION_ID;

        p_result := 'SUCCESS';

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'BOOKING_NOT_FOUND_OR_NOT_ACTIVE';
        WHEN DUP_VAL_ON_INDEX THEN
            p_result := 'ALREADY_CHECKED_IN';
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END CHECK_IN;

    PROCEDURE CHECK_OUT(
        p_checkin_id IN NUMBER,
        p_checked_out_by IN NUMBER,
        p_notes IN VARCHAR2,
        p_checkout_id OUT NUMBER,
        p_result OUT VARCHAR2
    ) IS
        v_checkin CHECKINS%ROWTYPE;
    BEGIN
        SELECT * INTO v_checkin
        FROM CHECKINS
        WHERE CHECKIN_ID = p_checkin_id;

        INSERT INTO CHECKOUTS (CHECKIN_ID, CHECKED_OUT_BY, NOTES)
        VALUES (p_checkin_id, p_checked_out_by, p_notes)
        RETURNING CHECKOUT_ID INTO p_checkout_id;

        UPDATE BOOKINGS SET STATUS = 'COMPLETED'
        WHERE BOOKING_ID = v_checkin.BOOKING_ID;

        UPDATE RESERVATIONS SET STATUS = 'COMPLETED', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE RESERVATION_ID = (
            SELECT RESERVATION_ID FROM BOOKINGS WHERE BOOKING_ID = v_checkin.BOOKING_ID
        );

        p_result := 'SUCCESS';

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'CHECKIN_NOT_FOUND';
        WHEN DUP_VAL_ON_INDEX THEN
            p_result := 'ALREADY_CHECKED_OUT';
        WHEN OTHERS THEN
            p_result := 'ERROR: ' || SQLCODE || ' - ' || SQLERRM;
    END CHECK_OUT;

END PKG_RESERVATIONS;
/
