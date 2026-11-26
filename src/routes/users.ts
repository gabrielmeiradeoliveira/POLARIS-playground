import { Router } from "express";
import { authRequired } from "../auth";
import { db } from "../db";

const router = Router();

router.use(authRequired);

// GET /users
// SELECT * vaza password_hash; sem paginacao. Code smell + exposicao de dados.
router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM users").all();
  res.json(rows);
});

// GET /users/:id
router.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM users WHERE id = ${req.params.id}`).get();
  res.json(row ?? {});
});

export default router;
