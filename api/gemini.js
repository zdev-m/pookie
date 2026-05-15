// api/gemini.js
// Pookie AI — Vercel Serverless Function
// Accepts { prompt, system } — system sets the AI personality/mode
// NOTE: Free Gemini tier ~15 RPM and 1M tokens/day

import { GoogleGenerativeAI } from “@google/generative-ai”;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
// ── CORS ──────────────────────────────────────────────────────────────────
res.setHeader(“Access-Control-Allow-Origin”, “*”);
res.setHeader(“Access-Control-Allow-Methods”, “POST, OPTIONS”);
res.setHeader(“Access-Control-Allow-Headers”, “Content-Type”);

if (req.method === “OPTIONS”) return res.status(200).end();
if (req.method !== “POST”) return res.status(405).json({ error: “Use POST.” });

// ── Validation ─────────────────────────────────────────────────────────────
const { prompt, system } = req.body;

if (!prompt || typeof prompt !== “string” || prompt.trim() === “”) {
return res.status(400).json({ error: “Missing or empty ‘prompt’.” });
}

// ── Call Gemini ─────────────────────────────────────────────────────────────
try {
const model = genAI.getGenerativeModel({
model: “gemini-2.0-flash”,
// system sets the personality mode sent from the frontend
systemInstruction: system || “You are Pookie, a helpful and friendly AI assistant.”
});

```
const result = await model.generateContent(prompt.trim());
const text   = result.response.text();

return res.status(200).json({ text });
```

} catch (error) {
console.error(”[Pookie AI] Gemini error:”, error);
return res.status(500).json({
error: “Gemini API failed.”,
details: error.message || “Unknown error”
});
}
}
