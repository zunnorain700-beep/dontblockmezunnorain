import { bad, cleanName, json, readJson, validAnswers, validChar, validId, safe } from "../../lib/http";
import { getJson, setJson } from "../../lib/blobs";
import { quizKey, responsePrefix, type Quiz } from "./quiz";

export default safe(async (req: Request) => {
  if (req.method !== "POST") return bad("Method not allowed", 405);
  let body;
  try { body = await readJson(req); } catch { return bad("Invalid request"); }
  if (!validId(body?.id)) return bad("Quiz not found", 404);
  const friend = cleanName(body.f);
  if (!friend) return bad("Name is required");
  if (!validChar(body.c)) return bad("Invalid character");
  if (!validAnswers(body.g)) return bad("Invalid answers");

  const q = await getJson<Quiz>(quizKey(body.id));
  if (!q) return bad("Quiz not found", 404);

  // Score on the server so a friend can't submit a fake score.
  const score = body.g.reduce((s: number, g: number, i: number) => s + (g === q.a[i] ? 1 : 0), 0);
  const now = Date.now();
  const key = `${responsePrefix(q.id)}${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await setJson(key, { f: friend, c: body.c, s: score, t: q.a.length, tss: now });
  return json({ ok: true, s: score, t: q.a.length }, 201);
});

export const config = { path: "/api/answer" };
