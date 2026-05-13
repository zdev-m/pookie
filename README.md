# 🌙 Noor — Islamic Voice Buddy for Kids

> Bacchon ka Islami sathi — Quran, kahaniyan aur duaein, sirf awaaz se.

---

## 📁 Project Structure

```
noor-vercel/
├── index.html          ← Pure HTML/CSS/JS frontend (no build needed)
├── assets/
│   └── noor-mascot.png ← Noor ka mascot image
├── api/
│   └── chat.js         ← Vercel serverless function (Google Gemini)
├── vercel.json         ← Vercel config
├── .env.example        ← Environment variables template
└── README.md
```

---

## 🔑 Step 1 — Gemini API Key lein (FREE)

1. https://aistudio.google.com/apikey kholein
2. **Create API Key** par click karein
3. Key copy kar lein — **kisi se share mat karein**

---

## 🚀 Step 2 — GitHub pe push karein

```bash
# Naya repo banao ya existing mein push karein
git init
git add .
git commit -m "Noor app — initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/noor-app.git
git push -u origin main
```

---

## ☁️ Step 3 — Vercel pe deploy karein

1. https://vercel.com pe login karein
2. **Add New → Project**
3. GitHub repo select karein
4. Build Settings:
   - **Framework Preset:** `Other`
   - **Build Command:** *(khali chhod do)*
   - **Output Directory:** *(khali chhod do)*
5. **Environment Variables** section mein:
   - `GEMINI_API_KEY` → aapki key paste karein
   - Environment: Production + Preview + Development — teeno tick karein
6. **Deploy** click karein ✅

---

## 💻 Local Development

```bash
# Vercel CLI install karein (ek baar)
npm i -g vercel

# .env file banao
cp .env.example .env
# .env mein GEMINI_API_KEY paste karein

# Local run karein
vercel dev
# Browser mein kholein: http://localhost:3000
```

---

## 🎯 Features

- 🎙️ Voice input (Web Speech API — Urdu + Roman Urdu)
- 🔊 Text-to-Speech output
- 🌙 Glassmorphism dark Islamic theme
- ✨ Animated crescent moon + floating mascot
- 📖 Quick buttons: Quran, Kahani, Dua, Science
- 🤖 Google Gemini 2.5 Flash (free tier)
- 📱 Mobile-first, touch-friendly

---

## ⚠️ Notes

- Mic feature sirf HTTPS pe kaam karta hai — Vercel default HTTPS deta hai ✓
- Chrome/Edge mein best experience milta hai
- Key rotate karni ho: Vercel dashboard → Settings → Environment Variables → update → Redeploy
