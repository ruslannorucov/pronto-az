"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {open ? (
        <>
          <line x1="2" y1="2" x2="14" y2="14" stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="14" y1="2" x2="2"  y2="14" stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <line x1="2" y1="4"  x2="14" y2="4"  stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="2" y1="8"  x2="14" y2="8"  stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="2" y1="12" x2="14" y2="12" stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round"/>
        </>
      )}
    </svg>
  );
}

type NavbarVariant = "landing" | "app";
interface NavbarProps { variant?: NavbarVariant; }

export default function Navbar({ variant = "landing" }: NavbarProps) {
  const router = useRouter();
  const isApp = variant === "app";

  const [scrolled,        setScrolled]        = useState(false);
  const [user,            setUser]            = useState<any>(null);
  const [profile,         setProfile]         = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [dropdownOpen,    setDropdownOpen]    = useState(false);
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [isMobile,        setIsMobile]        = useState(false);
  const [workerVerified,  setWorkerVerified]  = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setDrawerOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, role, avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(p);

        // Worker verified statusunu yoxla
        if (p?.role === "worker") {
          const { data: wp } = await supabase
            .from("worker_profiles")
            .select("verified")
            .eq("user_id", user.id)
            .single();
          setWorkerVerified(wp?.verified ?? false);
        }

        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("read_at", null);
        setUnreadCount(count ?? 0);
      }
      setLoading(false);
    };
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setUnreadCount(0);
        setWorkerVerified(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSifarisVer = async (e: React.MouseEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    router.push(data.user ? "/request/new" : "/login");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setDrawerOpen(false);
    router.push("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // Worker üçün verified statusuna görə href və label
  const workerDashboardHref =
    workerVerified === true ? "/worker/dashboard" : "/worker/pending";

  const dashboardHref =
    profile?.role === "worker" ? workerDashboardHref :
    profile?.role === "admin"  ? "/admin" :
    "/dashboard";

  const dashboardLabel =
    profile?.role === "worker" ? "İş paneli" :
    profile?.role === "admin"  ? "Admin" :
    "Sifarişlərim";

  const navLinks = [
    { label: "Xidmətlər",    href: "/categories" },
    { label: "Ustalar",      href: "/workers" },
    { label: "Necə İşləyir", href: "#how-it-works" },
  ];

  const AvatarCircle = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const cls = size === "sm" ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-[12px]";
    return profile?.avatar_url ? (
      <img src={profile.avatar_url} className={`${cls} rounded-full object-cover`} alt="" />
    ) : (
      <div className={`${cls} rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center shrink-0`}>
        {initials}
      </div>
    );
  };

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full bg-white border-b border-[var(--border)] transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_12px_rgba(13,31,60,0.08)]" : ""
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-[64px] h-[68px] flex items-center gap-12">

          {/* ── Logo ── */}
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            className="font-serif text-2xl font-bold text-[var(--navy)] tracking-tight shrink-0"
          >
            Pronto<span className="text-[var(--primary)]">.</span>az
          </Link>

          {/* ── Desktop nav linklər — yalnız landing ── */}
          {!isApp && (
            <div className="hidden md:flex items-center gap-8 flex-1">
              {navLinks.map((item) => (
                <Link key={item.href} href={item.href}
                  className="text-sm font-medium text-[var(--gray-600)] hover:text-[var(--primary)] transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* ── Sağ tərəf ── */}
          {!loading && (
            <div className="flex items-center gap-2 ml-auto">

              {user ? (
                <>
                  {!isApp && (
                    <>
                      {/* Sifariş ver */}
                      <button onClick={handleSifarisVer}
                        className="inline-flex items-center px-3 md:px-4 py-2 rounded-full bg-[var(--primary)] text-white text-xs md:text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors">
                        Sifariş ver
                      </button>

                      {/* Sifarişlərim / İş paneli — yalnız desktop */}
                      <Link href={dashboardHref}
                        className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-light)] transition-all">
                        {dashboardLabel}
                        {/* Worker pending badge */}
                        {profile?.role === "worker" && workerVerified === false && (
                          <span style={{
                            fontSize: 9, fontWeight: 700,
                            background: "#FEF3C7", color: "#92400E",
                            padding: "1px 6px", borderRadius: 999,
                            marginLeft: 2,
                          }}>
                            Gözlənilir
                          </span>
                        )}
                      </Link>

                      {/* Bell — yalnız desktop */}
                      <Link href="/notifications"
                        className="relative hidden md:flex w-9 h-9 rounded-full bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] items-center justify-center text-[#D97706] hover:bg-[#FCD34D] transition-all">
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
                    </>
                  )}

                  {/* Bell — app variant */}
                  {isApp && (
                    <Link href="/notifications"
                      className="relative flex w-9 h-9 rounded-full bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] items-center justify-center text-[#D97706] hover:bg-[#FCD34D] transition-all">
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
                  )}

                  {/* Avatar dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => { setDropdownOpen(!dropdownOpen); setDrawerOpen(false); }}
                      className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border-[1.5px] transition-all ${
                        dropdownOpen ? "border-[var(--primary)]" : "border-[var(--gray-200)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <AvatarCircle size="sm" />
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                        className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="#94A3C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white rounded-2xl border border-[var(--border)] shadow-[0_8px_32px_rgba(13,31,60,0.12)] overflow-hidden z-50">

                        {/* İstifadəçi məlumatı */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--gray-100)]">
                          <AvatarCircle size="md" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[var(--navy)] truncate">
                              {profile?.full_name ?? "İstifadəçi"}
                            </p>
                            <p className="text-[11px] text-[var(--gray-400)] truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="py-1">
                          <Link href="/profile" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--navy)] hover:bg-[var(--gray-50)] transition-colors">
                            <span className="w-6 h-6 rounded-lg bg-[var(--gray-100)] flex items-center justify-center text-xs shrink-0">👤</span>
                            Profil
                          </Link>

                          <Link href="/settings" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--navy)] hover:bg-[var(--gray-50)] transition-colors">
                            <span className="w-6 h-6 rounded-lg bg-[var(--gray-100)] flex items-center justify-center text-xs shrink-0">⚙️</span>
                            Paramətrlər
                          </Link>

                          {/* Bildirişlər — yalnız landing */}
                          {!isApp && (
                            <Link href="/notifications" onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--navy)] hover:bg-[var(--gray-50)] transition-colors">
                              <span className="relative w-6 h-6 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-xs shrink-0">
                                🔔
                                {unreadCount > 0 && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </span>
                                )}
                              </span>
                              <span className="flex-1">Bildirişlər</span>
                              {unreadCount > 0 && (
                                <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-1.5 py-0.5 rounded-full">
                                  {unreadCount}
                                </span>
                              )}
                            </Link>
                          )}

                          {/* İş paneli / Sifarişlərim — worker üçün verified badge ilə */}
                          {!isApp && (
                            <Link href={dashboardHref} onClick={() => setDropdownOpen(false)}
                              className="md:hidden flex items-center gap-3 px-4 py-2.5 text-[13px] text-[var(--navy)] hover:bg-[var(--gray-50)] transition-colors">
                              <span className="w-6 h-6 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center text-xs shrink-0">
                                {profile?.role === "worker" ? "🔧" : "📋"}
                              </span>
                              <span className="flex-1">{dashboardLabel}</span>
                              {profile?.role === "worker" && workerVerified === false && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700,
                                  background: "#FEF3C7", color: "#92400E",
                                  padding: "1px 6px", borderRadius: 999,
                                }}>
                                  Gözlənilir
                                </span>
                              )}
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-[var(--gray-100)] py-1">
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
                            <span className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-xs shrink-0">🚪</span>
                            Çıxış
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hamburger — yalnız landing, yalnız mobile */}
                  {!isApp && isMobile && (
                    <button
                      onClick={() => { setDrawerOpen(!drawerOpen); setDropdownOpen(false); }}
                      className="w-9 h-9 rounded-full bg-[var(--gray-100)] flex items-center justify-center hover:bg-[var(--gray-200)] transition-colors shrink-0"
                      aria-label="Menyu"
                    >
                      <HamburgerIcon open={drawerOpen} />
                    </button>
                  )}
                </>
              ) : (
                /* ── LOGGED OUT ── */
                <>
                  <Link href="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border-[1.5px] border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                    Giriş
                  </Link>
                  <Link href="/worker/register"
                    className="hidden sm:inline-flex items-center px-4 py-2 rounded-full border-[1.5px] border-[var(--gray-200)] text-sm font-medium text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                    Usta ol
                  </Link>
                  <button onClick={handleSifarisVer}
                    className="inline-flex items-center px-3 md:px-4 py-2 rounded-full bg-[var(--primary)] text-white text-xs md:text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors">
                    Sifariş ver
                  </button>

                  {!isApp && isMobile && (
                    <button
                      onClick={() => setDrawerOpen(!drawerOpen)}
                      className="w-9 h-9 rounded-full bg-[var(--gray-100)] flex items-center justify-center hover:bg-[var(--gray-200)] transition-colors shrink-0"
                      aria-label="Menyu"
                    >
                      <HamburgerIcon open={drawerOpen} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Mobile Drawer ── */}
        {!isApp && (
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            drawerOpen ? "max-h-[400px] border-t border-[var(--gray-100)]" : "max-h-0"
          }`}>
            <div className="bg-white px-4 pt-2 pb-5">
              <div className="space-y-0.5">
                {user ? (
                  <>
                    {/* İş paneli / Sifarişlərim — highlighted */}
                    <Link href={dashboardHref} onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-semibold text-[var(--primary)] hover:bg-[var(--primary-bg)] transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center text-sm shrink-0">
                        {profile?.role === "worker" ? "🔧" : "📋"}
                      </span>
                      <span className="flex-1">{dashboardLabel}</span>
                      {profile?.role === "worker" && workerVerified === false && (
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          background: "#FEF3C7", color: "#92400E",
                          padding: "2px 8px", borderRadius: 999,
                        }}>
                          Gözlənilir
                        </span>
                      )}
                    </Link>

                    <div className="my-1.5 border-t border-[var(--gray-100)]" />

                    {navLinks.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
                        className="flex items-center px-3 py-3 rounded-xl text-[14px] font-medium text-[var(--text-2)] hover:bg-[var(--gray-50)] hover:text-[var(--navy)] transition-colors">
                        {item.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    {navLinks.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
                        className="flex items-center px-3 py-3 rounded-xl text-[14px] font-medium text-[var(--text-2)] hover:bg-[var(--gray-50)] hover:text-[var(--navy)] transition-colors">
                        {item.label}
                      </Link>
                    ))}
                    <div className="pt-2 border-t border-[var(--gray-100)] mt-2 grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={() => setDrawerOpen(false)}
                        className="flex items-center justify-center py-3 rounded-xl border-[1.5px] border-[var(--gray-200)] text-[13px] font-semibold text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                        Giriş
                      </Link>
                      <Link href="/worker/register" onClick={() => setDrawerOpen(false)}
                        className="flex items-center justify-center py-3 rounded-xl border-[1.5px] border-[var(--gray-200)] text-[13px] font-semibold text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                        Usta ol
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop */}
      {!isApp && drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-[rgba(13,31,60,0.25)]"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}
