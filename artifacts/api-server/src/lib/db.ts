import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from "./logger";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "announcements.db");
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    link TEXT,
    category TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    publish_date TEXT NOT NULL,
    expires_at TEXT NOT NULL DEFAULT '2099-01-01T00:00:00',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const cols = db.prepare("PRAGMA table_info(announcements)").all() as { name: string }[];
if (!cols.some((c) => c.name === "expires_at")) {
  db.exec(`ALTER TABLE announcements ADD COLUMN expires_at TEXT NOT NULL DEFAULT '2099-01-01T00:00:00';`);
  db.exec(`UPDATE announcements SET expires_at = datetime(publish_date, '+24 hours');`);
  logger.info("Migrated: added expires_at column");
}

logger.info({ dbPath }, "SQLite database initialised");

export interface Announcement {
  id: number;
  headline: string;
  description: string;
  link: string | null;
  category: string | null;
  active: number;
  publish_date: string;
  expires_at: string;
  created_at: string;
}
