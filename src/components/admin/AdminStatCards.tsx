"use client";

import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ledger-academy/AnimatedCounter";
import type { AdminMetrics } from "@/lib/admin-metrics";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AdminStatCards({ metrics }: { metrics: AdminMetrics }) {
  const passRate =
    metrics.quizAttemptsCount > 0
      ? Math.round((metrics.quizPassCount / metrics.quizAttemptsCount) * 100)
      : 0;

  const cards = [
    {
      icon: Users,
      label: "إجمالي الطلاب",
      value: metrics.studentCount,
      hint:
        metrics.newStudentsThisWeek > 0
          ? `+${metrics.newStudentsThisWeek.toLocaleString("ar-EG")} هذا الأسبوع`
          : "لا تسجيلات جديدة هذا الأسبوع",
    },
    {
      icon: GraduationCap,
      label: "إجمالي الاشتراكات",
      value: metrics.totalEnrollments,
      hint:
        metrics.enrollmentsThisWeek > 0
          ? `+${metrics.enrollmentsThisWeek.toLocaleString("ar-EG")} هذا الأسبوع`
          : "لا اشتراكات جديدة هذا الأسبوع",
    },
    {
      icon: BookOpen,
      label: "الكورسات",
      value: metrics.courseCount,
      hint: `${metrics.publishedCourseCount.toLocaleString("ar-EG")} منشورة`,
    },
    {
      icon: CheckCircle2,
      label: "دروس مكتملة",
      value: metrics.completedLessonsCount,
      hint: "إجمالي عبر جميع الطلاب",
    },
    {
      icon: Trophy,
      label: "اختبارات ناجحة",
      value: metrics.quizPassCount,
      hint: `من ${metrics.quizAttemptsCount.toLocaleString("ar-EG")} محاولة`,
    },
    {
      icon: TrendingUp,
      label: "معدل النجاح",
      value: passRate,
      suffix: "%",
      hint: `متوسط الدرجات ${metrics.avgQuizScore.toLocaleString("ar-EG")}%`,
    },
  ];

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={cardVariants}
          className="rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">{card.label}</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
              <card.icon size={18} />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white">
            <AnimatedCounter target={card.value} suffix={card.suffix ?? ""} duration={1000} />
          </p>
          <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
