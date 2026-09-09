import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { displayNameError, normalizeName } from "@/lib/validators/name";
import { phoneError, normalizePhone } from "@/lib/validators/phone";

const schema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    phone: z.string().min(1).max(30).optional(),
  })
  .refine((d) => d.name !== undefined || d.phone !== undefined, {
    message: "لا يوجد ما يُحدَّث.",
  });

// A signed-in user edits their OWN account — display name and/or phone. This is
// NOT /api/users/[id] (admin-only, refuses self-edit).
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

  const data: { name?: string; phone?: string } = {};

  if (parsed.data.name !== undefined) {
    const err = displayNameError(parsed.data.name);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    data.name = normalizeName(parsed.data.name);
  }
  if (parsed.data.phone !== undefined) {
    const err = phoneError(parsed.data.phone);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    data.phone = normalizePhone(parsed.data.phone);
  }

  const user = await db.user.update({
    where: { id: userId },
    data,
    select: { name: true, phone: true },
  });

  return NextResponse.json({ user });
}
