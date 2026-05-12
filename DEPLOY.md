# Noor — Vercel Deployment Guide

## 1. API Key kahan se lein
1. https://aistudio.google.com/apikey kholein
2. **Create API Key** par click karein
3. Key copy karein (yeh aapki personal key hai — kisi se share na karein)

## 2. Local development
```bash
bun install
cp .env.example .env
# .env file kholein aur apni key paste karein:
# GEMINI_API_KEY=AIza...
bun run dev
```

`.env` file `.gitignore` mein already shamil hai — git mein commit nahi hogi.

## 3. Vercel pe deploy
1. https://vercel.com par login karein
2. **Add New → Project** → apni GitHub repo import karein (ya zip upload)
3. Build settings:
   - Framework Preset: **Other**
   - Build Command: `bun run build`
   - Output Directory: `.output/public` (TanStack Start default)
4. **Environment Variables** section mein add karein:
   - Name: `GEMINI_API_KEY`
   - Value: aapki Gemini API key
   - Environment: Production, Preview, Development (teeno tick karein)
5. **Deploy** click karein

Bas! Key sirf server pe rahegi, browser/code mein expose nahi hogi.

## 4. Notes
- TanStack Start ka backend (server functions) Vercel pe automatically serverless functions ke taur pe deploy hota hai
- Mic feature (Web Speech API) sirf HTTPS pe kaam karta hai — Vercel default HTTPS deta hai
- Agar key rotate karni ho to Vercel dashboard se update karke redeploy karein
