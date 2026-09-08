import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldX } from "lucide-react";
import { db } from "@/lib/db";
import { PrintButton } from "@/components/certificate/PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "شهادة إتمام | Ledger Academy",
  robots: { index: false, follow: false },
};

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" });

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  const cert = await db.certificate.findUnique({
    where: { serial },
    include: {
      user: { select: { name: true } },
      course: {
        select: { title: true, instructor: { select: { name: true } } },
      },
    },
  });

  if (!cert) {
    return (
      <main
        dir="rtl"
        lang="ar"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 p-6 text-center text-slate-100"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <ShieldX size={26} />
        </span>
        <h1 className="text-2xl font-extrabold text-white">شهادة غير صالحة</h1>
        <p className="max-w-sm text-slate-400">
          لا توجد شهادة بهذا الرقم. تأكّد من نسخ الرقم كاملًا كما يظهر على الشهادة.
        </p>
        <Link href="/" className="mt-2 text-sm font-semibold text-gold-400 underline">
          الصفحة الرئيسية
        </Link>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      lang="ar"
      className="flex min-h-screen flex-col items-center gap-6 bg-navy-950 p-6 py-12 text-slate-100 print:bg-white print:p-0 print:py-0"
    >
      <article className="w-full max-w-3xl rounded-card border-4 border-gold-400/70 bg-navy-900 p-10 text-center shadow-elevated print:border-gold-400 print:bg-white print:text-navy-950 print:shadow-none">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-400">
          Ledger Academy
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-white print:text-navy-950">
          شهادة إتمام
        </h1>

        <p className="mt-8 text-slate-300 print:text-navy-950">
          تشهد منصة Ledger Academy بأن
        </p>
        <p className="mt-2 text-4xl font-extrabold text-gold-400">{cert.user.name}</p>

        <p className="mt-6 text-slate-300 print:text-navy-950">
          قد أتمّ بنجاح جميع متطلبات كورس
        </p>
        <p className="mt-2 text-2xl font-bold text-white print:text-navy-950">
          «{cert.course.title}»
        </p>

        <p className="mt-6 text-sm text-slate-400 print:text-navy-950">
          بتاريخ {dateFmt.format(cert.issuedAt)}
        </p>

        <div className="mt-10 flex items-end justify-between gap-6 border-t border-white/10 pt-6 text-right print:border-navy-950/20">
          <div>
            <p className="text-lg font-bold text-white print:text-navy-950">
              {cert.course.instructor.name}
            </p>
            <p className="text-xs text-slate-400 print:text-navy-950">المحاضر</p>
          </div>
          <div className="text-left">
            <p className="font-mono text-xs text-slate-400 print:text-navy-950" dir="ltr">
              {cert.serial}
            </p>
            <p className="text-[10px] text-slate-500 print:text-navy-950" dir="ltr">
              verify at /certificates/{cert.serial}
            </p>
          </div>
        </div>
      </article>

      <div className="flex items-center gap-2 text-sm text-emerald-400 print:hidden">
        <ShieldCheck size={16} />
        شهادة موثّقة وصادرة عن Ledger Academy
      </div>
      <PrintButton />
    </main>
  );
}
