import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { POST } from "@/app/api/code-orders/[id]/cancel/route";
import {
  createUser,
  createCourse,
  createCodeOrder,
  cleanupCourse,
  cleanupUser,
} from "../helpers/fixtures";

// POST /api/code-orders/[id]/cancel — a student drops their own still-PENDING
// request (added 2026-09-07). Hard delete; a reviewed request can't be cancelled.
describe("POST /api/code-orders/[id]/cancel", () => {
  let owner: Awaited<ReturnType<typeof createUser>>;
  let other: Awaited<ReturnType<typeof createUser>>;
  let instructor: Awaited<ReturnType<typeof createUser>>;
  let course: Awaited<ReturnType<typeof createCourse>>;

  beforeAll(async () => {
    owner = await createUser("STUDENT");
    other = await createUser("STUDENT");
    instructor = await createUser("ADMIN");
    course = await createCourse(instructor.id);
  });

  afterAll(async () => {
    await cleanupCourse(course.id);
    await cleanupUser(owner.id);
    await cleanupUser(other.id);
    await cleanupUser(instructor.id);
  });

  beforeEach(() => vi.mocked(getServerSession).mockReset());

  const call = (id: string) =>
    POST(new Request("http://localhost", { method: "POST" }), {
      params: Promise.resolve({ id }),
    });

  it("lets the owner cancel a PENDING request (row deleted)", async () => {
    const order = await createCodeOrder(owner.id, course.id);
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: owner.id, role: "STUDENT" } } as never);
    const res = await call(order.id);
    expect(res.status).toBe(200);
    expect(await db.codeOrder.findUnique({ where: { id: order.id } })).toBeNull();
  });

  it("401 when unauthenticated, order untouched", async () => {
    const order = await createCodeOrder(owner.id, course.id);
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    expect((await call(order.id)).status).toBe(401);
    expect(await db.codeOrder.findUnique({ where: { id: order.id } })).not.toBeNull();
    await db.codeOrder.delete({ where: { id: order.id } });
  });

  it("403 when it's someone else's request", async () => {
    const order = await createCodeOrder(owner.id, course.id);
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: other.id, role: "STUDENT" } } as never);
    expect((await call(order.id)).status).toBe(403);
    expect(await db.codeOrder.findUnique({ where: { id: order.id } })).not.toBeNull();
    await db.codeOrder.delete({ where: { id: order.id } });
  });

  it("409 when the request was already reviewed", async () => {
    const order = await createCodeOrder(owner.id, course.id);
    await db.codeOrder.update({ where: { id: order.id }, data: { status: "REJECTED" } });
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: owner.id, role: "STUDENT" } } as never);
    expect((await call(order.id)).status).toBe(409);
    expect(await db.codeOrder.findUnique({ where: { id: order.id } })).not.toBeNull();
    await db.codeOrder.delete({ where: { id: order.id } });
  });
});
