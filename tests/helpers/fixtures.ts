import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";

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
  const module = await db.module.create({
    data: { title: "Test Module", courseId, order: 1 },
  });
  const lesson = await db.lesson.create({
    data: { title: "Test Lesson", moduleId: module.id, order: 1 },
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
  return { module, lesson, quiz, question };
}

export async function enroll(userId: string, courseId: string) {
  return db.enrollment.create({ data: { userId, courseId } });
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
  await db.course.delete({ where: { id: courseId } }).catch(() => {});
}

export async function cleanupUser(userId: string) {
  await db.auditLog.deleteMany({ where: { actorId: userId } });
  await db.user.delete({ where: { id: userId } }).catch(() => {});
}
