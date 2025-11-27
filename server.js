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
      subject TEXT,
      content TEXT NOT NULL,
      tags JSONB DEFAULT '[]',
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reported_notes (
      id SERIAL PRIMARY KEY,
      note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      reported_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // NEW: Table to hold a single counter for auto-moderated notes
  await pool.query(`
    CREATE TABLE IF NOT EXISTS moderation_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      rejected_count INTEGER DEFAULT 0
    );
  `);

  // NEW: Ensure the single counter row exists (Upsert logic for the counter)
  await pool.query(`
    INSERT INTO moderation_stats (id, rejected_count) 
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
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
- profanity, foul language, or slurs

Respond ONLY with a valid JSON object in this exact format:
{"isHarmful": true/false, "reason": "A brief explanation if harmful. "}

**Keep the reason short and concise (under 10 words).**

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
  const { title, subject, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Missing title or content" });
  }

  const mod = await moderateText(title, content);
  if (mod.isHarmful) {
    // NEW: Increment the counter for auto-moderated notes
    if (pool) {
      try {
        await pool.query(`
          UPDATE moderation_stats 
          SET rejected_count = rejected_count + 1 
          WHERE id = 1;
        `);
      } catch (logErr) {
        console.error("DB Moderation Increment Error:", logErr);
      }
    }
    return res.status(400).json({ error: "Content flagged", reason: mod.reason });
  }

  if (!pool) {
    return res.status(501).json({ error: "Database not configured" });
  }

  try {
    const insert = await pool.query(
      `INSERT INTO notes (title, subject, content, tags, likes)
      VALUES ($1, $2, $3, $4::jsonb, 0)
      RETURNING id, title, subject, content, tags, likes, created_at`,
      [
        title,
        subject,
        content,
        JSON.stringify(tags || [])
      ]
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
    const result = await pool.query(
      "SELECT id, title, subject, content, tags, likes, created_at FROM notes ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("DB select error:", err);
    res.status(500).json({ error: "Could not fetch notes" });
  }
});

// Get single note
app.get("/api/notes/:id", async (req, res) => {
  if (!pool) return res.status(501).json({ error: "Database not configured" });

  try {
    const result = await pool.query(
      "SELECT id, title, subject, content, tags, likes, created_at FROM notes WHERE id = $1", [req.params.id]
    );

    if (result.rowCount === 0) 
      return res.status(404).json({ error: "Not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB select error:", err);
    res.status(500).json({ error: "Could not fetch note" });
  }
});

// Delete note
app.delete("/api/notes/:id", async (req, res) => {
  if (!pool) return res.status(501).json({ error: "Database not configured" });
  try {
    const result = await pool.query(
      "DELETE FROM notes WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("DB delete error:", err);
    res.status(500).json({ error: "Could not delete note" });
  }
});

// Like a note (increments likes by 1)
app.post("/api/notes/:id/like", async (req, res) => {
  if (!pool) return res.status(501).json({ error: "Database not configured" });

  try {
    const result = await pool.query(
      `UPDATE notes
      SET likes = likes + 1
      WHERE id = $1
      RETURNING id, title, subject, content, tags, likes, created_at`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB like error:", err);
    res.status(500).json({ error: "Could not like note" });
  }
});

// Report a note (save log to DB)
app.post("/api/notes/:id/report", async (req, res) => {
  try {
    const id = req.params.id;

    // Ensure note exists
    const noteCheck = await pool.query("SELECT id FROM notes WHERE id=$1", [id]);
    if (noteCheck.rowCount === 0)
      return res.status(404).json({ error: "Not found" });

    // Insert only if not already reported
    await pool.query(
      `INSERT INTO reported_notes (note_id)
      VALUES ($1)
      ON CONFLICT (note_id) DO NOTHING`,
      [id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: "Could not report note" });
  }
});


// Get all reported notes
app.get("/api/reported-notes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT rn.note_id, rn.reported_at,
             n.title, n.subject, n.content
      FROM reported_notes rn
      JOIN notes n ON n.id = rn.note_id
      ORDER BY rn.reported_at DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch reported notes error:", err);
    res.status(500).json({ error: "Could not fetch reported notes" });
  }
});

// NEW: Route to get platform statistics
app.get("/api/stats", async (req, res) => {
    if (!pool) return res.status(501).json({ error: "Database not configured" });

    try {
        // 1. Total Notes Visible
        const totalNotesResult = await pool.query("SELECT COUNT(*) AS total_notes FROM notes");
        const visibleNotes = parseInt(totalNotesResult.rows[0].total_notes);

        // 2. Total Notes Removed by Admin (Total distinct notes ever reported)
        // Note: This counts reported notes. If a note is reported and then removed,
        // it remains in reported_notes, so this is an approximation of admin-flagged content.
        const adminRemovedResult = await pool.query(`
            SELECT COUNT(DISTINCT note_id) AS removed_count
            FROM reported_notes;
        `);
        const adminRemoved = parseInt(adminRemovedResult.rows[0].removed_count);

        // 3. Total Notes Automatically Moderated (from the new logging table)
        const autoModeratedResult = await pool.query("SELECT rejected_count FROM moderation_stats WHERE id = 1");
        // Use optional chaining and default to 0 for robustness
        const autoModerated = parseInt(autoModeratedResult.rows[0]?.rejected_count || 0);

        res.json({
            visibleNotes,
            adminRemoved,
            autoModerated,
        });
    } catch (err) {
        console.error("Fetch stats error:", err);
        res.status(500).json({ error: "Could not fetch platform statistics" });
    }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});