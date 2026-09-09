import { db } from "./db";

/**
 * Hard-delete a user and everything that points at them, in one transaction.
 *
 * Rows the user *owns* are deleted; rows where they're only referenced as an
 * actor on someone else's artifact are detached (nulled) so the artifact
 * survives without them:
 *   - kept, detached: broadcasts they composed (`Notification.createdById`),
 *     code orders they approved (`CodeOrder.reviewedById`)
 *   - deleted: enrollments, progress, quiz attempts, certificates, their
 *     reviews, their Q&A, notifications targeted at them, notification reads,
 *     prepaid codes they redeemed, code orders they requested, their audit log
 *     rows, their OTP rows
 *
 * Callers MUST guard first: not self, not a protected super-admin (unless the
 * caller is one), not the last active ADMIN, and **not an instructor who still
 * owns courses** — `Course.instructorId` is RESTRICT and this function does not
 * touch courses.
 */
export async function deleteUserCascade(user: { id: string; email: string }) {
  const userId = user.id;

  await db.$transaction(async (tx) => {
    await tx.notificationRead.deleteMany({ where: { userId } });
    await tx.lessonAnswer.deleteMany({ where: { userId } });
    await tx.lessonQuestion.deleteMany({ where: { userId } }); // cascades answers on them
    await tx.quizAttempt.deleteMany({ where: { userId } });
    await tx.lessonProgress.deleteMany({ where: { userId } });
    await tx.certificate.deleteMany({ where: { userId } });
    await tx.review.deleteMany({ where: { userId } });
    await tx.enrollment.deleteMany({ where: { userId } });
    await tx.prepaidCode.deleteMany({ where: { usedById: userId } });
    await tx.codeOrder.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { targetUserId: userId } });

    await tx.codeOrder.updateMany({
      where: { reviewedById: userId },
      data: { reviewedById: null },
    });
    await tx.notification.updateMany({
      where: { createdById: userId },
      data: { createdById: null },
    });

    await tx.auditLog.deleteMany({ where: { actorId: userId } });
    await tx.otpCode.deleteMany({ where: { email: user.email } });

    await tx.user.delete({ where: { id: userId } });
  });
}
