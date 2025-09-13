import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// Log paths for debugging
console.log("Current directory:", process.cwd());
console.log("__dirname:", __dirname);
console.log("DATA_DIR path:", DATA_DIR);
console.log("PUBLIC_DIR path:", PUBLIC_DIR);

// Ensure directories exist
await fs.ensureDir(DATA_DIR);
await fs.ensureDir(PUBLIC_DIR);

// Check if public/index.html exists
const indexPath = path.join(PUBLIC_DIR, "index.html");
console.log("Checking if index.html exists at:", indexPath);
const indexExists = await fs.pathExists(indexPath);
console.log("index.html exists:", indexExists);

// Initialize state file if it doesn't exist
if (!(await fs.pathExists(STATE_FILE))) {
  console.log("Creating new state.json file");
  await fs.writeJson(STATE_FILE, { clients: [], bookings: [], sig: String(Date.now()) }, { spaces: 2 });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// GET state (supports conditional by sig)
app.get("/api/state", async (req, res) => {
  try {
    const sinceSig = req.query.sig?.toString();
    const state = await fs.readJson(STATE_FILE);
    if (sinceSig && state.sig && sinceSig === state.sig) {
      // no change
      return res.status(200).json({ sig: state.sig });
    }
    res.json(state);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to read state." });
  }
});

// In-memory SSE clients
const sseClients = new Set();
function broadcastState(state){
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch(_) {}
  }
}

app.put("/api/state", async (req, res) => {
  try {
    const { clients, bookings, prevSig } = req.body || {};
    if (!Array.isArray(clients) || !Array.isArray(bookings)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    const current = await fs.readJson(STATE_FILE).catch(()=>({ sig: "" }));
    // last-writer-wins; optionally enforce if(prevSig && prevSig!==current.sig) return 409
    const newState = { clients, bookings, sig: String(Date.now()) };
    await fs.writeJson(STATE_FILE, newState, { spaces: 2 });
    // broadcast to SSE listeners
    broadcastState(newState);
    res.json({ ok: true, sig: newState.sig });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to write state." });
  }
});

// SSE stream for live updates
app.get('/api/state/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('\n');
  sseClients.add(res);
  req.on('close', () => { sseClients.delete(res); });

  // Send current state immediately
  try{
    const state = await fs.readJson(STATE_FILE);
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  }catch(_){ /* ignore */ }
});

// Serve static files with fallback
console.log(`Serving static files from: ${PUBLIC_DIR}`);
app.use(express.static(PUBLIC_DIR, {
  index: false,
  maxAge: "7d",
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// API health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    publicDir: PUBLIC_DIR,
    dataDir: DATA_DIR
  });
});

// Handle all other routes - serve index.html if present; otherwise 404
app.get("*", async (req, res) => {
  const indexFile = path.join(PUBLIC_DIR, "index.html");
  try {
    const exists = await fs.pathExists(indexFile);
    if (exists) return res.sendFile(indexFile);
    return res.status(404).send("Not Found");
  } catch (err) {
    console.error("Error checking for index.html:", err);
    return res.status(500).send(`Server error: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
