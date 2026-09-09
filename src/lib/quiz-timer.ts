import { createHmac, timingSafeEqual } from "node:crypto";

// Grace on top of the quiz's time limit before the server rejects a submission:
// page-load + hydration lag (the client only starts its countdown after mount)
// plus the round-trip of the client's own auto-submit at zero.
const GRACE_SEC = 30;

function secret() {
  // NEXTAUTH_SECRET is always set in every real environment; the fallback only
  // keeps unit imports from throwing.
  return process.env.NEXTAUTH_SECRET ?? "insecure-quiz-timer-fallback";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/**
 * Opaque token that proves *when* this user opened this quiz. Stateless (HMAC
 * over `quizId.userId.timestamp`), so a page refresh mints a fresh one — that's
 * acceptable: quiz attempts are unlimited and this is exam-pressure UX, not
 * anti-cheat. What it does close: leaving the tab open, editing the client
 * countdown, or submitting with JS disabled.
 */
export function signQuizStart(quizId: string, userId: string, now: number = Date.now()): string {
  const payload = `${quizId}.${userId}.${now}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifyQuizStart(
  token: string,
  quizId: string,
  userId: string,
): { startedAt: number } | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const encoded = token.slice(0, dot);
  const givenSig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const a = Buffer.from(givenSig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [q, u, t] = payload.split(".");
  const startedAt = Number(t);
  if (q !== quizId || u !== userId || !Number.isFinite(startedAt)) return null;

  return { startedAt };
}

/** True when a submission for a timed quiz has come in too late to count. */
export function isQuizStartExpired(
  startedAt: number,
  timeLimitSec: number,
  now: number = Date.now(),
): boolean {
  return (now - startedAt) / 1000 > timeLimitSec + GRACE_SEC;
}
