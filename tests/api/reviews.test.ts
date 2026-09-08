import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST as upsertReview } from "@/app/api/reviews/route";
import { PATCH as moderate, DELETE as removeReview } from "@/app/api/reviews/[id]/route";
import { courseRating } from "@/lib/reviews";
import {
  createUser,
  createCourse,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

describe("course reviews", () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    admin = await createUser("ADMIN");
    student = await createUser("STUDENT");
    course = await createCourse(admin.id, 100);
    await enroll(student.id, course.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(student.id);
    await cleanupUser(admin.id);
  });

  beforeEach(() => vi.mocked(getServerSession).mockReset());
  const as = (id: string) =>
    vi.mocked(getServerSession).mockResolvedValue({ user: { id, role: id === admin.id ? "ADMIN" : "STUDENT" } } as never);

  const post = (b: unknown) =>
    upsertReview(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }));
  const patch = (id: string, b: unknown) =>
    moderate(new Request("http://localhost", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }), { params: Promise.resolve({ id }) });
  const del = (id: string) =>
    removeReview(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ id }) });

  it("rejects a non-enrolled reviewer", async () => {
    const outsider = await createUser("STUDENT");
    as(outsider.id);
    expect((await post({ courseId: course.id, rating: 5 })).status).toBe(403);
    await cleanupUser(outsider.id);
  });

  it("rejects an out-of-range rating", async () => {
    as(student.id);
    expect((await post({ courseId: course.id, rating: 6 })).status).toBe(400);
    expect((await post({ courseId: course.id, rating: 0 })).status).toBe(400);
  });

  it("creates then edits (upsert), and feeds the average", async () => {
    as(student.id);
    const r1 = await post({ courseId: course.id, rating: 4, body: "جيد" });
    expect(r1.status).toBe(200);

    let rating = await courseRating(course.id);
    expect(rating).toEqual({ avg: 4, count: 1 });

    const r2 = await post({ courseId: course.id, rating: 2, body: "غيّرت رأيي" });
    expect(r2.status).toBe(200);
    rating = await courseRating(course.id);
    expect(rating).toEqual({ avg: 2, count: 1 }); // still one row

    expect(await db.review.count({ where: { courseId: course.id } })).toBe(1);
  });

  it("hidden reviews drop out of the average; admin can hide + delete", async () => {
    const review = await db.review.findUniqueOrThrow({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
    });

    as(admin.id);
    expect((await patch(review.id, { hidden: true })).status).toBe(200);
    expect(await courseRating(course.id)).toEqual({ avg: 0, count: 0 });

    expect((await del(review.id)).status).toBe(200);
    expect(await db.review.count({ where: { courseId: course.id } })).toBe(0);
  });
});
