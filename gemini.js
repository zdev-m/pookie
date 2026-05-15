// api/gemini.js
// Pookie AI — Vercel Serverless Function
// Proxies requests to Google Gemini 2.5 Flash API
// NOTE: Free Gemini tier allows ~15 RPM and 1M tokens/day. Cache responses where possible.

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client using the environment variable set in Vercel dashboard
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // ── CORS Headers ────────────────────────────────────────────────────────────
  // Allow all origins during development. Restrict to your frontend domain in production:
  // res.setHeader("Access-Control-Allow-Origin", "https://your-frontend.vercel.app");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request sent by browsers before actual POST
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ── Method Guard ─────────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // ── Input Validation ─────────────────────────────────────────────────────────
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ error: "Missing or empty 'prompt' in request body." });
  }

  // ── Call Gemini API ───────────────────────────────────────────────────────────
  try {
    // Use gemini-2.5-flash — fast, free-tier friendly
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt.trim());
    const response = await result.response;
    const text = response.text();

    // Return the generated text to the frontend
    return res.status(200).json({ text });

  } catch (error) {
    // Log full error server-side (visible in Vercel function logs)
    console.error("[Pookie AI] Gemini API error:", error);

    // Return a clean error to the client
    return res.status(500).json({
      error: "Failed to get response from Gemini.",
      details: error.message || "Unknown error",
    });
  }
}
