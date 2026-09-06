/**
 * A "day" is compared using local calendar-date components, not a strict
 * 24h window — matches how a student would intuitively read "3 days in a
 * row" rather than "the last 72 hours."
 */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function calculateStreakDays(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  const uniqueDays = new Set(completedDates.map(dayKey));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (uniqueDays.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export type Achievement = {
  id: string;
  label: string;
  achieved: boolean;
};

export function getAchievements(
  completedLessonsCount: number,
  quizzesPassedCount: number,
  streakDays: number
): Achievement[] {
  return [
    { id: "first-lesson", label: "أول درس", achieved: completedLessonsCount >= 1 },
    { id: "five-lessons", label: "5 دروس", achieved: completedLessonsCount >= 5 },
    { id: "ten-lessons", label: "10 دروس", achieved: completedLessonsCount >= 10 },
    { id: "first-quiz", label: "أول اختبار ناجح", achieved: quizzesPassedCount >= 1 },
    { id: "three-quizzes", label: "3 اختبارات ناجحة", achieved: quizzesPassedCount >= 3 },
    { id: "three-day-streak", label: "3 أيام متتالية", achieved: streakDays >= 3 },
    { id: "week-streak", label: "أسبوع متواصل", achieved: streakDays >= 7 },
  ];
}
