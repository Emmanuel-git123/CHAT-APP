CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(100) NOT NULL,
    username VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

