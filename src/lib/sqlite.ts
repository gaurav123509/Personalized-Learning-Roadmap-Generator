import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

type NoteRow = {
  id: string;
  user_email: string;
  subject: string;
  title: string;
  text: string;
  color: string;
  font_size: number;
  created_at: number;
  updated_at: number;
};

export interface SqlNote {
  id: string;
  userEmail: string;
  subject: string;
  title: string;
  text: string;
  color: string;
  fontSize: number;
  createdAt: number;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __roadmapSqlite: Database.Database | undefined;
}

function getDbPath() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'app.db');
}

function toSqlNote(row: NoteRow): SqlNote {
  return {
    id: row.id,
    userEmail: row.user_email,
    subject: row.subject,
    title: row.title,
    text: row.text,
    color: row.color,
    fontSize: row.font_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getDb() {
  if (!global.__roadmapSqlite) {
    const db = new Database(getDbPath());
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        text TEXT NOT NULL,
        color TEXT NOT NULL,
        font_size INTEGER NOT NULL DEFAULT 16,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_notes_user_subject
      ON notes(user_email, subject, updated_at DESC);
    `);
    global.__roadmapSqlite = db;
  }
  return global.__roadmapSqlite;
}

export function listNotes(userEmail: string, subject: string): SqlNote[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, user_email, subject, title, text, color, font_size, created_at, updated_at
    FROM notes
    WHERE user_email = ? AND subject = ?
    ORDER BY updated_at DESC
  `);
  const rows = stmt.all(userEmail.trim().toLowerCase(), subject.trim()) as NoteRow[];
  return rows.map(toSqlNote);
}

export function createNote(input: {
  userEmail: string;
  subject: string;
  title: string;
  text: string;
  color: string;
  fontSize: number;
}): SqlNote {
  const db = getDb();
  const now = Date.now();
  const id = randomUUID();
  const safeEmail = input.userEmail.trim().toLowerCase();
  const safeSubject = input.subject.trim() || 'General';

  const stmt = db.prepare(`
    INSERT INTO notes (id, user_email, subject, title, text, color, font_size, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    safeEmail,
    safeSubject,
    input.title,
    input.text,
    input.color,
    input.fontSize,
    now,
    now
  );

  return {
    id,
    userEmail: safeEmail,
    subject: safeSubject,
    title: input.title,
    text: input.text,
    color: input.color,
    fontSize: input.fontSize,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateNote(input: {
  id: string;
  userEmail: string;
  subject: string;
  title: string;
  text: string;
  color: string;
  fontSize: number;
}): boolean {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE notes
    SET title = ?, text = ?, color = ?, font_size = ?, updated_at = ?
    WHERE id = ? AND user_email = ? AND subject = ?
  `);
  const res = stmt.run(
    input.title,
    input.text,
    input.color,
    input.fontSize,
    Date.now(),
    input.id,
    input.userEmail.trim().toLowerCase(),
    input.subject.trim() || 'General'
  );
  return res.changes > 0;
}

export function deleteNote(input: { id: string; userEmail: string; subject: string }): boolean {
  const db = getDb();
  const stmt = db.prepare(`
    DELETE FROM notes
    WHERE id = ? AND user_email = ? AND subject = ?
  `);
  const res = stmt.run(
    input.id,
    input.userEmail.trim().toLowerCase(),
    input.subject.trim() || 'General'
  );
  return res.changes > 0;
}
