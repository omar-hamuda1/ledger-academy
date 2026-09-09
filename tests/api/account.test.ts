import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { PATCH } from "@/app/api/account/route";
import { createUser, cleanupUser } from "../helpers/fixtures";

// PATCH /api/account — a signed-in user edits their own display name.
describe("PATCH /api/account", () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    user = await createUser("STUDENT");
  });
  afterAll(async () => {
    await cleanupUser(user.id);
  });

  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: user.id } } as never);
  });

  const call = (body: unknown) =>
    PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

  it("401 when not signed in", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    expect((await call({ name: "اسم" })).status).toBe(401);
  });

  it("rejects a junk name (400)", async () => {
    expect((await call({ name: "Ali123" })).status).toBe(400);
    expect((await call({ name: "x" })).status).toBe(400);
  });

  it("updates and normalizes the caller's own name", async () => {
    const res = await call({ name: "  محمد   حسين  " });
    expect(res.status).toBe(200);
    expect((await res.json()).user.name).toBe("محمد حسين");
    expect((await db.user.findUnique({ where: { id: user.id } }))!.name).toBe("محمد حسين");
  });
});
