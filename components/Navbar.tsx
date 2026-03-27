"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role, avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(profile);

        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null);
        setUnreadCount(count ?? 0);
      }
      setLoading(false);
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) { setProfile(null); setUnreadCount(0); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSifarisVer = async (e: React.MouseEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    setMobileMenuOpen(false);
    router.push(data.user ? "/request/new" : "/login");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const dashboardHref =
    profile?.role === "worker" ? "/worker/panel" :
    profile?.role === "admin"  ? "/admin" :
    "/dashboard";

  const dashboardLabel =
    profile?.role === "worker" ? "İş panelim" :
    profile?.role === "admin"  ? "Admin" :
    "Sifarişlərim";

  return (
    <nav className={`sticky top-0 z-50 w-full bg-white border-b border-[var(--border)] transition-shadow duration-300 ${
      scrolled ? "shadow-[0_2px_12px_rgba(13,31,60,0.08)]" : ""
    }`}>

      {/* ── DESKTOP — orijinal, heç nə dəyişməyib ── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-[64px] h-[68px] items-center gap-10">

        <Link href="/" className="font-serif text-2xl font-bold text-[var(--navy)] tracking-tight shrink-0">
          Pronto<span className="text-[var(--primary)]">.</span>az
        </Link>

        <div className="flex items-center gap-8 flex-1">
          {[
            { label: "Xidmətlər", href: "/categories" },
            { label: "Ustalar",   href: "/workers" },
            { label: "Necə İşləyir", href: "#how-it-works" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <button onClick={handleSifarisVer} className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors">
                    Sifariş ver
                  </button>
                  <Link href={dashboardHref} className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-light)] transition-all">
                    {dashboardLabel}
                  </Link>
                  <Link href="/notifications" className="relative w-9 h-9 rounded-full bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] flex items-center justify-center text-[#D97706] hover:bg-[#FCD34D] transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border-[1.5px] transition-all ${dropdownOpen ? "border-[var(--primary)]" : "border-[var(--gray-200)] hover:border-[var(--primary)]"}`}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold flex items-center justify-center">{initials}</div>
                      )}
                      <span className={`text-[var(--gray-400)] text-[10px] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 top-[calc(100%+8px)] w-[200px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_8px_32px_rgba(13,31,60,0.12)] overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-[var(--gray-100)]">
                          <p className="text-[13px] font-bold text-[var(--navy)] truncate">{profile?.full_name ?? "İstifadəçi"}</p>
                          <p className="text-[11px] text-[var(--gray-400)] truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--navy)] hover:bg-[var(--gray-50)] transition-colors">
                            <span>👤</span> Profil
                          </Link>
                          <Link href="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--navy)] hover:bg-[var(--gray-50)] transition-colors">
                            <span>⚙️</span> Parametrlər
                          </Link>
                        </div>
                        <div className="border-t border-[var(--gray-100)] py-1">
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
                            <span>🚪</span> Çıxış
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border-[1.5px] border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                    Giriş
                  </Link>
                  <Link href="/worker/register" className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border-[1.5px] border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                    Usta ol
                  </Link>
                  <button onClick={handleSifarisVer} className="inline-flex items-center px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors">
                    Sifariş ver
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MOBİL — Profi.ru pattern ── */}
      <div className="flex md:hidden items-center justify-between px-4 h-[68px]">

        {/* Sol: Logo */}
        <Link href="/" className="font-serif text-2xl font-bold text-[var(--navy)] tracking-tight">
          Pronto<span className="text-[var(--primary)]">.</span>az
        </Link>

        {/* Sağ: 🔔 + Avatar + ☰ */}
        <div className="flex items-center gap-2">
          {!loading && user && (
            <>
              {/* Bildiriş */}
              <Link href="/notifications" className="relative w-9 h-9 rounded-full bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] flex items-center justify-center text-[#D97706]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                  : initials}
              </div>
            </>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-full hover:bg-[var(--gray-100)] transition-colors"
            aria-label="Menü"
          >
            <span className={`block w-[18px] h-[2px] bg-[var(--navy)] rounded-sm transition-all duration-200 origin-center ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-[18px] h-[2px] bg-[var(--navy)] rounded-sm transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-[18px] h-[2px] bg-[var(--navy)] rounded-sm transition-all duration-200 origin-center ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Mobil dropdown ── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[var(--border)] px-4 py-3 flex flex-col">

          {/* Nav linkləri */}
          {[
            { label: "Xidmətlər",     href: "/categories" },
            { label: "Ustalar",       href: "/workers" },
            { label: "Necə İşləyir", href: "#how-it-works" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-sm font-medium text-[var(--navy)] border-b border-[var(--gray-100)] hover:text-[var(--primary)] transition-colors"
            >
              {item.label}
            </Link>
          ))}

          <div className="mt-3 flex flex-col gap-2">
            {!loading && (
              user ? (
                <>
                  <button
                    onClick={handleSifarisVer}
                    className="w-full py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-semibold text-center"
                  >
                    Sifariş ver
                  </button>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-semibold text-center"
                  >
                    {dashboardLabel}
                  </Link>
                  <div className="border-t border-[var(--gray-100)] mt-1 pt-1">
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 text-sm text-[var(--navy)]">
                      <span>👤</span> Profil
                    </Link>
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 text-sm text-[var(--navy)]">
                      <span>⚙️</span> Parametrlər
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 py-2.5 text-sm text-red-500">
                      <span>🚪</span> Çıxış
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 rounded-full border-[1.5px] border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] text-center">
                    Giriş
                  </Link>
                  <Link href="/worker/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 rounded-full border-[1.5px] border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] text-center">
                    Usta ol
                  </Link>
                  <button onClick={handleSifarisVer} className="w-full py-2.5 rounded-full bg-[var(--primary)] text-white text-sm font-semibold">
                    Sifariş ver
                  </button>
                </>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
