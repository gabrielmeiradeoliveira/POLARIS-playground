import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { authRequired, currentUser } from "../auth";
import { db, DOCS_DIR } from "../db";

const router = Router();

router.use(authRequired);

// GET /documents?search=...
// SQL Injection via LIKE concatenado. Vulnerabilidade intencional.
router.get("/", (req, res) => {
  const search = String(req.query.search ?? "");
  const rows = db
    .prepare(
      `SELECT * FROM documents WHERE title LIKE '%${search}%' OR content LIKE '%${search}%' ORDER BY id DESC`
    )
    .all();

  res.json(rows);
});

// GET /documents/:id
// IDOR: nao valida se o documento pertence ao usuario. Vulnerabilidade intencional.
router.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM documents WHERE id = ${req.params.id}`).get();

  if (!row) {
    res.status(404).json({ error: "documento nao encontrado" });
    return;
  }

  res.json(row);
});

// GET /documents/download?name=...
// Path Traversal: concatena entrada do usuario ao diretorio. Vulnerabilidade intencional.
router.get("/download/file", (req, res) => {
  const name = String(req.query.name ?? "");
  const filePath = path.join(DOCS_DIR, name);

  try {
    const content = fs.readFileSync(filePath);
    res.type("application/octet-stream").send(content);
  } catch (err) {
    res.status(500).json({ error: String(err), stack: (err as Error).stack });
  }
});

// POST /documents
// Upload sem validacao de tipo/tamanho e com filename controlado pelo cliente
// (path traversal na escrita). Vulnerabilidades intencionais.
router.post("/", (req, res) => {
  const user = currentUser(req);
  const { title, filename, content, visibility } = req.body ?? {};

  if (!title || !content) {
    res.status(400).json({ error: "title e content sao obrigatorios" });
    return;
  }

  const safeName = filename ?? `doc-${Date.now()}.txt`;
  const filePath = path.join(DOCS_DIR, safeName);

  try {
    fs.writeFileSync(filePath, String(content));
  } catch (err) {
    res.status(500).json({ error: String(err) });
    return;
  }

  const result = db
    .prepare(
      "INSERT INTO documents (owner_id, title, filename, content, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(Number(user?.sub ?? 0), String(title), String(safeName), String(content), String(visibility ?? "private"), new Date().toISOString());

  res.status(201).json({ id: Number(result.lastInsertRowid), filename: safeName });
});

// DELETE /documents/:id
// Sem checagem de papel/admin. Vulnerabilidade intencional.
router.delete("/:id", (req, res) => {
  const doc = db.prepare(`SELECT * FROM documents WHERE id = ${req.params.id}`).get() as
    | { filename: string }
    | undefined;

  if (!doc) {
    res.status(404).json({ error: "documento nao encontrado" });
    return;
  }

  db.prepare(`DELETE FROM documents WHERE id = ${req.params.id}`).run();

  try {
    fs.unlinkSync(path.join(DOCS_DIR, doc.filename));
  } catch {
    // ignora falha de remocao fisica
  }

  res.status(204).end();
});

export default router;
