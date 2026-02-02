
export const SQL_SCHEMA = `
-- DATABASE SCHEMA FOR GOLFRULES AI
-- Generated: ${new Date().toISOString().split('T')[0]}
-- Type: Relational (PostgreSQL / MySQL compatible)

-- 1. USERS TABLE
-- Stores user profile information linked to Firebase UID
CREATE TABLE users (
    uid VARCHAR(128) PRIMARY KEY,          -- Firebase User ID
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    photo_url TEXT,
    language_pref VARCHAR(5) DEFAULT 'it', -- 'it', 'en', 'fr', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. GOLF_COURSES TABLE
-- Stores identified golf courses/clubs
CREATE TABLE golf_courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. LOCAL_RULES TABLE
-- Stores specific rules for a course
CREATE TABLE local_rules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES golf_courses(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(uid), -- If user-generated/private
    rule_text TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. GOLF_CART_RULES TABLE
-- Stores specific cart usage rules for a course
CREATE TABLE golf_cart_rules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES golf_courses(id) ON DELETE CASCADE,
    user_id VARCHAR(128) REFERENCES users(uid),
    rules_text TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CHAT_SESSIONS TABLE
-- Groups messages into conversation threads
CREATE TABLE chat_sessions (
    id VARCHAR(64) PRIMARY KEY, -- UUID
    user_id VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    title VARCHAR(255),         -- First user query usually
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. CHAT_MESSAGES TABLE
-- Individual messages within a session
CREATE TABLE chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'model', 'system')),
    content TEXT,
    image_url TEXT,             -- URL to stored image if present
    generated_image_url TEXT,   -- URL to AI generated diagram
    is_offline_result BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. USER_PREFERENCES TABLE
-- Additional app settings
CREATE TABLE user_preferences (
    user_id VARCHAR(128) PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    voice_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_courses_country ON golf_courses(country);
CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
`;
