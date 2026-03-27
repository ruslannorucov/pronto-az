import Link from "next/link";

const footerLinks = [
  {
    title: "Xidmətlər",
    links: [
      { label: "Santexnik", href: "/categories/santexnik" },
      { label: "Elektrik", href: "/categories/elektrik" },
      { label: "Təmizlik", href: "/categories/temizlik" },
      { label: "Boyaqçı", href: "/categories/boyaqci" },
      { label: "Daşınma", href: "/categories/dasinma" },
    ],
  },
  {
    title: "Şirkət",
    links: [
      { label: "Haqqımızda", href: "/about" },
      { label: "Necə işləyir", href: "#how-it-works" },
      { label: "Qiymətlər", href: "#pricing" },
      { label: "Bloq", href: "/blog" },
    ],
  },
  {
    title: "Dəstək",
    links: [
      { label: "Yardım mərkəzi", href: "/help" },
      { label: "Bizimlə əlaqə", href: "/contact" },
      { label: "Məxfilik siyasəti", href: "/privacy" },
      { label: "İstifadə şərtləri", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A1628] border-t border-white/8">
      <div className="mx-auto max-w-7xl px-[64px] py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 pb-12 border-b border-white/8">
          {/* Brand col */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="font-serif text-2xl font-bold text-white tracking-tight"
            >
              Pronto<span className="text-[var(--primary)]">.</span>az
            </Link>
            <p className="mt-4 text-[14px] text-white/45 leading-relaxed max-w-[280px]">
              Bakıda ev xidmətləri üçün №1 platforma. Peşəkar ustalar, şəffaf
              qiymətlər, sürətli cavab.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { label: "Instagram", icon: "📸", href: "#" },
                { label: "WhatsApp", icon: "💬", href: "#" },
                { label: "Facebook", icon: "📘", href: "#" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-sm hover:bg-[var(--primary)] hover:border-[var(--primary)] transition-all"
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* App badges */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/12 transition-all"
              >
                <span className="text-lg">🍎</span>
                <div>
                  <p className="text-[10px] text-white/45 leading-none">Yüklə</p>
                  <p className="text-[13px] font-semibold text-white leading-tight">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/12 transition-all"
              >
                <span className="text-lg">🤖</span>
                <div>
                  <p className="text-[10px] text-white/45 leading-none">Yüklə</p>
                  <p className="text-[13px] font-semibold text-white leading-tight">Google Play</p>
                </div>
              </a>
            </div>
          </div>

          {/* Link cols */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <p className="text-[12px] font-bold text-white/90 uppercase tracking-widest mb-5">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-white/45 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-[13px] text-white/30">
            © 2025 Pronto.az — Bütün hüquqlar qorunur
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
            <p className="text-[13px] text-white/30">
              Bütün sistemlər işləyir
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}