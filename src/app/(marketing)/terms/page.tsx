import { Cairo } from "next/font/google";
import { ShieldAlert } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const revalidate = 300;

export default async function TermsOfServicePage() {
  const settings = await getSiteSettings();

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} flex min-h-screen flex-col bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="mb-2 text-3xl font-extrabold text-white">شروط الاستخدام</h1>
        <p className="mb-8 text-sm text-slate-500">آخر تحديث: سبتمبر 2026</p>

        <div className="mb-10 flex gap-3 rounded-card border border-gold-400/30 bg-gold-400/10 p-4 text-sm text-gold-300">
          <ShieldAlert size={20} className="mt-0.5 shrink-0" />
          <p>
            هذا المستند نموذج عام لشروط الاستخدام وليس استشارة قانونية معتمدة. يُنصح بمراجعته من
            محامٍ مختص، خصوصًا فيما يخص سياسة الاسترداد وحماية المحتوى، قبل الاعتماد عليه بشكل
            نهائي.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-2 text-lg font-bold text-white">١. قبول الشروط</h2>
            <p>
              باستخدامك منصة Ledger Academy، سواء بإنشاء حساب أو الاشتراك في أحد الكورسات، فإنك
              توافق على الالتزام بهذه الشروط. إذا كنت دون سن 18 عامًا، يجب أن يكون استخدامك للمنصة
              بعلم وموافقة ولي أمرك.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٢. وصف الخدمة</h2>
            <p>
              تقدّم المنصة كورسات تعليمية في مادة إدارة الأعمال لطلاب المرحلة الثانوية، تشمل دروس
              فيديو، اختبارات قصيرة، وأدوات تفاعلية مساعدة على الفهم. بعض الكورسات مجانية، وبعضها
              الآخر مدفوع.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٣. الحساب الشخصي</h2>
            <p>
              أنت مسؤول عن الحفاظ على سرية بيانات دخولك، وعدم مشاركة حسابك مع أي شخص آخر. أي نشاط
              يحدث من خلال حسابك يُعتبر مسؤوليتك الكاملة.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٤. الدفع والاشتراكات</h2>
            <p>
              أسعار الكورسات المدفوعة معروضة بالجنيه المصري (ج.م) وتُدفع مقدمًا عبر مزوّد دفع
              إلكتروني آمن. بما أن الكورسات محتوى رقمي يُتاح الوصول إليه فور إتمام الدفع، لا يوجد
              استرداد تلقائي بعد الاشتراك؛ إذا واجهت مشكلة في الدفع أو الوصول للمحتوى، تواصل معنا
              على{" "}
              <a href={`mailto:${settings.contactEmail}`} className="text-gold-400 hover:underline">
                {settings.contactEmail}
              </a>{" "}
              وسنُراجع طلبك.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٥. حقوق المحتوى والاستخدام المسموح</h2>
            <p>
              جميع الفيديوهات والدروس والمواد التعليمية على المنصة مملوكة لـ Ledger Academy ومحمد
              حسين، ومخصصة للاستخدام الشخصي لصاحب الحساب فقط. يُمنع منعًا باتًا:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pr-5">
              <li>تسجيل الشاشة أو تحميل أو إعادة نشر أي فيديو أو محتوى من المنصة.</li>
              <li>مشاركة حساب الدخول مع أشخاص آخرين غير المشترك الأصلي.</li>
              <li>إعادة بيع أو توزيع محتوى الكورسات بأي شكل من الأشكال.</li>
            </ul>
            <p className="mt-2">
              مخالفة هذه البنود قد تؤدي لإيقاف الحساب فورًا دون استرداد أي مبلغ مدفوع.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٦. السلوك المتوقع</h2>
            <p>
              نتوقع من جميع الطلاب الالتزام بالأمانة الأكاديمية أثناء أداء الاختبارات، وعدم محاولة
              العبث بأنظمة المنصة أو استغلال أي ثغرات تقنية.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٧. إخلاء المسؤولية</h2>
            <p>
              نبذل قصارى جهدنا لضمان جودة المحتوى ودقته وتوفر المنصة بشكل مستمر، لكننا لا نضمن
              خلوّ الخدمة من الأخطاء التقنية أو انقطاعها المؤقت. المنصة أداة مساعدة للدراسة ولا
              تُغني عن المتابعة المدرسية المعتادة.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٨. القانون المعمول به</h2>
            <p>تخضع هذه الشروط وتُفسَّر وفقًا لقوانين جمهورية مصر العربية.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">٩. التعديلات على هذه الشروط</h2>
            <p>
              قد نُحدّث هذه الشروط من وقت لآخر. الاستمرار في استخدام المنصة بعد أي تعديل يُعتبر
              موافقة ضمنية على الشروط المُحدَّثة.
            </p>
          </section>
        </div>
      </main>

      <LedgerFooter />
    </div>
  );
}
