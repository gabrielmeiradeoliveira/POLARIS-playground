import express from "express";
import { PORT, SERVICE_NAME } from "./config";
import { statusPayload } from "./status";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/status", (_req, res) => {
  res.status(200).json(statusPayload(SERVICE_NAME));
});

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} listening on http://localhost:${PORT}`);
});

export default app;
