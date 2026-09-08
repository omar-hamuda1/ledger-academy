import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

// Crockford-ish: no 0/O/1/I/L, so a serial is safe to read aloud or retype.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** e.g. "LA-7F3K9-Q2MHT" — 10 random chars, ~50 bits. */
export function generateSerial(): string {
  const bytes = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `LA-${s.slice(0, 5)}-${s.slice(5)}`;
}

/**
 * True when the student has completed every lesson in the course. A course
 * with no lessons can't be "completed".
 */
export async function isCourseComplete(userId: string, courseId: string): Promise<boolean> {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    select: { id: true },
  });
  if (lessons.length === 0) return false;

  const done = await db.lessonProgress.count({
    where: { userId, completed: true, lessonId: { in: lessons.map((l) => l.id) } },
  });
  return done === lessons.length;
}
