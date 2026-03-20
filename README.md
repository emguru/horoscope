# Natal Chart Horoscope App

A Next.js app that generates personalized daily astrological readings based on your natal chart. Enter your birth date, time, and location to get a data-driven reading.

## Features

- **Birth data inputs**: Date, time (local), and physical location
- **Geocoding**: Converts city/location to coordinates via Nominatim (free, no key)
- **Natal chart**: Uses [FreeAstroAPI](https://freeastroapi.com/) (Swiss Ephemeris) when API key is set; fallback when not
- **AI readings**: Structured daily interpretation via OpenAI, following strict analytical guidelines

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   - `FREE_ASTRO_API_KEY` – Get a free key at [freeastroapi.com](https://freeastroapi.com/) (80 req/day)
   - `OPENAI_API_KEY` – Required for AI readings. Get at [platform.openai.com](https://platform.openai.com/api-keys)

3. **Run**
   ```bash
   npm run dev
   ```

## How it works

1. User enters birth date, time, and location.
2. Location is geocoded to lat/lng for accurate house placement.
3. Natal chart is calculated (FreeAstroAPI or fallback).
4. AI generates a daily reading using the natal chart data and strict guidelines:
   - Every statement references specific placements
   - No generic horoscope language
   - Professional, data-driven tone

## Tech stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS
- Vercel AI SDK + OpenAI
- FreeAstroAPI (natal chart)
- Nominatim (geocoding)
