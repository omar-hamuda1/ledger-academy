import { Cairo } from "next/font/google";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowLeft,
  PlayCircle,
  Play,
  Mail,
  Phone,
  User,
  Sparkles,
  MessagesSquare,
  ClipboardCheck,
  LayoutGrid,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { courseMeta } from "@/lib/course-meta";
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

const valueProps = [
  {
    icon: MessagesSquare,
    title: "شرح مبسّط بالعامية",
    body: "كل مفهوم متشرح بأمثلة من الواقع، بأسلوب سهل بعيد عن الحفظ.",
  },
  {
    icon: ClipboardCheck,
    title: "اختبار بعد كل درس",
    body: "أسئلة على نمط الامتحان مع تصحيح فوري ودرجة، عشان تتأكد إنك فهمت.",
  },
  {
    icon: LayoutGrid,
    title: "أدوات عملية تفاعلية",
    body: "حاسبة نقطة التعادل ولوحة تحليل SWOT تشتغل جوّه المنصة أثناء الدرس.",
  },
  {
    icon: TrendingUp,
    title: "تتبُّع تقدّمك",
    body: "حلقات إنجاز، سلسلة أيام دراسة، وشارات تحفيزية محسوبة من نشاطك الحقيقي.",
  },
];

const steps = [
  {
    n: "١",
    title: "اختر مستواك الدراسي",
    body: "اتصفّح الكورس، شوف المنهج كامل، وشاهد الدرس التجريبي المجاني.",
  },
  {
    n: "٢",
    title: "فعّل الكورس",
    body: "حوّل المبلغ (فودافون كاش / إنستاباي / تحويل بنكي) وارفع صورة الإيصال، أو أدخل كودًا جاهزًا.",
  },
  {
    n: "٣",
    title: "ابدأ التعلّم فورًا",
    body: "بعد الموافقة يتفعّل الكورس على حسابك مباشرة — دروس، ملفات، واختبارات.",
  },
];

const faqs = [
  {
    q: "إزاي بدفع قيمة الكورس؟",
    a: "التحويل يدوي عبر فودافون كاش أو إنستاباي أو تحويل بنكي. بترفع صورة الإيصال من صفحة الكورس، وبعد المراجعة يتفعّل حسابك تلقائيًا. تقدر كمان تستخدم كود تفعيل جاهز لو معاك واحد.",
  },
  {
    q: "المحتوى بيتحدّث مع المنهج؟",
    a: "أيوه، المحتوى بيتراجع باستمرار عشان يتماشى مع المقرر الرسمي وأنماط الأسئلة الحالية.",
  },
  {
    q: "أقدر أتفرّج على الدروس أكتر من مرة؟",
    a: "طبعًا، بعد تفعيل الكورس بيكون عندك وصول دائم لكل الدروس والملفات بدون حد لعدد المشاهدات.",
  },
  {
    q: "فيه درس تجريبي مجاني؟",
    a: "أيوه، كل كورس فيه درس واحد على الأقل متاح كمعاينة مجانية قبل ما تشترك.",
  },
  {
    q: "لو واجهت مشكلة تقنية، أكلّم مين؟",
    a: "تقدر تتواصل معانا عبر البريد أو الهاتف الموجودين في آخر الصفحة، وهنرد عليك في أسرع وقت.",
  },
];

export default async function LandingPage() {
  const [courses, settings] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: { quiz: { select: { id: true } } },
            },
          },
        },
      },
    }),
    getSiteSettings(),
  ]);

  // Real, computed figures only — no fabricated "students" / "satisfaction".
  const totals = courses.reduce(
    (acc, c) => {
      const m = courseMeta(c.modules);
      return {
        modules: acc.modules + m.moduleCount,
        lessons: acc.lessons + m.lessonCount,
        quizzes: acc.quizzes + m.quizCount,
      };
    },
    { modules: 0, lessons: 0, quizzes: 0 },
  );
  const stats = [
    { icon: BookOpen, target: courses.length, suffix: "", label: "كورس منشور" },
    { icon: Layers, target: totals.modules, suffix: "", label: "وحدة دراسية" },
    { icon: PlayCircle, target: totals.lessons, suffix: "", label: "درس فيديو" },
    { icon: ClipboardCheck, target: totals.quizzes, suffix: "", label: "اختبار تفاعلي" },
  ];

  const preview = courses.find((c) => c.modules.length > 0) ?? null;
  const previewMeta = preview ? courseMeta(preview.modules) : null;

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} min-h-screen bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      {/* ---------- Hero ---------- */}
      <section id="home" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.20),transparent_42%),radial-gradient(circle_at_15%_8%,rgba(251,191,36,0.16),transparent_40%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1 text-xs font-semibold text-gold-300">
              <Sparkles size={14} />
              منصة متخصصة لطلاب الثانوية العامة
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              تفوّق في <span className="text-gold-400">إدارة الأعمال</span>
              <br />
              وابنِ أساس مستقبلك المهني
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              شرح مبسّط للمقرر الرسمي، اختبار تفاعلي بعد كل درس، وأدوات عملية تساعدك
              تفهم بعمق — على يد المحاضر <strong className="font-bold text-white">محمد حسين</strong>.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                href="#courses"
                className="flex items-center justify-center gap-2 rounded-control bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
              >
                ابدأ رحلتك الآن
                <ArrowLeft size={18} />
              </a>
              <a
                href="#courses"
                className="flex items-center justify-center gap-2 rounded-control border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
              >
                <PlayCircle size={18} />
                شاهد درسًا تجريبيًا
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
              {["٣ مستويات دراسية كاملة", "اختبار بعد كل درس", "تتبع تقدّمك بالكامل"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
                >
                  <CheckCircle2 size={14} className="text-gold-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* product visual */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-gold-400/20 via-blue-500/12 to-transparent blur-2xl" />
            <div className="relative rounded-card border border-white/10 bg-navy-900 p-4 shadow-elevated">
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-navy-800 to-navy-900">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/90">
                  <Play size={26} className="translate-x-[1px] fill-navy-950 text-navy-950" />
                </span>
                <span className="absolute bottom-2.5 right-3 rounded bg-navy-950/60 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                  ١٢:٣٤ / ١٨:٤٠
                </span>
              </div>
              <div className="px-2 pb-1 pt-4">
                <p className="text-xs font-bold text-blue-400">الوحدة الأولى · مبادئ الإدارة</p>
                <h3 className="mt-1 text-base font-bold text-white">الدرس ٣: وظائف المدير الأساسية</h3>
                <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[68%] bg-gold-400" />
                </div>
                <p className="mt-2 text-xs text-slate-400">أكملت ٦ من ٩ دروس في هذه الوحدة</p>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 rounded-control bg-white/[0.03] px-2.5 py-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span className="text-[13px] text-slate-300">مقدمة عن علم الإدارة</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-control border border-gold-400/20 bg-gold-400/[0.06] px-2.5 py-2">
                  <PlayCircle size={16} className="shrink-0 text-gold-400" />
                  <span className="text-[13px] font-semibold text-white">وظائف المدير الأساسية</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-control bg-white/[0.03] px-2.5 py-2">
                  <ClipboardCheck size={16} className="shrink-0 text-slate-500" />
                  <span className="text-[13px] text-slate-400">اختبار الوحدة الأولى</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2.5 border-t border-white/[0.06] px-2 pt-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold-400/30 bg-navy-800 text-slate-300">
                  <User size={16} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white">محمد حسين</p>
                  <p className="text-[11px] text-slate-400">محاضر إدارة الأعمال</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Stats (real, computed — hidden until there's content) ---------- */}
      {courses.length > 0 && (
        <section className="border-y border-white/10 bg-navy-900/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-11 md:grid-cols-4">
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
      )}

      {/* ---------- Why ---------- */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-blue-400">لماذا ليدجر أكاديمي؟</span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            مش مجرد فيديوهات — طريقة تعلّم كاملة
          </h2>
          <p className="mt-4 text-slate-400">
            كل عنصر في المنصة مصمَّم عشان يوصل الطالب لفهم عميق وثقة في الامتحان.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((v) => (
            <div key={v.title} className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
                <v.icon size={22} />
              </span>
              <h3 className="mt-4 text-base font-bold text-white">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Curriculum preview ---------- */}
      {preview && previewMeta && (
        <section className="border-y border-white/10 bg-navy-900/40">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-blue-400">المنهج</span>
              <h2 className="mt-3 text-3xl font-extrabold text-white">مبني على المقرر الرسمي، وحدة بوحدة</h2>
              <p className="mt-4 text-slate-400">
                كل مستوى دراسي مقسّم لوحدات، وكل وحدة فيها دروس فيديو وملفات واختبار.
                تقدر تشوف تفاصيل المنهج كامل قبل ما تشترك.
              </p>
              <div className="mt-6 flex flex-col items-start gap-3 text-xs font-semibold text-slate-300">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <BookOpen size={14} className="text-gold-400" />
                  {previewMeta.moduleCount.toLocaleString("ar-EG")} وحدات دراسية
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <PlayCircle size={14} className="text-gold-400" />
                  {previewMeta.lessonCount.toLocaleString("ar-EG")} درس فيديو
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  <ClipboardCheck size={14} className="text-gold-400" />
                  {previewMeta.quizCount.toLocaleString("ar-EG")} اختبار تفاعلي
                </span>
              </div>
              <Link
                href={`/courses/${preview.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-gold-400 transition hover:text-gold-300"
              >
                شاهد المنهج كامل
                <ArrowLeft size={15} />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {preview.modules.slice(0, 4).map((module, i) => (
                <div
                  key={module.id}
                  className="overflow-hidden rounded-card border border-white/10 bg-navy-900/60"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] bg-gold-400/[0.06] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/15 text-gold-400">
                        <BookOpen size={16} />
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        الوحدة {i + 1}: {module.title}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      {module.lessons.length.toLocaleString("ar-EG")} دروس
                    </span>
                  </div>
                  {i === 0 && (
                    <div className="flex flex-col">
                      {module.lessons.slice(0, 4).map((lesson, li) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3 last:border-0"
                        >
                          <PlayCircle
                            size={15}
                            className={li === 2 ? "text-gold-400" : "text-slate-500"}
                          />
                          <span
                            className={`text-sm ${li === 2 ? "font-semibold text-white" : "text-slate-300"}`}
                          >
                            {lesson.title}
                          </span>
                          {li === 2 && (
                            <span className="mr-auto text-xs text-gold-400">معاينة مجانية</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Courses ---------- */}
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

        {courses.length === 0 ? (
          <p className="text-center text-slate-400">لا توجد كورسات منشورة حاليًا.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={{ ...course, price: Number(course.price) }}
                meta={courseMeta(course.modules)}
                featured={courses.length >= 3 && i === 1}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- How to start ---------- */}
      <section className="border-y border-white/10 bg-navy-900/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-400">البداية في ٣ خطوات</span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">كيف تشترك وتبدأ التعلّم</h2>
            <p className="mt-4 text-slate-400">
              مفيش دفع أونلاين معقّد — التحويل يدوي وسريع، والتفعيل بعد المراجعة.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-card border border-white/10 bg-navy-900/60 p-7 text-center shadow-card"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 text-lg font-extrabold text-navy-950">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- About presenter ---------- */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-14 md:grid-cols-[0.75fr_1.25fr]">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-blue-500/20 via-gold-400/12 to-transparent blur-2xl" />
            <div className="relative flex aspect-[1/1.05] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-white/15 bg-gradient-to-b from-navy-800 to-navy-900">
              <User size={72} className="text-slate-600" />
              <span className="text-xs text-slate-500">صورة المحاضر محمد حسين</span>
            </div>
          </div>

          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-blue-400">عن المحاضر</span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">محمد حسين</h2>
            <p className="mt-2 font-bold text-gold-400">خبير إدارة الأعمال وصانع محتوى تعليمي</p>
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

      {/* ---------- FAQ ---------- */}
      <section className="border-t border-white/10 bg-navy-900/40">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-400">أسئلة شائعة</span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              كل اللي محتاج تعرفه قبل ما تشترك
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="group rounded-card border border-white/10 bg-navy-900/60 px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 font-bold text-white">
                  {f.q}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-slate-400 transition group-open:-rotate-180 group-open:text-gold-400"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA + contact ---------- */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-card border border-gold-400/25 bg-gradient-to-br from-gold-400/12 via-blue-500/[0.06] to-navy-900 p-12 text-center shadow-card">
          <MessagesSquare className="mx-auto mb-4 text-gold-400" size={36} />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            جاهز تبدأ رحلتك في إدارة الأعمال؟
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            اختر مستواك الدراسي دلوقتي، أو تواصل معنا لو عندك أي استفسار عن الكورسات.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#courses"
              className="flex items-center gap-2 rounded-control bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
            >
              تصفّح الكورسات
              <ArrowLeft size={18} />
            </a>
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-2 rounded-control border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
            >
              <Mail size={18} />
              راسلنا عبر البريد
            </a>
            <a
              href={`tel:${settings.contactPhone}`}
              className="flex items-center gap-2 rounded-control border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
            >
              <Phone size={18} />
              اتصل بنا
            </a>
          </div>
        </div>
      </section>

      <LedgerFooter />
    </div>
  );
}
