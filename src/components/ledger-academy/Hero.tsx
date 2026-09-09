"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  Play,
  User,
  BookOpen,
  Layers,
  ClipboardCheck,
} from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

type Stat = { id: string; value: number; label: string };

const STAT_ICON: Record<string, typeof BookOpen> = {
  courses: BookOpen,
  modules: Layers,
  lessons: PlayCircle,
  quizzes: ClipboardCheck,
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export function Hero({ stats }: { stats: Stat[] }) {
  const reduce = useReducedMotion();
  const start = reduce ? false : "hidden";

  return (
    <section id="home" className="relative overflow-hidden">
      {/* one restrained accent, not a pair of glow blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,rgba(251,191,36,0.10),transparent_70%)]" />

      <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 md:pb-20 md:pt-20">
        <div className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <motion.div variants={container} initial={start} animate="show">
            <motion.span
              variants={rise}
              className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1 text-xs font-semibold text-gold-300"
            >
              <Sparkles size={14} />
              منصة متخصصة لطلاب الثانوية العامة
            </motion.span>

            <motion.h1
              variants={rise}
              className="mt-5 text-4xl font-extrabold leading-[1.15] text-white sm:text-[3.25rem]"
            >
              تفوّق في <span className="text-gold-400">إدارة الأعمال</span>
              <br />
              وابنِ أساس مستقبلك المهني
            </motion.h1>

            <motion.p
              variants={rise}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
            >
              شرح مبسّط للمقرر الرسمي، اختبار تفاعلي بعد كل درس، وأدوات عملية تشتغل
              جوّه المنصة — على يد المحاضر{" "}
              <strong className="font-bold text-white">محمد حسين</strong>.
            </motion.p>

            <motion.div
              variants={rise}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
            >
              <a
                href="#courses"
                className="group flex items-center justify-center gap-2 rounded-control bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
              >
                ابدأ رحلتك الآن
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
              </a>
              <a
                href="#courses"
                className="flex items-center justify-center gap-2 rounded-control border border-white/20 px-6 py-3 font-bold text-white transition hover:border-blue-400/60 hover:text-blue-300"
              >
                <PlayCircle size={18} />
                شاهد درسًا تجريبيًا
              </a>
            </motion.div>

            <motion.div
              variants={rise}
              className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-slate-300"
            >
              {["٣ مستويات دراسية كاملة", "اختبار بعد كل درس", "تتبع تقدّمك بالكامل"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
                >
                  <CheckCircle2 size={14} className="text-gold-400" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* product panel */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="relative mx-auto w-full max-w-sm"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-card border border-white/10 bg-navy-900 p-4 shadow-elevated"
            >
              <div className="mb-2.5 flex items-center gap-1.5 px-1">
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="ms-auto text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  معاينة
                </span>
              </div>

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
                  <motion.div
                    className="h-full bg-gold-400"
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
                  />
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
            </motion.div>
          </motion.div>
        </div>

        {/* stats — folded into the hero, hairline instead of a bordered band */}
        {stats.length > 0 && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4"
          >
            {stats.map((s) => {
              const Icon = STAT_ICON[s.id] ?? BookOpen;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gold-400">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-xl font-extrabold text-white sm:text-2xl">
                      <AnimatedCounter target={s.value} suffix="" />
                    </p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
