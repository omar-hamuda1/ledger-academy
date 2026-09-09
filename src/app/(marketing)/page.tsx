import { Cairo } from "next/font/google";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  PlayCircle,
  Mail,
  Phone,
  MessagesSquare,
  ClipboardCheck,
  LayoutGrid,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { courseMeta } from "@/lib/course-meta";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";
import { CourseCard } from "@/components/ledger-academy/CourseCard";
import { Hero } from "@/components/ledger-academy/Hero";
import { Reveal } from "@/components/ledger-academy/Reveal";

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

function SectionHeading({
  eyebrow,
  title,
  body,
  center = false,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <span className="text-sm font-bold uppercase tracking-wider text-blue-400">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-slate-400">{body}</p>}
    </div>
  );
}

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
  const heroStats =
    courses.length > 0
      ? [
          { id: "courses", value: courses.length, label: "كورس منشور" },
          { id: "modules", value: totals.modules, label: "وحدة دراسية" },
          { id: "lessons", value: totals.lessons, label: "درس فيديو" },
          { id: "quizzes", value: totals.quizzes, label: "اختبار تفاعلي" },
        ]
      : [];

  const preview = courses.find((c) => c.modules.length > 0) ?? null;
  const previewMeta = preview ? courseMeta(preview.modules) : null;

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} min-h-screen bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      <Hero stats={heroStats} />

      {/* ---------- Why — asymmetric, rows not cards ---------- */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <SectionHeading
              eyebrow="لماذا ليدجر أكاديمي"
              title="مش مجرد فيديوهات — طريقة تعلّم كاملة"
              body="كل درس متبوع باختبار، وكل مفهوم متشرح بمثال من الواقع — عشان تدخل الامتحان واثق مش حافظ."
            />
          </div>
          <div className="divide-y divide-white/[0.07]">
            {valueProps.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.05}>
                <div className="flex gap-5 py-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
                    <v.icon size={22} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Curriculum + courses — one region ---------- */}
      <section id="courses" className="border-y border-white/10 bg-navy-900/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          {preview && previewMeta ? (
            <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
              <Reveal>
                <SectionHeading
                  eyebrow="المنهج"
                  title="مبني على المقرر الرسمي، وحدة بوحدة"
                  body="كل مستوى دراسي مقسّم لوحدات، وكل وحدة فيها دروس فيديو وملفات واختبار. تقدر تشوف تفاصيل المنهج كامل قبل ما تشترك."
                />
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
                  className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-gold-400 transition hover:text-gold-300"
                >
                  شاهد المنهج كامل
                  <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
                </Link>
              </Reveal>

              <div className="flex flex-col gap-3">
                {preview.modules.slice(0, 4).map((module, i) => (
                  <Reveal key={module.id} delay={i * 0.06}>
                    <div className="overflow-hidden rounded-card border border-white/10 bg-navy-900/60 transition hover:border-white/20">
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
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <SectionHeading
              eyebrow="الكورسات"
              title="اختر مستواك الدراسي وابدأ التعلّم"
              body="محتوى تعليمي متكامل لكل صف من صفوف المرحلة الثانوية في مادة إدارة الأعمال."
            />
          )}

          <div className="mt-20">
            <h3 className="text-2xl font-extrabold text-white">
              اختر مستواك الدراسي وابدأ
            </h3>
            {courses.length === 0 ? (
              <p className="mt-6 text-slate-400">لا توجد كورسات منشورة حاليًا.</p>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {courses.map((course, i) => (
                  <Reveal key={course.id} delay={i * 0.07}>
                    <CourseCard
                      course={{ ...course, price: Number(course.price) }}
                      meta={courseMeta(course.modules)}
                      featured={courses.length >= 3 && i === 1}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- How to start — connected timeline ---------- */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeading
          eyebrow="البداية في ٣ خطوات"
          title="كيف تشترك وتبدأ التعلّم"
          body="مفيش دفع أونلاين معقّد — التحويل يدوي وسريع، والتفعيل بعد المراجعة مباشرة."
        />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3">
          <span className="pointer-events-none absolute inset-x-0 top-5 hidden h-px bg-gradient-to-l from-transparent via-white/15 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <li className="relative">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/40 bg-navy-950 text-sm font-extrabold text-gold-400">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- About presenter ---------- */}
      <section id="about" className="border-y border-white/10 bg-navy-900/40">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-[0.7fr_1.3fr]">
          <Reveal>
            <div className="relative mx-auto w-full max-w-xs">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-card border border-white/10 bg-gradient-to-b from-navy-800 to-navy-900">
                <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_32%,rgba(251,191,36,0.14),transparent_70%)]" />
                <span className="absolute inset-3 rounded-[1rem] border border-gold-400/20" />
                <span className="relative text-[5rem] font-extrabold leading-none text-gold-400">
                  م.ح
                </span>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">صورة المحاضر قريبًا</p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
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
          </Reveal>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <SectionHeading eyebrow="أسئلة شائعة" title="كل اللي محتاج تعرفه قبل ما تشترك" />
        <div className="mt-12 flex flex-col gap-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <details
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
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Final CTA + contact ---------- */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="rounded-card border border-gold-400/25 bg-gradient-to-b from-gold-400/10 to-navy-900 p-12 text-center shadow-card">
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
                className="group flex items-center gap-2 rounded-control bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
              >
                تصفّح الكورسات
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              </a>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="flex items-center gap-2 rounded-control border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400/60 hover:text-blue-300"
              >
                <Mail size={18} />
                راسلنا عبر البريد
              </a>
              <a
                href={`tel:${settings.contactPhone}`}
                className="flex items-center gap-2 rounded-control border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400/60 hover:text-blue-300"
              >
                <Phone size={18} />
                اتصل بنا
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <LedgerFooter />
    </div>
  );
}
