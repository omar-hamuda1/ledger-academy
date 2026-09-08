import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { generateCode } from "@/lib/prepaid-codes";

export async function createUser(role: "ADMIN" | "STUDENT" = "STUDENT") {
  return db.user.create({
    data: {
      name: "Test User",
      email: `test-${randomUUID()}@example.com`,
      passwordHash: "x",
      role,
    },
  });
}

export async function createCourse(instructorId: string, price = 100) {
  return db.course.create({
    data: {
      title: "Test Course",
      slug: `test-course-${randomUUID()}`,
      description: "test course for automated tests",
      price,
      isPublished: true,
      instructorId,
    },
  });
}

export async function createLessonWithQuiz(courseId: string) {
  const createdModule = await db.module.create({
    data: { title: "Test Module", courseId, order: 1 },
  });
  const lesson = await db.lesson.create({
    data: { title: "Test Lesson", moduleId: createdModule.id, order: 1 },
  });
  const quiz = await db.quiz.create({ data: { lessonId: lesson.id } });
  const question = await db.question.create({
    data: {
      quizId: quiz.id,
      text: "2 + 2 = ?",
      options: [
        { id: "a", text: "3" },
        { id: "b", text: "4" },
      ],
      correctId: "b",
    },
  });
  return { module: createdModule, lesson, quiz, question };
}

export async function enroll(userId: string, courseId: string) {
  return db.enrollment.create({ data: { userId, courseId } });
}

export async function createPrepaidCode(courseId: string, code?: string) {
  return db.prepaidCode.create({
    data: { courseId, code: code ?? generateCode() },
  });
}

export async function createCodeOrder(userId: string, courseId: string) {
  return db.codeOrder.create({
    data: {
      userId,
      courseId,
      studentPhone: "01000000000",
      // @unique — random 12-digit, mirrors an InstaPay reference.
      paymentReference: String(Math.floor(1e11 + Math.random() * 9e11)),
      paymentNote: "Vodafone Cash #test",
      paymentProofKey: `proofs/${userId}/${randomUUID()}.jpg`,
    },
  });
}

export async function cleanupCourse(courseId: string) {
  const modules = await db.module.findMany({
    where: { courseId },
    include: { lessons: { include: { quiz: true } } },
  });
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      if (lesson.quiz) {
        await db.quizAttempt.deleteMany({ where: { quizId: lesson.quiz.id } });
        await db.question.deleteMany({ where: { quizId: lesson.quiz.id } });
        await db.quiz.delete({ where: { id: lesson.quiz.id } }).catch(() => {});
      }
      await db.lessonProgress.deleteMany({ where: { lessonId: lesson.id } });
    }
    await db.lesson.deleteMany({ where: { moduleId: mod.id } });
  }
  await db.module.deleteMany({ where: { courseId } });
  await db.enrollment.deleteMany({ where: { courseId } });
  await db.codeOrder.deleteMany({ where: { courseId } });
  await db.prepaidCode.deleteMany({ where: { courseId } });
  await db.course.delete({ where: { id: courseId } }).catch(() => {});
}

export async function cleanupUser(userId: string) {
  await db.auditLog.deleteMany({ where: { actorId: userId } });
  await db.notificationRead.deleteMany({ where: { userId } });
  await db.notification.deleteMany({
    where: { OR: [{ targetUserId: userId }, { createdById: userId }] },
  });
  await db.codeOrder.deleteMany({
    where: { OR: [{ userId }, { reviewedById: userId }] },
  });
  await db.certificate.deleteMany({ where: { userId } });
  await db.review.deleteMany({ where: { userId } });
  await db.user.delete({ where: { id: userId } }).catch(() => {});
}
