CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(100) NOT NULL,
    username VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_username_lower_unique
ON users (LOWER(username));

CREATE UNIQUE INDEX users_email_lower_unique
ON users (LOWER(email));