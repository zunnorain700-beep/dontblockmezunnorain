import { bad, json, tokenMatches, validId, safe } from "../../lib/http";
import { getJson, listKeys } from "../../lib/blobs";
import { quizKey, responsePrefix, type Quiz } from "./quiz";

interface Entry {
  f: string;
  c: number;
  s: number;
  t: number;
  tss?: number;
}

export default safe(async (req: Request) => {
  if (req.method !== "GET") return bad("Method not allowed", 405);
  const p = new URL(req.url).searchParams;
  const id = p.get("id"), k = p.get("k");
  if (!validId(id) || !k) return bad("Not found", 404);

  const q = await getJson<Quiz>(quizKey(id));
  // Same response for unknown quiz and wrong key, so links can't be probed.
  if (!q || !tokenMatches(k, q.th)) return bad("Not found", 404);

  const keys = await listKeys(responsePrefix(id));
  const rows = (await Promise.all(keys.map((key) => getJson<Entry>(key)))).filter(Boolean) as Entry[];
  rows.sort((a, b) => (a.tss || 0) - (b.tss || 0));

  return json({ n: q.n, list: rows.map((r) => ({ f: r.f, c: r.c, s: r.s, t: r.t })) });
});

export const config = { path: "/api/board" };
