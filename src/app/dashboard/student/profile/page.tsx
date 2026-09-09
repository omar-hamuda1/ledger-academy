import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStreakDays } from "@/lib/gamification";
import { EditProfileNameForm } from "@/components/dashboard/EditProfileNameForm";
import { BookOpen, CheckCircle2, Award, Flame, Mail, Calendar, ShieldCheck, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" });

export default async function StudentProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [user, enrolledCount, completedLessons, certCount, progressDates] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        createdAt: true,
        guardianConsentAt: true,
        guardianName: true,
        guardianContact: true,
      },
    }),
    db.enrollment.count({ where: { userId } }),
    db.lessonProgress.count({ where: { userId, completed: true } }),
    db.certificate.count({ where: { userId } }),
    db.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { updatedAt: true },
    }),
  ]);
  if (!user) redirect("/login");

  const streak = calculateStreakDays(progressDates.map((p) => p.updatedAt));
  const guardian = [user.guardianName, user.guardianContact].filter(Boolean).join(" · ");

  const stats = [
    { icon: BookOpen, value: enrolledCount, label: "كورس مسجَّل" },
    { icon: CheckCircle2, value: completedLessons, label: "درس مكتمل" },
    { icon: Award, value: certCount, label: "شهادة" },
    { icon: Flame, value: streak, label: "يوم متتالٍ" },
  ];

  const rows: { icon: typeof Mail; label: string; value: string }[] = [
    { icon: Mail, label: "البريد الإلكتروني", value: user.email },
    { icon: Calendar, label: "تاريخ الانضمام", value: dateFmt.format(user.createdAt) },
    {
      icon: Users,
      label: "ولي الأمر",
      value: guardian || "لم يُضف",
    },
    {
      icon: ShieldCheck,
      label: "موافقة ولي الأمر",
      value: user.guardianConsentAt
        ? `مسجّلة في ${dateFmt.format(user.guardianConsentAt)}`
        : "غير مسجّلة",
    },
  ];

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">الملف الشخصي</h1>
      <p className="mt-2 text-slate-400">بيانات حسابك ونشاطك على المنصة.</p>

      <div className="mt-8 max-w-2xl rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-400/10 text-2xl font-extrabold text-gold-400">
            {user.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div>
            <EditProfileNameForm initialName={user.name} />
            <p className="mt-0.5 text-sm text-slate-400">طالب</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <r.icon size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <div>
                <dt className="text-xs text-slate-400">{r.label}</dt>
                <dd className="text-sm text-slate-200">{r.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-control border border-white/10 bg-navy-900/60 p-4 text-center shadow-card"
          >
            <s.icon size={18} className="text-gold-400" />
            <p className="text-xl font-extrabold text-white">{s.value.toLocaleString("ar-EG")}</p>
            <p className="text-[11px] text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
