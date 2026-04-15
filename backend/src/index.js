import express from "express";
import cors from "cors";
import analyzeRouter from "./routes/analyze.js";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const allowedOrigin = process.env.FRONTEND_ORIGIN?.trim();
app.use(
  cors({
    origin: allowedOrigin ? [allowedOrigin] : true,
    credentials: false,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api", analyzeRouter);

// Serve frontend (single-domain hosting)
// - In dev, you can copy `frontend/dist` to `backend/public`
// - In production build, we copy `frontend/dist` into `backend/dist/public`
const publicDir = path.resolve(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback for client-side routes like /history, /stats.
  // Express 5 rejects "*" route patterns, so use a terminal middleware.
  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not Found", message: "API route not found" });
    }
    return res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
