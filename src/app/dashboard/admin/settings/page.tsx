import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">الإعدادات العامة</h1>
      <p className="mt-2 text-slate-400">
        تحكم في المحتوى الذي يظهر للطلاب في الصفحة الرئيسية ولوحة التحكم.
      </p>

      <div className="mt-8 max-w-2xl">
        <SiteSettingsForm
          initialStudentsCount={settings.studentsCount}
          initialSatisfactionRate={settings.satisfactionRate}
          initialContactEmail={settings.contactEmail}
          initialContactPhone={settings.contactPhone}
          initialShowBreakEvenTool={settings.showBreakEvenTool}
          initialShowSwotTool={settings.showSwotTool}
          initialAnnouncement={settings.announcement ?? ""}
          initialAnnouncementActive={settings.announcementActive}
        />
      </div>
    </div>
  );
}
