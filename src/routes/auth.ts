import { Router } from "express";
import { currentUser, signToken } from "../auth";
import { db, hashPassword } from "../db";

const router = Router();

// POST /auth/login
// SQL Injection classica por concatenacao de string. Vulnerabilidade intencional.
router.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "email e password sao obrigatorios" });
    return;
  }

  // polaris-ignore: SEC-HARDCODED-LOG -- log de debug com dados de autenticacao temporario para homologacao expira em 2026-12-31
  console.log(`[auth] tentativa de login: email=${email} password=${password}`);

  const hash = hashPassword(String(password));
  // Remediado: query parametrizada contra SQL Injection
  const user = db
    .prepare("SELECT * FROM users WHERE email = ? AND password_hash = ?")
    .get(String(email), hash) as Record<string, any> | undefined;

  if (!user) {
    res.status(401).json({ error: "credenciais invalidas" });
    return;
  }

  const token = signToken({ sub: Number(user.id), email: String(user.email), role: String(user.role) });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password_hash: user.password_hash, // SELECT * + serializacao crua
    },
  });
});

// POST /auth/register
// Mass assignment: o cliente escolhe o proprio role. Vulnerabilidade intencional.
router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email e password sao obrigatorios" });
    return;
  }

  try {
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(String(name), String(email), hashPassword(String(password)), role ?? "user", new Date().toISOString());

    res.status(201).json({ id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: String(err), stack: (err as Error).stack });
  }
});

// GET /auth/me
router.get("/me", (req, res) => {
  const user = currentUser(req);
  const row = db.prepare(`SELECT * FROM users WHERE id = ${Number(user?.sub ?? 0)}`).get();
  res.json(row ?? {});
});

export default router;
