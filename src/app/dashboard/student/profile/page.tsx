import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateStreakDays } from "@/lib/gamification";
import { avatarUrl } from "@/lib/avatar";
import { InlineProfileField } from "@/components/dashboard/InlineProfileField";
import { AvatarControl } from "@/components/dashboard/AvatarControl";
import { BookOpen, CheckCircle2, Award, Flame, Mail, Phone, Calendar, ShieldCheck, Users } from "lucide-react";

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
        phone: true,
        avatarKey: true,
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
  const photoUrl = await avatarUrl(user.avatarKey);
  const guardian = [user.guardianName, user.guardianContact].filter(Boolean).join(" · ");

  const stats = [
    { icon: BookOpen, value: enrolledCount, label: "كورس مسجَّل" },
    { icon: CheckCircle2, value: completedLessons, label: "درس مكتمل" },
    { icon: Award, value: certCount, label: "شهادة" },
    { icon: Flame, value: streak, label: "يوم متتالٍ" },
  ];

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">الملف الشخصي</h1>
      <p className="mt-2 text-slate-400">بيانات حسابك ونشاطك على المنصة.</p>

      <div className="mt-8 max-w-2xl rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <AvatarControl url={photoUrl} fallbackLetter={user.name.trim().slice(0, 1).toUpperCase()} />
          <div>
            <div className="text-base font-bold">
              <InlineProfileField field="name" value={user.name} />
            </div>
            <p className="mt-0.5 text-sm text-slate-400">طالب</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs text-slate-400">البريد الإلكتروني</dt>
              <dd className="text-sm text-slate-200">{user.email}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs text-slate-400">رقم الهاتف</dt>
              <dd className="text-sm text-slate-200">
                <InlineProfileField field="phone" value={user.phone ?? ""} placeholder="01012345678" />
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs text-slate-400">تاريخ الانضمام</dt>
              <dd className="text-sm text-slate-200">{dateFmt.format(user.createdAt)}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs text-slate-400">ولي الأمر</dt>
              <dd className="text-sm text-slate-200">{guardian || "لم يُضف"}</dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <div>
              <dt className="text-xs text-slate-400">موافقة ولي الأمر</dt>
              <dd className="text-sm text-slate-200">
                {user.guardianConsentAt
                  ? `مسجّلة في ${dateFmt.format(user.guardianConsentAt)}`
                  : "غير مسجّلة"}
              </dd>
            </div>
          </div>
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
