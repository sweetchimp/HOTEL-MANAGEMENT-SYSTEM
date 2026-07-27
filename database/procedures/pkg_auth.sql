-- ============================================================
-- Package: PKG_AUTH
-- Version: 002
-- Description: Authentication and user management procedures
-- Changes: Fixed RAWTOHEX conversion, added login tracking,
--           added password complexity validation
-- ============================================================

CREATE OR REPLACE PACKAGE PKG_AUTH AS
    FUNCTION HASH_PASSWORD(p_password IN VARCHAR2) RETURN VARCHAR2;
    FUNCTION VERIFY_PASSWORD(p_password IN VARCHAR2, p_hash IN VARCHAR2) RETURN BOOLEAN;
    FUNCTION VALIDATE_PASSWORD(p_password IN VARCHAR2) RETURN VARCHAR2;
    PROCEDURE LOGIN(
        p_username IN VARCHAR2,
        p_password IN VARCHAR2,
        p_user_id OUT NUMBER,
        p_full_name OUT VARCHAR2,
        p_role OUT VARCHAR2,
        p_result OUT VARCHAR2
    );
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
        RETURN RAWTOHEX(DBMS_CRYPTO.HASH(
            UTL_RAW.CAST_TO_RAW(p_password),
            DBMS_CRYPTO.HASH_SH256
        ));
    END HASH_PASSWORD;

    FUNCTION VERIFY_PASSWORD(p_password IN VARCHAR2, p_hash IN VARCHAR2) RETURN BOOLEAN IS
    BEGIN
        RETURN HASH_PASSWORD(p_password) = UPPER(p_hash);
    END VERIFY_PASSWORD;

    FUNCTION VALIDATE_PASSWORD(p_password IN VARCHAR2) RETURN VARCHAR2 IS
    BEGIN
        IF p_password IS NULL OR LENGTH(p_password) < 8 THEN
            RETURN 'PASSWORD_TOO_SHORT';
        END IF;
        IF NOT REGEXP_LIKE(p_password, '[A-Z]') THEN
            RETURN 'NEEDS_UPPERCASE';
        END IF;
        IF NOT REGEXP_LIKE(p_password, '[a-z]') THEN
            RETURN 'NEEDS_LOWERCASE';
        END IF;
        IF NOT REGEXP_LIKE(p_password, '[0-9]') THEN
            RETURN 'NEEDS_DIGIT';
        END IF;
        RETURN 'VALID';
    END VALIDATE_PASSWORD;

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
        WHERE USERNAME = p_username;

        IF v_user.IS_ACTIVE != 1 THEN
            p_result := 'ACCOUNT_DISABLED';
            RETURN;
        END IF;

        IF v_user.FAILED_LOGIN_ATTEMPTS >= 5 THEN
            p_result := 'ACCOUNT_LOCKED';
            RETURN;
        END IF;

        IF VERIFY_PASSWORD(p_password, v_user.PASSWORD_HASH) THEN
            p_user_id := v_user.USER_ID;
            p_full_name := v_user.FULL_NAME;

            SELECT ROLE_NAME INTO v_role
            FROM ROLES WHERE ROLE_ID = v_user.ROLE_ID;
            p_role := v_role;

            UPDATE USERS
            SET FAILED_LOGIN_ATTEMPTS = 0,
                LAST_LOGIN = CURRENT_TIMESTAMP,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE USER_ID = v_user.USER_ID;

            p_result := 'SUCCESS';
        ELSE
            UPDATE USERS
            SET FAILED_LOGIN_ATTEMPTS = v_user.FAILED_LOGIN_ATTEMPTS + 1,
                UPDATED_AT = CURRENT_TIMESTAMP
            WHERE USERNAME = p_username;

            IF v_user.FAILED_LOGIN_ATTEMPTS + 1 >= 5 THEN
                p_result := 'ACCOUNT_LOCKED';
            ELSE
                p_result := 'INVALID_PASSWORD';
            END IF;
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
        v_validation VARCHAR2(50);
    BEGIN
        v_validation := VALIDATE_PASSWORD(p_new_password);
        IF v_validation != 'VALID' THEN
            p_result := v_validation;
            RETURN;
        END IF;

        SELECT * INTO v_user FROM USERS WHERE USER_ID = p_user_id;

        IF VERIFY_PASSWORD(p_old_password, v_user.PASSWORD_HASH) THEN
            UPDATE USERS
            SET PASSWORD_HASH = HASH_PASSWORD(p_new_password),
                FAILED_LOGIN_ATTEMPTS = 0,
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
