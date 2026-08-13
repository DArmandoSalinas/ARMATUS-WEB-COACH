# ARMATUS Coach Studio

Studio for coaches: fill a ficha, generate biomecánica copy + ARMATUS bocetos, edit or ask for changes, then deliver PDF, WhatsApp, or a reading link.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- OpenAI `gpt-4o` for coaching copy (ES or EN)
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
   - `BLOB_READ_WRITE_TOKEN` = required to **Compartir** across phones
4. Deploy → share the URL with your coaches

Each coach uses the studio in the browser (routines persist in localStorage + IndexedDB). No accounts.

To share a routine across phones, **Compartir** publishes lean JSON + images to Vercel Blob (`BLOB_READ_WRITE_TOKEN`). Without the token, the routine still works locally.

## Coach flow

1. **Ficha** on `/crear` (athlete, goal, equipment, blocks). It autosaves in this browser. **Brief libre** if the text already exists.
2. Review, **Oscuro / Claro**, **Editar**, or **Pedir cambios**. **Deshacer último pedido** restores the previous version.
3. Deliver:
   - **PDF** (estudio or clara, matches the page theme)
   - **WhatsApp** / copy the dose sheet (sets, reps, rest)
   - **Link de lectura** (`?leer=1`) for the athlete: no edit or change-request chrome

Home shows recent routines (search by athlete or goal). Duplicate with **Usar como base**.

## Notes

- Library bocetos live in `public/bocetos/` (white/orange line art)
- Clearing site data clears saved routines (example seed returns on next visit)
- PDF uses Barlow Condensed + Outfit from `public/fonts/`
- Theme (Oscuro/Claro) and language (ES/EN) persist in the browser
