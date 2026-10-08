-- ============================================================
-- ALTONSHOTEL Management System
-- Schema Migration Version: 004
-- Description: Add content creation & marketing tables
--              (CONTENT, PROMOTIONS, EMAIL_TEMPLATES,
--               EMAIL_CAMPAIGNS, SUBSCRIBERS, EMAIL_TRACKING)
-- Author: AHMS Development Team
-- Date: 2026-10-08
--
-- Safe to re-run (guard included)
-- ============================================================

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'CONTENT';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE CONTENT (
                ID                 NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                TITLE              VARCHAR2(200) NOT NULL,
                TYPE               VARCHAR2(20) DEFAULT ''news''
                                   CHECK (TYPE IN (''news'',''announcement'',''event'')),
                BODY               CLOB,
                FEATURED_IMAGE_URL VARCHAR2(500),
                STATUS             VARCHAR2(20) DEFAULT ''draft''
                                   CHECK (STATUS IN (''draft'',''published'',''archived'')),
                PUBLISHED_AT       TIMESTAMP,
                CREATED_BY         NUMBER REFERENCES USERS(USER_ID),
                CREATED_AT         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UPDATED_AT         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'PROMOTIONS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE PROMOTIONS (
                ID                     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                TITLE                  VARCHAR2(200) NOT NULL,
                DESCRIPTION            VARCHAR2(1000),
                DISCOUNT_PCT           NUMBER(3,0) CHECK (DISCOUNT_PCT BETWEEN 0 AND 100),
                START_DATE             DATE,
                END_DATE               DATE,
                APPLICABLE_ROOM_TYPES  VARCHAR2(500),
                STATUS                 VARCHAR2(20) DEFAULT ''draft''
                                       CHECK (STATUS IN (''draft'',''active'',''archived'')),
                CREATED_BY             NUMBER REFERENCES USERS(USER_ID),
                CREATED_AT             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UPDATED_AT             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'EMAIL_TEMPLATES';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE EMAIL_TEMPLATES (
                ID            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                NAME          VARCHAR2(200) NOT NULL,
                SUBJECT       VARCHAR2(200),
                BODY          CLOB,
                TYPE          VARCHAR2(20) DEFAULT ''custom''
                              CHECK (TYPE IN (''welcome'',''promotion'',''newsletter'',''event'',''reminder'',''custom'')),
                PLACEHOLDERS  VARCHAR2(500),
                IS_SYSTEM     NUMBER(1) DEFAULT 0,
                CREATED_BY    NUMBER REFERENCES USERS(USER_ID),
                CREATED_AT    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UPDATED_AT    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'EMAIL_CAMPAIGNS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE EMAIL_CAMPAIGNS (
                ID               NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                TITLE            VARCHAR2(200) NOT NULL,
                TEMPLATE_ID      NUMBER REFERENCES EMAIL_TEMPLATES(ID),
                RECIPIENT_TYPE   VARCHAR2(30)
                                 CHECK (RECIPIENT_TYPE IN (''all_guests'',''past_guests'',''newsletter_subscribers'')),
                RECIPIENT_COUNT  NUMBER DEFAULT 0,
                STATUS           VARCHAR2(20) DEFAULT ''draft''
                                 CHECK (STATUS IN (''draft'',''scheduled'',''sent'',''failed'')),
                SCHEDULED_AT     TIMESTAMP,
                SENT_AT          TIMESTAMP,
                SUBJECT_OVERRIDE VARCHAR2(200),
                BODY_OVERRIDE    CLOB,
                OPEN_COUNT       NUMBER DEFAULT 0,
                CLICK_COUNT      NUMBER DEFAULT 0,
                CREATED_BY       NUMBER REFERENCES USERS(USER_ID),
                CREATED_AT       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'SUBSCRIBERS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE SUBSCRIBERS (
                ID            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                EMAIL         VARCHAR2(120) NOT NULL UNIQUE,
                STATUS        VARCHAR2(20) DEFAULT ''active''
                              CHECK (STATUS IN (''active'',''unsubscribed'')),
                SUBSCRIBED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CREATED_AT    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_TABLES WHERE TABLE_NAME = 'EMAIL_TRACKING';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE EMAIL_TRACKING (
                ID              NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                CAMPAIGN_ID     NUMBER REFERENCES EMAIL_CAMPAIGNS(ID),
                RECIPIENT_EMAIL VARCHAR2(100),
                EVENT_TYPE      VARCHAR2(20) CHECK (EVENT_TYPE IN (''open'',''click'')),
                LINK_URL        VARCHAR2(500),
                USER_AGENT      VARCHAR2(500),
                IP_ADDRESS      VARCHAR2(50),
                CREATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_CONTENT_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_CONTENT_STATUS ON CONTENT(STATUS)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_CONTENT_TYPE';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_CONTENT_TYPE ON CONTENT(TYPE)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_CONTENT_CREATED';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_CONTENT_CREATED ON CONTENT(CREATED_AT)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_PROMOTIONS_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_PROMOTIONS_STATUS ON PROMOTIONS(STATUS)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_CAMPAIGNS_STATUS';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_CAMPAIGNS_STATUS ON EMAIL_CAMPAIGNS(STATUS)';
    END IF;
END;
/

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM USER_INDEXES WHERE INDEX_NAME = 'IDX_TRACKING_CAMPAIGN';
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_TRACKING_CAMPAIGN ON EMAIL_TRACKING(CAMPAIGN_ID, EVENT_TYPE)';
    END IF;
END;
/

-- ============================================================
-- Seed data: 6 pre-built email templates (read-only starters)
-- ============================================================
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM EMAIL_TEMPLATES;
    IF v_count = 0 THEN
        INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, IS_SYSTEM) VALUES
        ('Welcome Email', 'Welcome to ALTONSHOTEL',
         '<h2>Welcome, {{guest_name}}!</h2><p>We are delighted to host you at ALTONSHOTEL. Your check-in is on <strong>{{check_in_date}}</strong> and you have been assigned room <strong>{{room_number}}</strong>.</p><p>If you need anything before your arrival, just reply to this email.</p>',
         'welcome', '["guest_name","room_number","check_in_date"]', 1);

        INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, IS_SYSTEM) VALUES
        ('Promotion Offer', 'Special Offer Just for You',
         '<h2>A deal picked for you</h2><p>Enjoy exclusive savings on your next stay at ALTONSHOTEL. Book now and make the most of it.</p><p><a href="https://altonshotel.com/booking">Book now</a></p>',
         'promotion', '["guest_name"]', 1);

        INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, IS_SYSTEM) VALUES
        ('Newsletter', 'Our Latest News & Updates',
         '<h2>News from ALTONSHOTEL</h2><p>Here is what is happening at the hotel this month — new amenities, events and seasonal offers.</p><p><a href="https://altonshotel.com/landing">See current offers</a></p>',
         'newsletter', '["guest_name"]', 1);

        INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, IS_SYSTEM) VALUES
        ('Check-in Reminder', 'Your Check-in is Tomorrow',
         '<h2>See you soon, {{guest_name}}!</h2><p>This is a friendly reminder that your check-in is tomorrow, <strong>{{check_in_date}}</strong>. Your room will be <strong>{{room_number}}</strong>.</p><p>Check-in starts at 14:00.</p>',
         'reminder', '["guest_name","room_number","check_in_date"]', 1);

        INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, IS_SYSTEM) VALUES
        ('Check-out Thank You', 'Thank you for staying',
         '<h2>Thank you, {{guest_name}}!</h2><p>We hope you enjoyed your stay in room <strong>{{room_number}}</strong>. We would love to welcome you back soon.</p>',
         'welcome', '["guest_name","room_number"]', 1);

        INSERT INTO EMAIL_TEMPLATES (NAME, SUBJECT, BODY, TYPE, PLACEHOLDERS, IS_SYSTEM) VALUES
        ('Feedback Request', 'We''d love your feedback',
         '<h2>How did we do, {{guest_name}}?</h2><p>Your opinion matters. Take a minute to tell us about your stay and help us improve.</p><p><a href="https://altonshotel.com/landing">Share your feedback</a></p>',
         'custom', '["guest_name"]', 1);
    END IF;
END;
/
