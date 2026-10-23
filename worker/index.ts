// Cloudflare Worker: stores heart ratings and feedback in D1.
// Everything outside /api/* is served straight from the static assets.

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

async function rating(req: Request, env: Env) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const page = text(body.page, 100);
  const value = stars(body.rating);
  if (!page || !value) return json({ error: "Invalid rating" }, 400);

  await env.DB.prepare("INSERT INTO ratings (page, rating) VALUES (?, ?)").bind(page, value).run();
  return json({ ok: true });
}

async function feedback(req: Request, env: Env) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = text(body.email, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);

  await env.DB.prepare(
    "INSERT INTO feedback (experience, frequency, satisfaction, improve_area, improve_text, email) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(text(body.experience, 50), text(body.frequency, 50), stars(body.satisfaction), text(body.improveArea, 100), text(body.improveText), email)
    .run();
  return json({ ok: true });
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);

    if (req.method === "POST" && pathname === "/api/rating") return rating(req, env);
    if (req.method === "POST" && pathname === "/api/feedback") return feedback(req, env);
    if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);

    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
