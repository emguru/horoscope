# Natal Chart Horoscope

A **Next.js 16 + React 19** app that turns birth date, time, and location into a natal chart and a structured daily reading. Includes an Expo Android client in `android/`.

This is a personal/portfolio project: forms, API routes, client state, and a small mobile UI — not a production astrology product.

## Features

- Birth data form (date, time, location)
- Geocoding via Nominatim (no API key)
- Natal chart via [FreeAstroAPI](https://freeastroapi.com/) when a key is set, with a local fallback
- Daily reading and partner/synastry compare
- Settings for pronouns and optional per-user API keys
- Android app (React Native / Expo) that talks to the same APIs

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

In `.env.local`:

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | For AI readings | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `FREE_ASTRO_API_KEY` | Optional | Natal/transit detail ([freeastroapi.com](https://freeastroapi.com/), 80 req/day) |

Open [http://localhost:3000](http://localhost:3000).

## Android

```bash
cd android
npm install
npm run android
```

See [android/README.md](android/README.md) for emulator vs device URLs and EAS builds.

## Layout

```
src/app/           Next.js App Router pages and API routes
src/components/    React UI (forms, chart wheel, readings, settings)
src/lib/           Chart math, geocoding, prompts
android/           Expo / React Native client
```

## License

Source is for portfolio review. Do not commit API keys.
