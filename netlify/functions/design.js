// netlify/functions/design.js
// Stores + serves the current "published" design state for the Aancestr stage:
// typography choices, page bg, per-block bg, mask mode, etc.
//
// GET  /api/design   → { state: {...}, updatedAt } | { state: null }
// POST /api/design   → body: { state: object | null }   (null clears)

import { getStore } from "@netlify/blobs";

const STORE_NAME = "aancestr-stage";
const KEY = "current-design";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...cors,
    },
  });

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: cors });
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    if (body.state === null) {
      await store.delete(KEY);
      return json({ ok: true, state: null });
    }

    if (typeof body.state !== "object" || Array.isArray(body.state)) {
      return json({ error: "state must be an object" }, 400);
    }

    const record = { state: body.state, updatedAt: new Date().toISOString() };
    await store.setJSON(KEY, record);
    return json({ ok: true, ...record });
  }

  // GET
  const data = await store.get(KEY, { type: "json" });
  return json(data || { state: null });
};

export const config = {
  path: "/api/design",
};
