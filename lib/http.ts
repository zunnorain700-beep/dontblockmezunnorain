import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

// Must match the quiz in index.html: 7 questions, 4 options each, 4 characters.
export const QUESTIONS = 7;
export const OPTIONS = 4;
export const CHARACTERS = 4;

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });
export const bad = (error: string, status = 400) => json({ error }, status);

export function cleanName(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[|<>\u0000-\u001f]/g, "").trim().slice(0, 20);
}
export function validChar(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) < CHARACTERS;
}
export function validAnswers(v: unknown): v is number[] {
  return Array.isArray(v) && v.length === QUESTIONS &&
    v.every((x) => Number.isInteger(x) && x >= 0 && x < OPTIONS);
}
export const validId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{6,32}$/.test(v);

export const newId = () => randomBytes(6).toString("base64url");
export const newToken = () => randomBytes(18).toString("base64url");
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export function tokenMatches(token: string, hash: string) {
  const a = Buffer.from(hashToken(token)), b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readJson(req: Request): Promise<any> {
  const text = await req.text();
  if (text.length > 4096) throw new Error("too large");
  return JSON.parse(text);
}

// Never leak query details (which can include stored values) to the client.
export function safe(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      console.error(err);
      return bad("Something went wrong, please try again", 500);
    }
  };
}
