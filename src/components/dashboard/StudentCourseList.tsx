"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle, Award } from "lucide-react";
import { CircularProgress } from "./CircularProgress";
import { CertificateButton } from "./CertificateButton";

export type StudentCourseItem = {
  id: string;
  courseId: string;
  title: string;
  percent: number;
  completedCount: number;
  totalLessons: number;
  continueHref: string | null;
  certSerial: string | null;
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function StudentCourseList({ courses }: { courses: StudentCourseItem[] }) {
  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {courses.map((course) => (
        <motion.li
          key={course.id}
          variants={cardVariants}
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card transition-colors duration-300 hover:border-gold-400/30 hover:shadow-elevated"
        >
          <div className="flex items-center gap-4">
            <CircularProgress percent={course.percent} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-white">{course.title}</h3>
              <p className="mt-1 text-xs text-slate-400">
                {course.completedCount} / {course.totalLessons} درس مكتمل
              </p>
            </div>
          </div>

          {course.continueHref && (
            <Link
              href={course.continueHref}
              className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-gold-400 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
            >
              <PlayCircle size={16} />
              متابعة التعلم
            </Link>
          )}

          {course.percent >= 100 &&
            (course.certSerial ? (
              <Link
                href={`/certificates/${course.certSerial}`}
                target="_blank"
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-gold-400/40 py-2.5 text-sm font-bold text-gold-400 transition hover:bg-gold-400/10"
              >
                <Award size={16} />
                عرض شهادتك
              </Link>
            ) : (
              <CertificateButton courseId={course.courseId} />
            ))}
        </motion.li>
      ))}
    </motion.ul>
  );
}
