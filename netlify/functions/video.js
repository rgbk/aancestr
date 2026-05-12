// netlify/functions/video.js
// Stores + serves the current default video URL for the Aancestr stage.
// GET /api/video      → { url, updatedAt } | { url: null }
// POST /api/video     → body: { url: string | null }   (null clears the default)

import { getStore } from "@netlify/blobs";

const STORE_NAME = "aancestr-stage";
const KEY = "current-video";

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

    // Clearing the default
    if (body.url === null || body.url === "") {
      await store.delete(KEY);
      return json({ ok: true, url: null });
    }

    if (typeof body.url !== "string" || !/^https?:\/\//.test(body.url)) {
      return json({ error: "Missing or invalid url" }, 400);
    }

    const record = { url: body.url, updatedAt: new Date().toISOString() };
    await store.setJSON(KEY, record);
    return json({ ok: true, ...record });
  }

  // GET (and anything else falls through to GET-style read)
  const data = await store.get(KEY, { type: "json" });
  return json(data || { url: null });
};

export const config = {
  path: "/api/video",
};
