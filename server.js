import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config(); // load local vars for dev only (do NOT commit .env.local)

const app = express();
const PORT = process.env.PORT || 8080;

// Database: expect Render Postgres DATABASE_URL
const connectionString = process.env.DATABASE_URL || null;
const pool = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : null;

async function initDB() {
  if (!pool) {
    console.warn("No DATABASE_URL provided - running without DB (dev only).");
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}
initDB().catch((err) => console.error("DB init error:", err));

// CORS - allow all origins (tighten later in production)
app.use(
  cors({
    origin: [
      "https://peer-notes.vercel.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json());
app.use(bodyParser.json());

// Use GEMINI_API_KEY on the server (set this in Render environment)
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.warn("GEMINI_API_KEY not set. Moderation will fail without it.");
}
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Moderation helper - returns parsed moderation result { isHarmful, reason }
async function moderateText(title, content) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a content moderation AI. Analyze the following text for harmful or unsafe content in English and Tagalog:
- self-harm
- hate speech
- violence
- harassment
- explicit or illegal material
- sexual language

Respond ONLY with a valid JSON object in this exact format:
{
  "isHarmful": true/false,
  "reason": "A brief explanation if harmful"
}

Title: ${title}
Content: ${content}
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    });

    const output = result.response.text().trim();
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");
    const jsonString =
      jsonStart !== -1 && jsonEnd !== -1 ? output.slice(jsonStart, jsonEnd + 1) : "{}";

    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (err) {
      return { isHarmful: false, reason: "Could not parse model response." };
    }
  } catch (err) {
    console.error("Moderation error:", err);
    return { isHarmful: false, reason: "Moderation failed." };
  }
}

// Create note (moderate first, then save)
app.post("/api/notes", async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Missing title or content" });

  const mod = await moderateText(title, content);
  if (mod.isHarmful) {
    return res.status(400).json({ error: "Content flagged", reason: mod.reason });
  }

  if (!pool) {
    // fallback to simple in-memory behavior for dev if DB not configured
    // (You can implement a local store or return not implemented)
    return res.status(501).json({ error: "Database not configured" });
  }

  try {
    const insert = await pool.query(
      "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at",
      [title, content]
    );
    res.json(insert.rows[0]);
  } catch (err) {
    console.error("DB insert error:", err);
    res.status(500).json({ error: "Could not save note" });
  }
});

// Get list of notes
app.get("/api/notes", async (req, res) => {
  if (!pool) return res.status(501).json({ error: "Database not configured" });
  try {
    const result = await pool.query("SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("DB select error:", err);
    res.status(500).json({ error: "Could not fetch notes" });
  }
});

// Optional: get single note
app.get("/api/notes/:id", async (req, res) => {
  if (!pool) return res.status(501).json({ error: "Database not configured" });
  try {
    const result = await pool.query("SELECT id, title, content, created_at FROM notes WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB select error:", err);
    res.status(500).json({ error: "Could not fetch note" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
