# ARMATUS Coach Studio

Prompt-first studio for coaches: generate Spanish biomecánica routines, ARMATUS bocetos, edit / revise, download a professional PDF.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- OpenAI `gpt-4o` for coaching copy
- Bocetos: **ARMATUS library first** (~70 sketches), optional **fal.ai Flux** / OpenAI only when unmatched
- Client PDF via `@react-pdf/renderer` (real document, not a screenshot)
- Browser `localStorage` + IndexedDB (no login / no DB)

## Setup

```bash
npm install
cp .env.example .env.local
# set OPENAI_API_KEY
# optional: FAL_KEY for better AI bocetos when library misses
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel (share with coaches)

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com) → Framework: Next.js
3. Project → Settings → Environment Variables:
   - `OPENAI_API_KEY` = your key
   - `FAL_KEY` = optional
4. Deploy → share the URL with your coaches

Each coach uses the studio in their own browser (routines stay local). No accounts.

## Coach flow

1. Enter coach name → paste athlete brief → **Generar rutina**
2. Review (athlete view) or **Editar** / **Pedir cambios**
3. **Descargar PDF** → send to the athlete

## Notes

- Library bocetos live in `public/bocetos/` (white/orange line art)
- Clearing site data clears saved routines (example seed returns on next visit)
- PDF uses Barlow Condensed + Outfit from `public/fonts/`
