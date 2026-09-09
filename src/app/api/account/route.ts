import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { displayNameError, normalizeName } from "@/lib/validators/name";

const schema = z.object({ name: z.string().min(1).max(200) });

// A signed-in user edits their OWN account. Currently just the display name.
// This is NOT /api/users/[id] (admin-only, refuses self-edit).
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const nameError = displayNameError(parsed.data.name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { name: normalizeName(parsed.data.name) },
    select: { name: true },
  });

  return NextResponse.json({ user });
}
