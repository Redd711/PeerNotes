import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // uses your existing key file

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for Vercel frontend
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.vercel.app",
  ],
  credentials: true,
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

app.post("/api/moderate", async (req, res) => {
  const { title, content } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a content moderation AI. 
Analyze the following text for harmful or unsafe content in both **English and Tagalog** such as:
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
        temperature: 0.2, // keep it focused and deterministic
      },
    });

    const output = result.response.text().trim();

    // Try to extract valid JSON even if model adds text around it
    let jsonStart = output.indexOf("{");
    let jsonEnd = output.lastIndexOf("}");
    let jsonString =
      jsonStart !== -1 && jsonEnd !== -1
        ? output.slice(jsonStart, jsonEnd + 1)
        : "{}";

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      parsed = { isHarmful: false, reason: "Could not parse model response." };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Gemini moderation error:", err);
    res
      .status(500)
      .json({ isHarmful: false, reason: "Moderation service failed." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
