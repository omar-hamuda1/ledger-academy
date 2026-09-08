import type { Prisma } from "@prisma/client";

/**
 * Prisma `where` for the notifications a given user should see:
 *  - their own targeted ones (any age), plus
 *  - if they're a student, broadcasts (`targetUserId` null):
 *      · `ALL_STUDENTS`     — always
 *      · `CURRENT_STUDENTS` — only if it was sent at/after they registered,
 *                             so a new signup doesn't inherit the backlog.
 *
 * Read state is checked separately via the `reads` relation.
 */
export function visibleNotificationsWhere(
  userId: string,
  role: string,
  userCreatedAt: Date,
): Prisma.NotificationWhereInput {
  const or: Prisma.NotificationWhereInput[] = [{ targetUserId: userId }];
  if (role === "STUDENT") {
    or.push({ targetUserId: null, audience: "ALL_STUDENTS" });
    or.push({
      targetUserId: null,
      audience: "CURRENT_STUDENTS",
      createdAt: { gte: userCreatedAt },
    });
  }
  return { OR: or };
}
