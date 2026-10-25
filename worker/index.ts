// Cloudflare Worker: stores heart ratings and feedback in D1.
// Also adds byte-range support for /audio/*. Pages are served straight from the static assets.

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : null);

const stars = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

// Create the tables on first use, so a fresh D1 database needs no manual setup.
// Keep in sync with migrations/0001_init.sql.
let schemaReady: Promise<unknown> | undefined;
const ensureSchema = (db: D1Database) =>
  (schemaReady ??= db
    .batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          experience TEXT,
          frequency TEXT,
          satisfaction INTEGER CHECK (satisfaction BETWEEN 1 AND 5),
          improve_area TEXT,
          improve_text TEXT,
          email TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
      ),
    ])
    .catch((err) => {
      schemaReady = undefined;
      throw err;
    }));

async function rating(req: Request, env: Env) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const page = text(body.page, 100);
  const value = stars(body.rating);
  if (!page || !value) return json({ error: "Invalid rating" }, 400);

  await ensureSchema(env.DB);
  await env.DB.prepare("INSERT INTO ratings (page, rating) VALUES (?, ?)").bind(page, value).run();
  return json({ ok: true });
}

async function feedback(req: Request, env: Env) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = text(body.email, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);

  await ensureSchema(env.DB);
  await env.DB.prepare(
    "INSERT INTO feedback (experience, frequency, satisfaction, improve_area, improve_text, email) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(text(body.experience, 50), text(body.frequency, 50), stars(body.satisfaction), text(body.improveArea, 100), text(body.improveText), email)
    .run();
  return json({ ok: true });
}

// iOS Safari only plays audio served with byte ranges (206 Partial Content).
// If the asset response ignores the Range header, slice the file here.
async function audio(req: Request, env: Env) {
  const res = await env.ASSETS.fetch(req);
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (!range || res.status !== 200) return res;

  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  let start = range[1] ? Number(range[1]) : size - Number(range[2]);
  let end = range[1] && range[2] ? Number(range[2]) : size - 1;
  start = Math.max(0, start);
  end = Math.min(end, size - 1);
  if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });

  const headers = new Headers(res.headers);
  headers.set("content-range", `bytes ${start}-${end}/${size}`);
  headers.set("content-length", String(end - start + 1));
  headers.set("accept-ranges", "bytes");
  return new Response(buf.slice(start, end + 1), { status: 206, headers });
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);

    if (req.method === "POST" && pathname === "/api/rating") return rating(req, env);
    if (req.method === "POST" && pathname === "/api/feedback") return feedback(req, env);
    if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    if (pathname.startsWith("/audio/")) return audio(req, env);

    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
