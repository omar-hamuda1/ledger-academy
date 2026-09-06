import { BreakEvenCalculator } from "@/components/tools/BreakEvenCalculator";
import { SwotBoard } from "@/components/tools/SwotBoard";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function StudentToolsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">الأدوات التفاعلية</h1>
      <p className="mt-2 text-slate-400">
        أدوات عملية لتطبيق ما تتعلمه في كورسات إدارة الأعمال.
      </p>

      <div className="mt-8 space-y-6">
        {!settings.showBreakEvenTool && !settings.showSwotTool && (
          <p className="text-slate-400">لا توجد أدوات متاحة حاليًا.</p>
        )}
        {settings.showBreakEvenTool && <BreakEvenCalculator />}
        {settings.showSwotTool && <SwotBoard />}
      </div>
    </div>
  );
}
