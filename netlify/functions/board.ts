import type { Config } from "@netlify/functions";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { quizzes, responses } from "../../db/schema.js";
import { bad, json, tokenMatches, validId, safe } from "../../lib/http.js";

export default safe(async (req: Request) => {
  if (req.method !== "GET") return bad("Method not allowed", 405);
  const p = new URL(req.url).searchParams;
  const id = p.get("id"), k = p.get("k");
  if (!validId(id) || !k) return bad("Not found", 404);

  const [q] = await db.select().from(quizzes).where(eq(quizzes.id, id));
  // Same response for unknown quiz and wrong key, so links can't be probed.
  if (!q || !tokenMatches(k, q.tokenHash)) return bad("Not found", 404);

  const rows = await db
    .select({ f: responses.friendName, c: responses.character, s: responses.score, t: responses.total })
    .from(responses)
    .where(eq(responses.quizId, id))
    .orderBy(asc(responses.createdAt));
  return json({ n: q.name, list: rows });
});

export const config: Config = { path: "/api/board" };
