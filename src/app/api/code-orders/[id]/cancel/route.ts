import { NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentProofStore } from "@/lib/storage";

// A student cancels their own still-PENDING code-order request. A pending
// request has no side effects (no code issued, no enrollment), so it's a hard
// delete — the student can just submit a new one. The payment-proof blob is
// removed best-effort afterwards.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { id } = await params;
  const order = await db.codeOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود." }, { status: 404 });
  }
  if (order.userId !== userId) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });
  }
  if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "لا يمكن إلغاء طلب تمت مراجعته." },
      { status: 409 },
    );
  }

  await db.codeOrder.delete({ where: { id } });

  after(async () => {
    if (order.paymentProofKey && paymentProofStore) {
      await paymentProofStore
        .delete(order.paymentProofKey)
        .catch((err) => console.error("[code-orders/cancel] proof cleanup failed", err));
    }
  });

  return NextResponse.json({ ok: true });
}
