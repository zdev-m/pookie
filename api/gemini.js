
// api/gemini.js
// Pookie AI — No external packages, pure fetch to Gemini REST API

module.exports = async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  // ── Validation ─────────────────────────────────────────────────────────────
  const { prompt, system } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ error: "Missing or empty prompt." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set." });
  }

  // ── Call Gemini REST API directly (no package needed) ──────────────────────
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
      system_instruction: {
        parts: [{ text: system || "You are Pookie, a helpful and friendly AI assistant." }]
      },
      contents: [
        { role: "user", parts: [{ text: prompt.trim() }] }
      ]
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("[Pookie AI] Gemini API error:", data);
      return res.status(500).json({ error: "Gemini error", details: data });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    return res.status(200).json({ text });

  } catch (error) {
    console.error("[Pookie AI] Fetch error:", error);
    return res.status(500).json({ error: error.message });
  }
};
