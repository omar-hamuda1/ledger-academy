import { db } from "./db";

/**
 * Hard-delete a course and everything under it, in one transaction.
 *
 * Most children cascade at the DB level from `Course` / `Module` / `Lesson`
 * (`onDelete: Cascade` in the schema) — modules, lessons, resources, lesson
 * Q&A, reviews, certificates. This function only has to clear the relations
 * that are `RESTRICT` (Prisma's default for a required relation), plus order
 * two cascades that would otherwise deadlock:
 *   - `Enrollment`, `LessonProgress`, `Quiz`, `QuizAttempt` → RESTRICT, deleted
 *     here explicitly (deepest first). `Question` cascades from `Quiz`.
 *   - `CodeOrder` is deleted before `PrepaidCode`: `CodeOrder.prepaidCodeId` is
 *     a RESTRICT FK, so letting both cascade from `Course` in one statement can
 *     hit the constraint depending on row order.
 *
 * Not touched: payment-proof blobs for the deleted code orders (orphaned in
 * the bucket — same as `deleteUserCascade`), and notifications whose `href`
 * pointed at the course (they become dead links).
 */
export async function deleteCourseCascade(courseId: string) {
  const underCourse = { lesson: { module: { courseId } } };

  await db.$transaction(async (tx) => {
    await tx.quizAttempt.deleteMany({ where: { quiz: underCourse } });
    await tx.quiz.deleteMany({ where: underCourse }); // cascades Question
    await tx.lessonProgress.deleteMany({ where: underCourse });
    await tx.enrollment.deleteMany({ where: { courseId } });
    await tx.codeOrder.deleteMany({ where: { courseId } }); // before prepaidCode (RESTRICT FK)
    await tx.prepaidCode.deleteMany({ where: { courseId } });
    await tx.certificate.deleteMany({ where: { courseId } });
    await tx.review.deleteMany({ where: { courseId } });
    // cascades modules -> lessons -> resources + lesson Q&A
    await tx.course.delete({ where: { id: courseId } });
  });
}
