import express from "express";
import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";
import reportRoutes from "./routes/reports";
import userRoutes from "./routes/users";
import { initSchema } from "./db";

initSchema();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/reports", reportRoutes);
app.use("/users", userRoutes);

// Handler de erro verboso: devolve stack trace ao cliente. Vulnerabilidade intencional.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message, stack: err.stack });
});

export default app;
