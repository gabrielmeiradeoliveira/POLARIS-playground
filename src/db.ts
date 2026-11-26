import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DATA_DIR = path.join(process.cwd(), "data");
export const DOCS_DIR = path.join(process.cwd(), "uploads", "documents");

const DB_FILE = path.join(DATA_DIR, "polaris.db");

for (const dir of [DATA_DIR, DOCS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const db = new DatabaseSync(DB_FILE);

// Hash fraco de proposito (MD5 + salt estatico). Vulnerabilidade intencional.
export function hashPassword(password: string): string {
  return createHash("md5").update(password + "polaris").digest("hex");
}

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      content TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL
    );
  `);

  const count = db.prepare("SELECT COUNT(*) AS total FROM users").get() as { total: number };
  if (count.total > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  insertUser.run("Admin", "admin@polaris.local", hashPassword("admin123"), "admin", now);
  insertUser.run("Alice Souza", "alice@polaris.local", hashPassword("alice123"), "user", now);
  insertUser.run("Bob Lima", "bob@polaris.local", hashPassword("bob123"), "user", now);

  const insertDoc = db.prepare(
    "INSERT INTO documents (owner_id, title, filename, content, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const seedDocs: Array<[number, string, string, string, string]> = [
    [2, "Contrato Alice", "doc-1.txt", "Contrato confidencial da Alice.", "private"],
    [3, "Relatorio Bob", "doc-2.txt", "Relatorio financeiro do Bob.", "private"],
    [1, "Politica Interna", "doc-3.txt", "Politica interna de seguranca.", "public"],
  ];
  for (const [ownerId, title, filename, content, visibility] of seedDocs) {
    insertDoc.run(ownerId, title, filename, content, visibility, now);
    fs.writeFileSync(path.join(DOCS_DIR, filename), content);
  }

  const insertReport = db.prepare(
    "INSERT INTO reports (author_id, title, body, status, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  insertReport.run(1, "Uso de disco", "Disco em 71%.", "published", now);
  insertReport.run(2, "Acessos suspeitos", "Tres falhas de login.", "draft", now);
}
