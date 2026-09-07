import { db } from "./db";

/**
 * Creates in-app notifications. Deliberately best-effort — a notification
 * failure must never break the action that triggered it (mirrors
 * `src/lib/audit.ts`). Accepts one recipient or many.
 */
export async function notify(params: {
  userId: string | string[];
  title: string;
  body: string;
  href?: string;
}) {
  const userIds = Array.isArray(params.userId) ? params.userId : [params.userId];
  if (userIds.length === 0) return;
  try {
    await db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: params.title,
        body: params.body,
        href: params.href,
      })),
    });
  } catch (error) {
    console.error("[notify] failed to write notification(s)", error);
  }
}
