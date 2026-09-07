import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { POST } from "@/app/api/prepaid-codes/redeem/route";
import { db } from "@/lib/db";
import {
  createUser,
  createCourse,
  createPrepaidCode,
  enroll,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// PrepaidCode redemption is the second sanctioned enrollment-granting path
// (besides /api/checkout). These guard its security-critical behaviour:
// single-use, course-scoped, no free enrollment without a valid unused code.
describe("POST /api/prepaid-codes/redeem", () => {
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let studentA: Awaited<ReturnType<typeof createUser>>;
  let studentB: Awaited<ReturnType<typeof createUser>>;
  let courseX: Awaited<ReturnType<typeof createCourse>>;
  let courseY: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    studentA = await createUser("STUDENT");
    studentB = await createUser("STUDENT");
    courseX = await createCourse(instructor.id);
    courseY = await createCourse(instructor.id);
  });

  afterAll(async () => {
    await cleanupCourse(courseX.id);
    await cleanupCourse(courseY.id);
    await cleanupUser(studentA.id);
    await cleanupUser(studentB.id);
    await cleanupUser(instructor.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  function request(body: unknown) {
    return new Request("http://localhost/api/prepaid-codes/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function asUser(id: string) {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id } } as never);
  }

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await POST(request({ code: "WHATEVER1234" }));
    expect(res.status).toBe(401);
  });

  it("rejects a code that does not exist", async () => {
    asUser(studentA.id);
    const res = await POST(request({ code: "ZZZZ-ZZZZ-ZZZZ" }));
    expect(res.status).toBe(404);
  });

  it("redeems a valid code: enrollment created, code marked used", async () => {
    const code = await createPrepaidCode(courseX.id);
    asUser(studentA.id);

    const res = await POST(request({ code: code.code }));
    expect(res.status).toBe(200);

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: studentA.id, courseId: courseX.id } },
    });
    expect(enrollment).not.toBeNull();

    const after = await db.prepaidCode.findUnique({ where: { id: code.id } });
    expect(after?.isUsed).toBe(true);
    expect(after?.usedById).toBe(studentA.id);
    expect(after?.usedAt).not.toBeNull();
  });

  it("rejects reuse of an already-used code and grants nothing", async () => {
    const code = await createPrepaidCode(courseX.id);
    asUser(studentA.id);
    await POST(request({ code: code.code })); // studentA already enrolled in X → 409

    asUser(studentB.id);
    const first = await POST(request({ code: code.code }));
    expect(first.status).toBe(200);

    const second = await POST(request({ code: code.code }));
    expect(second.status).toBe(409);

    const stillOne = await db.prepaidCode.findUnique({ where: { id: code.id } });
    expect(stillOne?.usedById).toBe(studentB.id);
  });

  it("rejects a code whose course does not match the supplied courseId, leaving it unused", async () => {
    const code = await createPrepaidCode(courseX.id);
    asUser(studentB.id);

    const res = await POST(request({ code: code.code, courseId: courseY.id }));
    expect(res.status).toBe(400);

    const untouched = await db.prepaidCode.findUnique({ where: { id: code.id } });
    expect(untouched?.isUsed).toBe(false);
  });

  it("does not consume a code when the student is already enrolled", async () => {
    const freshStudent = await createUser("STUDENT");
    await enroll(freshStudent.id, courseY.id);
    const code = await createPrepaidCode(courseY.id);
    asUser(freshStudent.id);

    const res = await POST(request({ code: code.code }));
    expect(res.status).toBe(409);

    const untouched = await db.prepaidCode.findUnique({ where: { id: code.id } });
    expect(untouched?.isUsed).toBe(false);

    await cleanupUser(freshStudent.id);
  });
});
