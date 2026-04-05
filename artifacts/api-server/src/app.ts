import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Temporary source download endpoint
app.get("/download-source", (_req, res) => {
  const file = "/tmp/voice-persona-ai.tar.gz";
  res.download(file, "voice-persona-ai.tar.gz", (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: "File not ready" });
  });
});

export default app;
