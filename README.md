# Vizta Tint of North Jersey — Window Film Estimate Calculator

Customer-facing web app that calculates an **estimated price range** (±10%) for architectural window film installation based on window measurements, film type, and difficulty factors.

## Features

- **Price range** (±10%), not a fixed quote; $400 minimum project investment
- **Special equipment flag**: windows with top above 15 ft → custom quote message, no price range
- **Lead capture** before revealing estimate (configurable via `config/pricing.json`: `requireLeadBeforeEstimate`)
- **Mobile-friendly**, premium UI with Tailwind CSS
- **Configurable pricing** in `config/pricing.json`; logic isolated in `lib/pricing.ts`

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Unit tests: Jest

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production server
- `npm test` — run unit tests (pricing logic)

## Project Structure

- `app/page.tsx` — main calculator page and form state
- `app/api/estimate/route.ts` — POST endpoint for lead submission (logs payload; hooks for Zapier/Make/Sheets commented)
- `components/WindowForm.tsx` — per-window fields (dimensions, frame, shape, install type, location, film, 15 ft question)
- `components/Summary.tsx` — live estimate summary and range
- `components/LeadForm.tsx` — name, email, phone, ZIP, notes, SMS consent
- `lib/pricing.ts` — pricing calculations (sqft, adders, minimum, range)
- `lib/types.ts` — shared types
- `config/pricing.json` — base prices, adders, minimums, dimension limits, `requireLeadBeforeEstimate`

## Configuration

Edit `config/pricing.json` to:

- Toggle **lead before estimate**: `requireLeadBeforeEstimate: true | false`
- Set **dimension limits** (inches): `dimensionMinInches`, `dimensionMaxInches`
- Adjust **film types** and **per-sqft / flat adders** (wood, skylight, custom, exterior, stairwell)

## Estimate Logic

- **Sqft** = (width × height) / 144 (inches → sqft)
- **Per window**: base (sqft × film price) + per-sqft adders (wood, skylight, custom, exterior) + flat (stairwell $150)
- **Project total** = sum of windows; then `max(total, 400)`
- **Range**: low = total × 0.9, high = total × 1.1, rounded to nearest $10
- If **any** window has “top above 15 ft” → do not show price range; show custom-quote message

## API: Lead Submission

`POST /api/estimate` expects JSON:

```json
{
  "lead": { "name", "email", "phone", "zipCode", "notes", "smsConsent" },
  "estimate": { "low", "high", ... } | null,
  "windows": [ ... ]
}
```

MVP logs the payload. See `app/api/estimate/route.ts` for commented Zapier/Make/Google Sheets integration.
