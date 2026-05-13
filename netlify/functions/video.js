// netlify/functions/video.js
// Stores + serves video URLs for the Aancestr stage, split by slot:
//   - "bg"   → full-page background video (plays everywhere)
//   - "mask" → text-mask video (revealed only inside text shapes)
//
// GET  /api/video
//   → { bg:   { url, updatedAt } | { url: null },
//       mask: { url, updatedAt } | { url: null } }
//
// POST /api/video
//   body: { slot: "bg" | "mask", url: string | null }
//   (url=null clears that slot)

import { getStore } from "@netlify/blobs";

const STORE_NAME = "aancestr-stage";
const SLOTS = ["bg", "mask"];
const KEY_PREFIX = "current-video-";

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

    const slot = body.slot || "mask";
    if (!SLOTS.includes(slot)) {
      return json({ error: `Invalid slot. Must be one of: ${SLOTS.join(", ")}` }, 400);
    }

    const key = KEY_PREFIX + slot;

    if (body.url === null || body.url === "") {
      await store.delete(key);
      return json({ ok: true, slot, url: null });
    }

    if (typeof body.url !== "string" || !/^https?:\/\//.test(body.url)) {
      return json({ error: "Missing or invalid url" }, 400);
    }

    const record = { url: body.url, updatedAt: new Date().toISOString() };
    await store.setJSON(key, record);
    return json({ ok: true, slot, ...record });
  }

  // GET — return all slots in one payload
  const result = {};
  for (const slot of SLOTS) {
    const data = await store.get(KEY_PREFIX + slot, { type: "json" });
    result[slot] = data || { url: null };
  }
  return json(result);
};

export const config = {
  path: "/api/video",
};
