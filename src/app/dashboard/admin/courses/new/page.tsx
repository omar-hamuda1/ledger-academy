import Link from "next/link";
import { requireScopePage } from "@/lib/require-admin";
import { ArrowRight } from "lucide-react";
import { CreateCourseForm } from "@/components/admin/CreateCourseForm";

export default async function NewCoursePage() {
  await requireScopePage("courses");
  return (
    <div className="p-6 md:p-8">
      <Link
        href="/dashboard/admin/courses"
        className="mb-6 flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-gold-400"
      >
        <ArrowRight size={16} />
        العودة إلى إدارة الكورسات
      </Link>

      <h1 className="mb-6 text-2xl font-extrabold text-white">إنشاء كورس جديد</h1>

      <div className="max-w-2xl">
        <CreateCourseForm />
      </div>
    </div>
  );
}
