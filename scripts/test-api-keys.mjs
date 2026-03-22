/**
 * Test OpenAI and FreeAstro API keys from .env.local
 * Run: node scripts/test-api-keys.mjs
 */
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const [key, ...val] = line.split("=");
    if (key && val.length) {
      process.env[key.trim()] = val.join("=").trim();
    }
  }
} catch (e) {
  console.error("Could not load .env.local:", e.message);
  process.exit(1);
}

const FREE_ASTRO = process.env.FREE_ASTRO_API_KEY;
const OPENAI = process.env.OPENAI_API_KEY;

async function testFreeAstro() {
  if (!FREE_ASTRO) {
    return { ok: false, error: "FREE_ASTRO_API_KEY not set" };
  }
  try {
    const res = await fetch("https://api.freeastroapi.com/api/v1/natal/calculate", {
      method: "POST",
      headers: {
        "x-api-key": FREE_ASTRO,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test",
        year: 1974,
        month: 3,
        day: 10,
        hour: 12,
        minute: 0,
        city: "New York",
        tz_str: "AUTO",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || data.message || `HTTP ${res.status}` };
    }
    const sun = data.planets?.find((p) => p.name === "Sun");
    return {
      ok: true,
      sunSign: sun?.sign || "unknown",
      message: "FreeAstro API working",
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function testOpenAI() {
  if (!OPENAI) {
    return { ok: false, error: "OPENAI_API_KEY not set" };
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Reply with only: OK" }],
        max_tokens: 5,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message || data.error?.code || `HTTP ${res.status}`,
      };
    }
    const reply = data.choices?.[0]?.message?.content?.trim();
    return {
      ok: true,
      reply,
      message: "OpenAI API working",
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  console.log("Testing API keys from .env.local...\n");

  console.log("FreeAstro API:");
  const fa = await testFreeAstro();
  if (fa.ok) {
    console.log(`  ✓ ${fa.message} (Sun sign for test birth: ${fa.sunSign})`);
  } else {
    console.log(`  ✗ Failed: ${fa.error}`);
  }

  console.log("\nOpenAI API:");
  const oa = await testOpenAI();
  if (oa.ok) {
    console.log(`  ✓ ${oa.message}`);
  } else {
    console.log(`  ✗ Failed: ${oa.error}`);
  }

  console.log("");
  if (fa.ok && oa.ok) {
    console.log("Both API keys are working.");
  } else {
    process.exit(1);
  }
}

main();
