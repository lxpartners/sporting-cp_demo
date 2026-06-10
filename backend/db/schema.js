const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/sporting.db');

// Ensure data directory exists
const fs = require('fs');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id          TEXT PRIMARY KEY,
    member_number TEXT UNIQUE NOT NULL,
    full_name   TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    tier        TEXT DEFAULT 'bronze',
    points      INTEGER DEFAULT 0,
    member_since TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    competition TEXT NOT NULL,
    home_team   TEXT NOT NULL,
    away_team   TEXT NOT NULL,
    venue       TEXT NOT NULL,
    starts_at   TEXT NOT NULL,
    qr_ttl_minutes INTEGER DEFAULT 120
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id              TEXT PRIMARY KEY,
    event_id        TEXT NOT NULL REFERENCES events(id),
    original_holder TEXT NOT NULL REFERENCES members(id),
    current_holder  TEXT NOT NULL REFERENCES members(id),
    section         TEXT NOT NULL,
    row_label       TEXT NOT NULL,
    seat_number     TEXT NOT NULL,
    price_paid      REAL NOT NULL,
    status          TEXT DEFAULT 'issued',
    qr_nonce        TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ticket_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id   TEXT NOT NULL REFERENCES tickets(id),
    action      TEXT NOT NULL,
    from_member TEXT,
    to_member   TEXT,
    meta        TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS marketplace_listings (
    id          TEXT PRIMARY KEY,
    ticket_id   TEXT UNIQUE NOT NULL REFERENCES tickets(id),
    seller_id   TEXT NOT NULL REFERENCES members(id),
    asking_price REAL NOT NULL,
    original_price REAL NOT NULL,
    status      TEXT DEFAULT 'active',
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
