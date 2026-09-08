import { Cairo } from "next/font/google";
import { ShieldAlert } from "lucide-react";
import { getSiteSettings } from "@/lib/site-settings";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const revalidate = 300;

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} flex min-h-screen flex-col bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="mb-2 text-3xl font-extrabold text-white">سياسة الخصوصية</h1>
        <p className="mb-8 text-sm text-slate-400">آخر تحديث: سبتمبر 2026</p>

        <div className="mb-10 flex gap-3 rounded-card border border-gold-400/30 bg-gold-400/10 p-4 text-sm text-gold-300">
          <ShieldAlert size={20} className="mt-0.5 shrink-0" />
          <p>
            هذا المستند نموذج عام يوضح كيفية تعامل Ledger Academy مع بياناتك، وليس استشارة قانونية
            معتمدة. نظرًا لأن جزءًا من مستخدمي المنصة قاصرون (طلاب المرحلة الثانوية)، يُنصح بمراجعته
            من محامٍ مختص قبل الاعتماد عليه بشكل نهائي.
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="mb-2 text-lg font-bold text-white">من نحن</h2>
            <p>
              Ledger Academy منصة تعليمية إلكترونية متخصصة في تدريس مادة إدارة الأعمال لطلاب
              المرحلة الثانوية في مصر. تصف هذه السياسة البيانات التي نجمعها من مستخدمي المنصة،
              وكيفية استخدامها وحمايتها.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">البيانات التي نجمعها</h2>
            <ul className="list-disc space-y-1.5 pr-5">
              <li>الاسم والبريد الإلكتروني عند إنشاء الحساب.</li>
              <li>كلمة المرور — تُخزَّن بشكل مشفّر (hashed) ولا يمكن لأي شخص، بما في ذلك فريق المنصة، الاطلاع عليها كنص صريح.</li>
              <li>بيانات الاشتراك في الكورسات، ومدى التقدم في الدروس، ونتائج الاختبارات.</li>
              <li>عند طلب كود لكورس مدفوع: رقم هاتفك وبيانات تحويل الدفع التي تدخلها (مثل رقم عملية فودافون كاش أو انستاباي). لا نجمع أي بيانات بطاقات بنكية، ولا تتم أي معالجة دفع إلكتروني على المنصة — التحويل يتم مباشرةً بينك وبين إدارة المنصة.</li>
              <li>عنوان IP بشكل مؤقت لأغراض أمنية، مثل الحد من محاولات تسجيل الدخول المتكررة.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">لماذا نجمع هذه البيانات</h2>
            <p>
              نستخدم بياناتك حصريًا لإنشاء حسابك وتفعيله، وتقديم محتوى الكورسات التي اشتركت بها،
              ومتابعة تقدمك الدراسي، ومعالجة عمليات الدفع، وحماية المنصة من الاستخدام غير المصرح
              به. لا نبيع بياناتك، ولا نشاركها لأغراض تسويقية مع أي طرف ثالث.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">القاصرون وموافقة ولي الأمر</h2>
            <p>
              المنصة موجّهة لطلاب المرحلة الثانوية، وقد يكون بعض المستخدمين دون سن 18 عامًا. ننصح
              أولياء الأمور بالاطلاع على هذه السياسة ومتابعة استخدام أبنائهم للمنصة. لا نجمع بيانات
              أكثر من الحد الأدنى اللازم لتقديم الخدمة التعليمية.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">جهات خارجية نتعامل معها</h2>
            <ul className="list-disc space-y-1.5 pr-5">
              <li>
                <strong className="text-white">معالجة الدفع:</strong> تُستخدم بيانات الدفع فقط
                لإتمام عملية الشراء عبر مزوّد دفع مرخّص.
              </li>
              <li>
                <strong className="text-white">إرسال البريد الإلكتروني:</strong> تُستخدم خدمة بريد
                إلكتروني خارجية لإرسال رموز التحقق (OTP) وتأكيدات الحساب فقط.
              </li>
              <li>
                <strong className="text-white">استضافة قاعدة البيانات:</strong> تُخزَّن بياناتك في
                قاعدة بيانات مُدارة من مزوّد استضافة سحابي، مع تشفير الاتصال (HTTPS) بين متصفحك
                وخوادمنا.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">ملفات تعريف الارتباط (Cookies)</h2>
            <p>
              نستخدم ملف تعريف ارتباط واحد فقط للحفاظ على جلسة تسجيل دخولك، ولا نستخدم أي أدوات
              تتبّع إعلاني أو تحليلات من أطراف ثالثة.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">حقوقك</h2>
            <p>
              يمكنك في أي وقت طلب الاطلاع على بياناتك المخزّنة لدينا، أو تعديلها، أو طلب حذف حسابك
              بالكامل، عبر التواصل معنا على{" "}
              <a href={`mailto:${settings.contactEmail}`} className="text-gold-400 underline">
                {settings.contactEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold text-white">التعديلات على هذه السياسة</h2>
            <p>
              قد نُحدّث هذه السياسة من وقت لآخر لتعكس أي تغييرات في المنصة أو في القوانين المعمول
              بها. سيظهر تاريخ آخر تحديث دائمًا أعلى هذه الصفحة.
            </p>
          </section>
        </div>
      </main>

      <LedgerFooter />
    </div>
  );
}
