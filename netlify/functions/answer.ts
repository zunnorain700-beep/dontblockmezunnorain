import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { quizzes, responses } from "../../db/schema.js";
import { bad, cleanName, json, readJson, validAnswers, validChar, validId, safe } from "../../lib/http.js";

export default safe(async (req: Request) => {
  if (req.method !== "POST") return bad("Method not allowed", 405);
  let body;
  try { body = await readJson(req); } catch { return bad("Invalid request"); }
  if (!validId(body?.id)) return bad("Quiz not found", 404);
  const friend = cleanName(body.f);
  if (!friend) return bad("Name is required");
  if (!validChar(body.c)) return bad("Invalid character");
  if (!validAnswers(body.g)) return bad("Invalid answers");

  const [q] = await db.select({ answers: quizzes.answers }).from(quizzes).where(eq(quizzes.id, body.id));
  if (!q) return bad("Quiz not found", 404);

  // Score on the server so a friend can't submit a fake score.
  const score = body.g.reduce((s: number, g: number, i: number) => s + (g === q.answers[i] ? 1 : 0), 0);
  await db.insert(responses).values({
    quizId: body.id, friendName: friend, character: body.c, guesses: body.g, score, total: q.answers.length,
  });
  return json({ ok: true, s: score, t: q.answers.length }, 201);
});

export const config: Config = { path: "/api/answer" };
