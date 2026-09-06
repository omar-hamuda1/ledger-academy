import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { MIN_EGP_PRICE } from "@/lib/pricing";
import { z } from "zod";
import Stripe from "stripe";

const checkoutSchema = z.object({ courseId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة." }, { status: 400 });
  }

  const course = await db.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course) return NextResponse.json({ error: "الكورس غير موجود." }, { status: 404 });

  const price = Number(course.price);

  if (price <= 0) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {},
      create: { userId, courseId: course.id },
    });
    return NextResponse.json({ free: true });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "الدفع غير مفعّل حاليًا على هذه المنصة." },
      { status: 503 }
    );
  }

  if (price < MIN_EGP_PRICE) {
    return NextResponse.json(
      {
        error: `سعر هذا الكورس (${price} ج.م) أقل من الحد الأدنى المسموح به لإتمام الدفع. يرجى رفع السعر إلى ${MIN_EGP_PRICE} ج.م على الأقل من لوحة تحكم المحاضر.`,
      },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    // Idempotency key is bucketed to the current minute: a rapid double-click
    // (or a retried request from a flaky connection) within that window reuses
    // the same Checkout Session instead of creating a second payable one, while
    // a genuine retry a few minutes later still gets a fresh session.
    const idempotencyKey = `checkout:${userId}:${course.id}:${Math.floor(Date.now() / 60_000)}`;

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: session.user.email ?? undefined,
        line_items: [
          {
            price_data: {
              currency: "egp",
              unit_amount: Math.round(price * 100),
              product_data: { name: course.title },
            },
            quantity: 1,
          },
        ],
        metadata: { userId, courseId: course.id },
        success_url: `${baseUrl}/courses/${course.slug}?checkout=success`,
        cancel_url: `${baseUrl}/courses/${course.slug}?checkout=cancelled`,
      },
      { idempotencyKey }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    const message =
      error instanceof Stripe.errors.StripeError
        ? `تعذّر إنشاء عملية الدفع: ${error.message}`
        : "تعذّر إنشاء عملية الدفع، حاول مرة أخرى.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
