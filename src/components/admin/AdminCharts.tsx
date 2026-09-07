"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CoursePopularityPoint,
  WeeklyActivityPoint,
} from "@/lib/admin-metrics";

const GOLD = "#fbbf24";
const BLUE = "#60a5fa";
const GRID = "rgba(255,255,255,0.08)";
const AXIS = "#94a3b8";

const tooltipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.625rem",
  fontFamily: "var(--font-cairo)",
  fontSize: "12px",
  color: "#f1f5f9",
} as const;

const BAR_COLORS = [GOLD, BLUE, "#34d399", "#a78bfa", "#fca5a5", "#f472b6"];

function ChartCard({
  title,
  subtitle,
  delay,
  children,
}: {
  title: string;
  subtitle: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card"
    >
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      <div dir="ltr" className="mt-4 h-64 w-full">
        {children}
      </div>
    </motion.div>
  );
}

export function AdminCharts({
  weeklyActivity,
  coursePopularity,
}: {
  weeklyActivity: WeeklyActivityPoint[];
  coursePopularity: CoursePopularityPoint[];
}) {
  const hasPopularity = coursePopularity.some((c) => c.enrollments > 0);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <ChartCard
        title="النشاط خلال 8 أسابيع"
        subtitle="عدد الاشتراكات الجديدة والدروس المكتملة أسبوعيًا"
        delay={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyActivity} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fillEnroll" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillComplete" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: AXIS, fontSize: 11, fontFamily: "var(--font-cairo)" }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: GRID }}
              labelStyle={{ color: "#f1f5f9" }}
            />
            <Area
              type="monotone"
              dataKey="enrollments"
              name="اشتراكات"
              stroke={GOLD}
              strokeWidth={2}
              fill="url(#fillEnroll)"
            />
            <Area
              type="monotone"
              dataKey="completions"
              name="دروس مكتملة"
              stroke={BLUE}
              strokeWidth={2}
              fill="url(#fillComplete)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="الاشتراكات حسب الكورس"
        subtitle="أكثر الكورسات تسجيلًا للطلاب"
        delay={0.1}
      >
        {hasPopularity ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coursePopularity}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                type="category"
                dataKey="title"
                width={96}
                tick={{ fill: AXIS, fontSize: 10, fontFamily: "var(--font-cairo)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="enrollments" name="طلاب مسجّلون" radius={[0, 6, 6, 0]}>
                {coursePopularity.map((entry, i) => (
                  <Cell key={entry.title} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            لا توجد اشتراكات بعد لعرضها.
          </div>
        )}
      </ChartCard>
    </div>
  );
}
