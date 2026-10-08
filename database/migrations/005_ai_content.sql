-- ============================================================
-- ALTONSHOTEL Management System
-- Schema Migration Version: 005
-- Description: Add AI-powered content generator tables
--              (AI_GENERATED_CONTENT, AI_CONTENT_VERSIONS,
--               AI_CONTENT_DISTRIBUTIONS)
-- Author: AHMS Development Team
-- Date: 2026-10-08
--
-- Safe to re-run (guard included)
-- ============================================================

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'AI_GENERATED_CONTENT';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE AI_GENERATED_CONTENT (
                ID                NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                TITLE             VARCHAR2(200) NOT NULL,
                TYPE              VARCHAR2(30)
                                  CHECK (TYPE IN (''flyer'',''email'',''instagram_post'',''whatsapp_message'',''newsletter'')),
                ADMIN_PROMPT      CLOB,
                GENERATED_CONTENT CLOB,
                FLYER_IMAGE_URL   VARCHAR2(500),
                FLYER_DATA        CLOB,
                STATUS            VARCHAR2(20) DEFAULT ''draft''
                                  CHECK (STATUS IN (''draft'',''approved'',''scheduled'',''published'')),
                BRAND_GUIDELINES  VARCHAR2(1000),
                CREATED_BY        NUMBER REFERENCES USERS(USER_ID),
                CREATED_AT        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UPDATED_AT        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                APPROVED_BY       NUMBER REFERENCES USERS(USER_ID),
                APPROVED_AT       TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'AI_CONTENT_VERSIONS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE AI_CONTENT_VERSIONS (
                ID                NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                CONTENT_ID        NUMBER NOT NULL REFERENCES AI_GENERATED_CONTENT(ID),
                VERSION_NUMBER    NUMBER DEFAULT 1,
                GENERATED_CONTENT CLOB,
                REASON            VARCHAR2(200),
                GENERATED_BY      NUMBER REFERENCES USERS(USER_ID),
                GENERATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'AI_CONTENT_DISTRIBUTIONS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE AI_CONTENT_DISTRIBUTIONS (
                ID              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                CONTENT_ID      NUMBER NOT NULL REFERENCES AI_GENERATED_CONTENT(ID),
                CHANNEL         VARCHAR2(20)
                                CHECK (CHANNEL IN (''email'',''newsletter'',''instagram'',''whatsapp'')),
                RECIPIENT_TYPE  VARCHAR2(30)
                                CHECK (RECIPIENT_TYPE IN (''all_guests'',''past_guests'',''newsletter_subscribers'')),
                RECIPIENT_COUNT NUMBER DEFAULT 0,
                STATUS          VARCHAR2(20) DEFAULT ''pending''
                                CHECK (STATUS IN (''pending'',''scheduled'',''sent'',''failed'',''manual'')),
                SCHEDULED_AT    TIMESTAMP,
                SENT_AT         TIMESTAMP,
                ENGAGEMENT_COUNT NUMBER DEFAULT 0,
                CAMPAIGN_ID     NUMBER REFERENCES EMAIL_CAMPAIGNS(ID),
                CREATED_BY      NUMBER REFERENCES USERS(USER_ID),
                CREATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_AI_CONTENT_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_AI_CONTENT_STATUS ON AI_GENERATED_CONTENT(STATUS)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_AI_CONTENT_TYPE';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_AI_CONTENT_TYPE ON AI_GENERATED_CONTENT(TYPE)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_AI_CONTENT_CREATED';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_AI_CONTENT_CREATED ON AI_GENERATED_CONTENT(CREATED_AT)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_AI_VERSIONS_CONTENT';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_AI_VERSIONS_CONTENT ON AI_CONTENT_VERSIONS(CONTENT_ID, VERSION_NUMBER)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_AI_DIST_CONTENT';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_AI_DIST_CONTENT ON AI_CONTENT_DISTRIBUTIONS(CONTENT_ID)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_AI_DIST_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_AI_DIST_STATUS ON AI_CONTENT_DISTRIBUTIONS(STATUS, SCHEDULED_AT)';
    END IF;
END;
/