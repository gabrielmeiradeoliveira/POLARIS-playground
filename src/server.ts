import app from "./app";
import { PORT, SERVICE_NAME } from "./config";
import { statusPayload } from "./status";

app.get("/status", (_req, res) => {
  res.status(200).json(statusPayload(SERVICE_NAME));
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} listening on http://localhost:${PORT}`);
});
