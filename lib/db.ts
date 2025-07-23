import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data.db')

// ensure directory exists
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
} catch {}

const db = new Database(DB_PATH)

db.exec(`CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start TEXT UNIQUE NOT NULL,
  end TEXT NOT NULL,
  name TEXT,
  email TEXT
)`)

export default db

