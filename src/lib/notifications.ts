import type { Prisma } from "@prisma/client";

/**
 * Prisma `where` for the notifications a given user should see: their own
 * targeted ones, plus every broadcast (`targetUserId` null) if they're a
 * student. Read state is checked separately via the `reads` relation.
 */
export function visibleNotificationsWhere(
  userId: string,
  role: string,
): Prisma.NotificationWhereInput {
  const or: Prisma.NotificationWhereInput[] = [{ targetUserId: userId }];
  if (role === "STUDENT") or.push({ targetUserId: null });
  return { OR: or };
}
