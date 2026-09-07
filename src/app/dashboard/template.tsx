"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * A `template.tsx` re-mounts its subtree on every navigation (unlike a
 * `layout.tsx`, which persists), so it's the right place for a route-enter
 * animation across every dashboard page.
 *
 * Deliberately opacity-only: animating `transform` on an ancestor would
 * create a containing block for `position: fixed` descendants (the lesson
 * workspace panel's floating trigger, mobile nav overlays) and make them
 * jump for the animation's duration. A plain `opacity` transition doesn't.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: reduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
