CREATE TABLE IF NOT EXISTS settings (
    key TEXT,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    PRIMARY KEY (restaurant_id, key)
);
