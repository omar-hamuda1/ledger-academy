import { Cairo } from "next/font/google";
import {
  Users,
  Target,
  Award,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  PlayCircle,
  Star,
  Mail,
  Phone,
  MessageCircle,
  User,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { AnimatedCounter } from "@/components/ledger-academy/AnimatedCounter";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";
import { CourseCard } from "@/components/ledger-academy/CourseCard";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const revalidate = 300;

const credentials = [
  "خبرة تمتد لسنوات في تبسيط مادة إدارة الأعمال لطلاب الثانوية العامة",
  "صانع محتوى تعليمي متخصص بأسلوب عصري وتفاعلي",
  "متابعة مستمرة لمستجدات المنهج وأنماط الأسئلة",
];

export default async function LandingPage() {
  const [courses, settings] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
      },
    }),
    getSiteSettings(),
  ]);

  const stats = [
    { icon: Users, target: settings.studentsCount, suffix: "+", label: "طالب مستفيد" },
    { icon: BookOpen, target: courses.length, suffix: "", label: "مستويات دراسية كاملة" },
    { icon: Target, target: 100, suffix: "+", label: "تقييم واختبار تفاعلي" },
    { icon: Award, target: settings.satisfactionRate, suffix: "%", label: "نسبة رضا الطلاب" },
  ];

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} min-h-screen bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.15),transparent_40%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="mb-4 inline-block rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1 text-xs font-semibold text-gold-300">
              منصة متخصصة لطلاب الثانوية العامة
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              تفوّق في <span className="text-gold-400">إدارة الأعمال</span>
              <br />
              وابنِ أساس مستقبلك المهني
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              منصة تعليمية متخصصة تبسّط مادة إدارة الأعمال لطلاب الثانوية العامة
              بأسلوب عصري وتفاعلي، على يد الخبير التعليمي محمد حسين.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#courses"
                className="flex items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
              >
                ابدأ رحلتك الآن
                <ArrowLeft size={18} />
              </a>
              <a
                href="#courses"
                className="flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
              >
                <PlayCircle size={18} />
                تصفح المحتوى
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-gold-400/20 via-blue-500/10 to-transparent blur-2xl" />
            <div className="relative flex aspect-[4/5] flex-col items-center justify-end overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800 to-navy-900 p-6">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold-400/30 bg-slate-700">
                <User size={56} className="text-slate-300" />
              </div>
              <p className="mt-4 text-lg font-bold text-white">محمد حسين</p>
              <p className="text-sm text-gold-300">خبير إدارة الأعمال</p>
              <div className="mt-4 flex items-center gap-1 pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-gold-400 text-gold-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-navy-900/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-gold-400">
                <stat.icon size={22} />
              </span>
              <p className="text-2xl font-extrabold text-white sm:text-3xl">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-blue-400">الكورسات</span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            اختر مستواك الدراسي وابدأ التعلّم
          </h2>
          <p className="mt-4 text-slate-400">
            محتوى تعليمي متكامل لكل صف من صفوف المرحلة الثانوية في مادة إدارة الأعمال.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {courses.map((course) => {
            const highlights = course.modules
              .flatMap((module) => module.lessons)
              .slice(0, 3)
              .map((lesson) => lesson.title);

            return <CourseCard key={course.id} course={course} highlights={highlights} />;
          })}
        </div>
      </section>

      {/* About the presenter */}
      <section id="about" className="border-t border-white/10 bg-navy-900/40">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-2">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-gold-400/10 to-transparent blur-2xl" />
            <div className="relative flex aspect-square items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-b from-slate-800 to-navy-900">
              <User size={96} className="text-slate-400" />
            </div>
          </div>

          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-blue-400">عن المحاضر</span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">محمد حسين</h2>
            <p className="mt-2 font-semibold text-gold-400">
              خبير إدارة الأعمال وصانع محتوى تعليمي
            </p>
            <p className="mt-6 leading-relaxed text-slate-300">
              محاضر متخصص في تبسيط مادة إدارة الأعمال لطلاب المرحلة الثانوية، يجمع بين
              الخبرة العملية وأسلوب الشرح العصري لمساعدة الطلاب على الفهم العميق
              والتفوق في الامتحانات.
            </p>

            <ul className="mt-6 space-y-3">
              {credentials.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-24 text-center">
        <MessageCircle className="mx-auto mb-4 text-gold-400" size={36} />
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">تواصل معنا</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          لديك استفسار عن الكورسات أو تحتاج مساعدة؟ فريقنا جاهز للرد عليك.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`mailto:${settings.contactEmail}`}
            className="flex items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
          >
            <Mail size={18} />
            راسلنا عبر البريد
          </a>
          <a
            href={`tel:${settings.contactPhone}`}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
          >
            <Phone size={18} />
            اتصل بنا
          </a>
        </div>
      </section>

      <LedgerFooter />
    </div>
  );
}
