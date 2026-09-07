import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { POST as createOrder } from "@/app/api/code-orders/route";
import { PATCH as reviewOrder } from "@/app/api/code-orders/[id]/route";
import { db } from "@/lib/db";
import {
  createUser,
  createCourse,
  createCodeOrder,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// CodeOrder approval is a sanctioned enrollment-granting path: approving must
// issue a used PrepaidCode for the requester AND create the Enrollment, in one
// transaction; rejection grants nothing; a reviewed order can't be re-reviewed.
describe("code orders", () => {
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let student: Awaited<ReturnType<typeof createUser>>;
  let paidCourse: Awaited<ReturnType<typeof createCourse>>;
  let freeCourse: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    instructor = await createUser("ADMIN");
    student = await createUser("STUDENT");
    paidCourse = await createCourse(instructor.id, 200);
    freeCourse = await createCourse(instructor.id, 0);
  });

  afterAll(async () => {
    await cleanupCourse(paidCourse.id);
    await cleanupCourse(freeCourse.id);
    await cleanupUser(student.id);
    await cleanupUser(instructor.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  function createReq(body: unknown) {
    return new Request("http://localhost/api/code-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  function reviewReq(body: unknown) {
    return new Request("http://localhost/api/code-orders/x", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  const asUser = (id: string) =>
    vi.mocked(getServerSession).mockResolvedValue({ user: { id } } as never);
  const asAdmin = () =>
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: instructor.id, role: "ADMIN", email: instructor.email },
    } as never);

  it("rejects an order request for a free course", async () => {
    asUser(student.id);
    const res = await createOrder(
      createReq({ courseId: freeCourse.id, studentPhone: "01000000000", paymentNote: "n/a" }),
    );
    expect(res.status).toBe(400);
  });

  it("creates a pending order and dedupes a second request", async () => {
    asUser(student.id);
    const first = await createOrder(
      createReq({ courseId: paidCourse.id, studentPhone: "01234567890", paymentNote: "VC #111" }),
    );
    expect(first.status).toBe(201);

    const second = await createOrder(
      createReq({ courseId: paidCourse.id, studentPhone: "01234567890", paymentNote: "VC #111" }),
    );
    const data = await second.json();
    expect(data.alreadyPending).toBe(true);

    const count = await db.codeOrder.count({
      where: { userId: student.id, courseId: paidCourse.id, status: "PENDING" },
    });
    expect(count).toBe(1);
  });

  it("non-admin cannot review an order", async () => {
    const order = await createCodeOrder(student.id, paidCourse.id);
    asUser(student.id);
    const res = await reviewOrder(reviewReq({ action: "approve" }), {
      params: Promise.resolve({ id: order.id }),
    });
    expect(res.status).toBe(403);
    await db.codeOrder.delete({ where: { id: order.id } });
  });

  it("approve issues a used code + enrollment, and can't be re-reviewed", async () => {
    const buyer = await createUser("STUDENT");
    const order = await createCodeOrder(buyer.id, paidCourse.id);

    asAdmin();
    const res = await reviewOrder(reviewReq({ action: "approve" }), {
      params: Promise.resolve({ id: order.id }),
    });
    expect(res.status).toBe(200);

    const updated = await db.codeOrder.findUnique({
      where: { id: order.id },
      include: { prepaidCode: true },
    });
    expect(updated?.status).toBe("APPROVED");
    expect(updated?.prepaidCode?.isUsed).toBe(true);
    expect(updated?.prepaidCode?.usedById).toBe(buyer.id);

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: buyer.id, courseId: paidCourse.id } },
    });
    expect(enrollment).not.toBeNull();

    const again = await reviewOrder(reviewReq({ action: "approve" }), {
      params: Promise.resolve({ id: order.id }),
    });
    expect(again.status).toBe(409);

    await cleanupUser(buyer.id);
  });

  it("reject sets status + reason and grants nothing", async () => {
    const buyer = await createUser("STUDENT");
    const order = await createCodeOrder(buyer.id, paidCourse.id);

    asAdmin();
    const res = await reviewOrder(
      reviewReq({ action: "reject", rejectionReason: "لم يصلنا التحويل" }),
      { params: Promise.resolve({ id: order.id }) },
    );
    expect(res.status).toBe(200);

    const updated = await db.codeOrder.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe("REJECTED");
    expect(updated?.rejectionReason).toBe("لم يصلنا التحويل");

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: buyer.id, courseId: paidCourse.id } },
    });
    expect(enrollment).toBeNull();

    await cleanupUser(buyer.id);
  });
});
