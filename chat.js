/**
 * Noor — Vercel Serverless Function
 * POST /api/chat
 * Body: { messages: [{role, content}] }
 * Env:  GEMINI_API_KEY (required)
 *       GEMINI_MODEL   (optional, default: gemini-2.5-flash)
 */

const SYSTEM_PROMPT = `Tum Noor ho, ek expert Islamic child educator aur friendly AI buddy. \
Tumhara kaam 5 se 12 saal ke bachon ko Quran aur Islami kahaniyan sikhana hai. \
Hamesha Roman Urdu mein baat karo. \
Har jawab ki shuruaat 'Pyare bache!' ya 'Mera hoshyaar dost!' se karo. \
Jawab chhota aur simple rakho, 3-4 sentences maximum. \
Agar bacha Quran parhna chahe to Surah Ikhlas ki pehli ayat sunao aur phir usay dohrane ko kaho. \
Agar kahani chahe to ek chhoti Islami kahani sunao aur ant mein ek aasan sawaal zaroor poochho. \
Agar Science ya Math ka sawal ho to Islami nukta-e-nazar se simple explain karo. \
Kabhi sakht lehja mat istemal karo. Hamesha pyar aur hosla afzai karo. \
Har response 70 words se kam rakho.`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "API key set nahi hai. Vercel dashboard mein GEMINI_API_KEY environment variable add karein.",
    });
  }

  let messages;
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  // Validate each message
  const valid = messages.every(
    (m) =>
      m &&
      typeof m.content === "string" &&
      (m.role === "user" || m.role === "assistant")
  );
  if (!valid) {
    return res.status(400).json({ error: "Invalid message format" });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 250,
          topP: 0.9,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);

      if (geminiRes.status === 429) {
        return res
          .status(429)
          .json({ error: "Bohot zyada requests! Thori der baad try karein." });
      }
      if (geminiRes.status === 400) {
        return res
          .status(400)
          .json({ error: "Pyare bache! Sawal samajh nahi aaya, dobara poochho." });
      }
      return res
        .status(502)
        .json({ error: "Pyare bache! Kuch masla ho gaya. Dobara try karo." });
    }

    const json = await geminiRes.json();
    const reply =
      json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Pyare bache! Mujhe samajh nahi aaya, dobara poochho.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("askNoor failed:", err);
    return res
      .status(500)
      .json({ error: "Pyare bache! Connection mein masla hai." });
  }
}
