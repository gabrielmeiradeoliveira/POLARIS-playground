import { Router } from "express";
import { currentUser } from "../auth";
import { db } from "../db";

const router = Router();

// POST /reports
// INSERT com concatenacao: SQL Injection. Vulnerabilidade intencional.
router.post("/", (req, res) => {
  const user = currentUser(req);
  const { title, body } = req.body ?? {};

  if (!title || !body) {
    res.status(400).json({ error: "title e body sao obrigatorios" });
    return;
  }

  const query = `INSERT INTO reports (author_id, title, body, status, created_at)
    VALUES (${Number(user?.sub ?? 0)}, '${title}', '${body}', 'draft', datetime('now'))`;

  try {
    db.prepare(query).run();
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err), stack: (err as Error).stack });
  }
});

// GET /reports/search?q=...
router.get("/search", (req, res) => {
  const q = String(req.query.q ?? "");
  const rows = db
    .prepare(`SELECT * FROM reports WHERE title LIKE '%${q}%' OR body LIKE '%${q}%'`)
    .all();
  res.json(rows);
});

// GET /reports/export?sort=...
// ORDER BY interpolado: SQL Injection de segunda ordem. Vulnerabilidade intencional.
router.get("/export", (req, res) => {
  const sort = String(req.query.sort ?? "id");
  const rows = db.prepare(`SELECT * FROM reports ORDER BY ${sort}`).all();
  res.type("text/csv").send(rows.map((r: any) => `${r.id},${r.title},${r.status}`).join("\n"));
});

// GET /reports/view?title=...
// XSS refletido: HTML montado com entrada do usuario. Vulnerabilidade intencional.
router.get("/view", (req, res) => {
  const title = String(req.query.title ?? "Relatorio");
  res.type("text/html").send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${title}</title></head>
<body><h1>Relatorio: ${title}</h1><p>Gerado pelo POLARIS playground.</p></body></html>`);
});

export default router;
