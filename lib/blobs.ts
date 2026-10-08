// Minimal Netlify Blobs client. No npm dependencies, so the functions bundle
// without needing node_modules to be in any particular state.
// Spec followed: netlify/primitives packages/blobs/src/{client,store,environment,util}.ts

const SITE_PREFIX = "site:";

interface Ctx {
  siteID?: string;
  token?: string;
  edgeURL?: string;
  uncachedEdgeURL?: string;
  apiURL?: string;
}

function context(): Ctx {
  const g: unknown = (globalThis as Record<string, unknown>).netlifyBlobsContext;
  const raw = typeof g === "string" && g ? g : process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) throw new Error("Netlify Blobs is not configured for this site");
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const ctx = JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as Ctx;
  if (!ctx.siteID || !ctx.token) throw new Error("Netlify Blobs context is incomplete");
  return ctx;
}

function storeUrl(ctx: Ctx, key?: string): { url: string; auth: boolean } {
  const store = SITE_PREFIX + "dontblockme";
  const edge = ctx.uncachedEdgeURL || ctx.edgeURL;
  if (edge) {
    const path = `/${ctx.siteID}/${store}${key ? "/" + encodeURIComponent(key) : ""}`;
    return { url: new URL(path, edge).toString(), auth: true };
  }
  const api = ctx.apiURL || "https://api.netlify.com";
  const path = `/api/v1/blobs/${ctx.siteID}/${store}${key ? "/" + encodeURIComponent(key) : ""}`;
  return { url: new URL(path, api).toString(), auth: true };
}

const signed = (url: string, method: string, headers: Record<string, string>) =>
  fetch(url, { method, headers: { ...headers, accept: "application/json;type=signed-url" } });

async function call(method: string, key: string | undefined, body?: string, extra?: Record<string, string>): Promise<Response> {
  const ctx = context();
  const { url } = storeUrl(ctx, key);
  const headers: Record<string, string> = { ...extra };
  const usesEdge = Boolean(ctx.uncachedEdgeURL || ctx.edgeURL);
  if (usesEdge) headers.authorization = `Bearer ${ctx.token}`;
  if (method === "PUT") headers["cache-control"] = "max-age=0, stale-while-revalidate=60";

  const hasKey = key !== undefined;
  if (!usesEdge && hasKey && method !== "HEAD" && method !== "DELETE") {
    const mint = await signed(url, method, { authorization: `Bearer ${ctx.token}`, ...extra });
    if (mint.status !== 200) return mint;
    const { url: signedUrl } = (await mint.json()) as { url: string };
    return fetch(signedUrl, { method, body, headers: stripAuth(headers) });
  }
  if (!usesEdge) headers.authorization = `Bearer ${ctx.token}`;
  return fetch(url, { method, body, headers });
}

function stripAuth(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(headers)) if (k.toLowerCase() !== "authorization" && k.toLowerCase() !== "cache-control") out[k] = headers[k];
  return out;
}

export async function getJson<T>(key: string): Promise<T | null> {
  const res = await call("GET", key);
  if (res.status === 404) return null;
  if (res.status !== 200) throw new Error(`blobs get failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function setJson(key: string, value: unknown): Promise<void> {
  const res = await call("PUT", key, JSON.stringify(value), { "content-type": "application/json" });
  if (res.status !== 200) throw new Error(`blobs put failed: ${res.status}`);
}

export async function listKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const ctx = context();
    const { url: base } = storeUrl(ctx);
    const u = new URL(base);
    u.searchParams.set("prefix", prefix);
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { headers: { authorization: `Bearer ${ctx.token}` } });
    if (res.status === 404) break;
    if (res.status !== 200) throw new Error(`blobs list failed: ${res.status}`);
    const body = (await res.json()) as { blobs?: Array<{ key: string }>; next_cursor?: string };
    for (const b of body.blobs || []) keys.push(b.key);
    if (!body.next_cursor) break;
    cursor = body.next_cursor;
  }
  return keys;
}
