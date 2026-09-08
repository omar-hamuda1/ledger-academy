import { db } from "@/lib/db";

export type CourseRating = { avg: number; count: number };

/** Average rating + count over non-hidden reviews. avg is rounded to 1 dp. */
export async function courseRating(courseId: string): Promise<CourseRating> {
  const agg = await db.review.aggregate({
    where: { courseId, hidden: false },
    _avg: { rating: true },
    _count: true,
  });
  return {
    avg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
    count: agg._count,
  };
}

export type PublicReview = {
  id: string;
  rating: number;
  body: string | null;
  authorName: string;
  createdAt: number;
};

/** Non-hidden reviews, newest first, with the reviewer's first name only. */
export async function courseReviews(courseId: string, take = 20): Promise<PublicReview[]> {
  const rows = await db.review.findMany({
    where: { courseId, hidden: false },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    authorName: r.user.name.split(/\s+/)[0] || r.user.name,
    createdAt: r.createdAt.getTime(),
  }));
}
