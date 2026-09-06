import { GraduationCap } from "lucide-react";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./SocialIcons";

const navLinks = [
  { href: "/#home", label: "الرئيسية" },
  { href: "/#courses", label: "الكورسات" },
  { href: "/#about", label: "عن المحاضر" },
  { href: "/#contact", label: "تواصل معنا" },
];

export function LedgerFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-navy-950">
              <GraduationCap size={20} />
            </span>
            <span className="text-lg font-extrabold text-white">
              Ledger <span className="text-gold-400">Academy</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            منصة تعليمية متخصصة في تدريس إدارة الأعمال لطلاب الثانوية العامة بأسلوب
            عصري وتفاعلي.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition hover:text-gold-400">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">تابعنا</h3>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <FacebookIcon size={18} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <InstagramIcon size={18} />
            </a>
            <a
              href="#"
              aria-label="Youtube"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-gold-400 hover:text-navy-950"
            >
              <YoutubeIcon size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-white/10 py-6 text-center text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
        <span>© {new Date().getFullYear()} Ledger Academy. جميع الحقوق محفوظة.</span>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="transition hover:text-gold-400">
            سياسة الخصوصية
          </a>
          <a href="/terms" className="transition hover:text-gold-400">
            شروط الاستخدام
          </a>
        </div>
      </div>
    </footer>
  );
}
