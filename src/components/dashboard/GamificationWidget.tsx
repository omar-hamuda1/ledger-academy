"use client";

import { motion } from "framer-motion";
import { Flame, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Achievement } from "@/lib/gamification";

export function GamificationWidget({
  streakDays,
  achievements,
}: {
  streakDays: number;
  achievements: Achievement[];
}) {
  const earnedCount = achievements.filter((a) => a.achieved).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 flex flex-col gap-4 rounded-card border border-white/10 bg-navy-900/60 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
          <Flame size={22} className={streakDays > 0 ? "animate-pop" : ""} />
        </span>
        <div>
          <p className="text-xl font-extrabold text-white">
            {streakDays} {streakDays === 1 ? "يوم" : "أيام"} متتالية
          </p>
          <p className="text-xs text-slate-400">
            {streakDays > 0 ? "استمر في التعلم يوميًا للحفاظ على تتابعك!" : "أكمل درسًا اليوم لتبدأ تتابعك."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Award size={14} className="text-gold-400" />
          {earnedCount} / {achievements.length} إنجاز
        </span>
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.1 + index * 0.05 }}
          >
            <Badge variant={achievement.achieved ? "default" : "outline"} className={achievement.achieved ? "" : "opacity-40"}>
              {achievement.label}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
