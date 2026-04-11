import express from "express";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, "data");
const DATA_FILE = join(DATA_DIR, "run.json");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Ensure data/ exists before accepting requests
await mkdir(DATA_DIR, { recursive: true });

app.get("/api/run", async (_req, res) => {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    res.type("json").send(raw); // raw is already valid JSON — send directly
  } catch (err) {
    if (err.code !== "ENOENT") console.error("GET /api/run:", err);
    res.json(null);
  }
});

app.post("/api/run", async (req, res) => {
  try {
    await writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), "utf8");
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/run:", err);
    res.status(500).json({ ok: false });
  }
});

app.listen(3001, () => console.log("[server] http://localhost:3001"));
