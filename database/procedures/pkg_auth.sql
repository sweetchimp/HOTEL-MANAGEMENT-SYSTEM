-- ============================================================
-- Package: PKG_AUTH
-- Description: Authentication and user management procedures
-- ============================================================

CREATE OR REPLACE PACKAGE PKG_AUTH AS
    -- Hash a password using bcrypt-like approach (simplified for Oracle)
    FUNCTION HASH_PASSWORD(p_password IN VARCHAR2) RETURN VARCHAR2;

    -- Verify a password against stored hash
    FUNCTION VERIFY_PASSWORD(p_password IN VARCHAR2, p_hash IN VARCHAR2) RETURN BOOLEAN;

    -- Authenticate user and return user details
    PROCEDURE LOGIN(
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_full_name OUT VARCHAR2,
        p_role OUT VARCHAR2,
        p_result OUT VARCHAR2
    );

    -- Change user password
    PROCEDURE CHANGE_PASSWORD(
        p_user_id IN NUMBER,
        p_old_password IN VARCHAR2,
        p_new_password IN VARCHAR2,
        p_result OUT VARCHAR2
    );
END PKG_AUTH;
/

CREATE OR REPLACE PACKAGE BODY PKG_AUTH AS

    FUNCTION HASH_PASSWORD(p_password IN VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        -- In production, use a proper hashing library
        -- This uses Oracle's built-in hash for demonstration
        RETURN DBMS_CRYPTO.HASH(
            UTL_RAW.CAST_TO_RAW(p_password),
            DBMS_CRYPTO.HASH_SH256
        );
    END HASH_PASSWORD;

    FUNCTION VERIFY_PASSWORD(p_password IN VARCHAR2, p_hash IN VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        RETURN HASH_PASSWORD(p_password) = p_hash;
    END VERIFY_PASSWORD;

    PROCEDURE LOGIN(
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_full_name OUT VARCHAR2,
        p_role OUT VARCHAR2,
        p_result OUT VARCHAR2
    ) IS
        v_user USERS%ROWTYPE;
        v_role ROLES.ROLE_NAME%TYPE;
    BEGIN
        SELECT * INTO v_user
        FROM USERS
        WHERE USERNAME = p_username AND IS_ACTIVE = 1;

        IF VERIFY_PASSWORD(p_password, v_user.PASSWORD_HASH) THEN
            p_user_id := v_user.USER_ID;
            p_full_name := v_user.FULL_NAME;

            SELECT ROLE_NAME INTO v_role
            FROM ROLES WHERE ROLE_ID = v_user.ROLE_ID;
            p_role := v_role;

            p_result := 'SUCCESS';
        ELSE
            p_result := 'INVALID_PASSWORD';
        END IF;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'USER_NOT_FOUND';
    END LOGIN;

    PROCEDURE CHANGE_PASSWORD(
        p_user_id IN NUMBER,
        p_old_password IN VARCHAR2,
        p_new_password IN VARCHAR2,
        p_result OUT VARCHAR2
    ) IS
        v_user USERS%ROWTYPE;
    BEGIN
        SELECT * INTO v_user FROM USERS WHERE USER_ID = p_user_id;

        IF VERIFY_PASSWORD(p_old_password, v_user.PASSWORD_HASH) THEN
            UPDATE USERS
            SET PASSWORD_HASH = HASH_PASSWORD(p_new_password),
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE USER_ID = p_user_id;

            p_result := 'SUCCESS';
        ELSE
            p_result := 'INVALID_OLD_PASSWORD';
        END IF;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_result := 'USER_NOT_FOUND';
    END CHANGE_PASSWORD;

END PKG_AUTH;
/
