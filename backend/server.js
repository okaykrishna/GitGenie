import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import analyzeRouter from "./routes/analyze.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: "200kb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "*",
  })
);

// Protects your Gemini quota from abuse - 10 generations per IP per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again in a few minutes." },
});
app.use("/api/analyze", limiter);

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api", analyzeRouter);

app.listen(PORT, () => {
  console.log(`Proof of Work backend running on http://localhost:${PORT}`);
});
