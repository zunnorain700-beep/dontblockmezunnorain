import type { Config } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { quizzes } from "../../db/schema.js";
import { bad, cleanName, hashToken, json, newId, newToken, readJson, validAnswers, validChar, validId, safe } from "../../lib/http.js";

export default safe(async (req: Request) => {
  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (!validId(id)) return bad("Quiz not found", 404);
    const [q] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    if (!q) return bad("Quiz not found", 404);
    return json({ n: q.name, c: q.character, a: q.answers });
  }

  if (req.method === "POST") {
    let body;
    try { body = await readJson(req); } catch { return bad("Invalid request"); }
    const name = cleanName(body?.n);
    if (!name) return bad("Name is required");
    if (!validChar(body.c)) return bad("Invalid character");
    if (!validAnswers(body.a)) return bad("Invalid answers");

    const token = newToken();
    const id = newId();
    await db.insert(quizzes).values({ id, name, character: body.c, answers: body.a, tokenHash: hashToken(token) });
    return json({ id, token }, 201);
  }

  return bad("Method not allowed", 405);
});

export const config: Config = { path: "/api/quiz" };
