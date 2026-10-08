import { bad, cleanName, hashToken, json, newId, newToken, readJson, validAnswers, validChar, validId, safe } from "../../lib/http";
import { getJson, setJson } from "../../lib/blobs";

export interface Quiz {
  id: string;
  n: string;
  c: number;
  a: number[];
  th: string;
  t: number;
}

export const quizKey = (id: string) => `q:${id}`;
export const responsePrefix = (id: string) => `r:${id}:`;

export default safe(async (req: Request) => {
  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (!validId(id)) return bad("Quiz not found", 404);
    const q = await getJson<Quiz>(quizKey(id));
    if (!q) return bad("Quiz not found", 404);
    return json({ n: q.n, c: q.c, a: q.a });
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
    await setJson(quizKey(id), { id, n: name, c: body.c, a: body.a, th: hashToken(token), t: Date.now() });
    return json({ id, token }, 201);
  }

  return bad("Method not allowed", 405);
});

export const config = { path: "/api/quiz" };
