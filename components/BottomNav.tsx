"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavVariant = "customer" | "worker";
interface BottomNavProps { variant: NavVariant; }

// ── SVG ikonlar ───────────────────────────────────────────────────────────────

function IconHome({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" fill="#1B4FD8" fillOpacity="0.15" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 21V12h6v9M3 9l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke="#94A3C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconOrders({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#1B4FD8" fillOpacity="0.12" stroke="#1B4FD8" strokeWidth="1.8"/>
      <path d="M7 8h10M7 12h7M7 16h5" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#94A3C0" strokeWidth="1.8"/>
      <path d="M7 8h10M7 12h7M7 16h5" stroke="#94A3C0" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="#1B4FD8" fillOpacity="0.12" stroke="#1B4FD8" strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#94A3C0" strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke="#94A3C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" fill="#1B4FD8" fillOpacity="0.12" stroke="#1B4FD8" strokeWidth="1.8"/>
      <path d="M21 21l-4.35-4.35" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="#94A3C0" strokeWidth="1.8"/>
      <path d="M21 21l-4.35-4.35" stroke="#94A3C0" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconBolt({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#1B4FD8" fillOpacity="0.15" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="#94A3C0" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconStats({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" fill="#1B4FD8" fillOpacity="0.15" stroke="#1B4FD8" strokeWidth="1.8"/>
      <rect x="10" y="7" width="4" height="14" rx="1" fill="#1B4FD8" fillOpacity="0.15" stroke="#1B4FD8" strokeWidth="1.8"/>
      <rect x="17" y="3" width="4" height="18" rx="1" fill="#1B4FD8" fillOpacity="0.15" stroke="#1B4FD8" strokeWidth="1.8"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke="#94A3C0" strokeWidth="1.8"/>
      <rect x="10" y="7" width="4" height="14" rx="1" stroke="#94A3C0" strokeWidth="1.8"/>
      <rect x="17" y="3" width="4" height="18" rx="1" stroke="#94A3C0" strokeWidth="1.8"/>
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="#1B4FD8" fillOpacity="0.15" stroke="#1B4FD8" strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1B4FD8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#94A3C0" strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#94A3C0" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ── Tab konfiqurasiyaları ─────────────────────────────────────────────────────

const customerTabs = [
  { key: "home",    href: "/dashboard",        label: "Əsas",       icon: IconHome    },
  { key: "orders",  href: "/dashboard",         label: "Sifarişlər", icon: IconOrders  },
  { key: "fab",     href: "/request/new",       label: "Sifariş ver", isFab: true      },
  { key: "history", href: "/dashboard/history", label: "Tarixçə",    icon: IconHistory },
  { key: "profile", href: "/profile",           label: "Profil",     icon: IconUser    },
];

const workerTabs = [
  { key: "jobs",    href: "/worker/panel",      label: "İşlər",    icon: IconSearch  },
  { key: "active",  href: "/worker/panel",      label: "Aktiv",    icon: IconBolt    },
  { key: "fab",     href: "/worker/panel",      label: "Yeni iş",  isFab: true       },
  { key: "history", href: "/worker/panel",      label: "Keçmiş",   icon: IconStats   },
  { key: "profile", href: "/profile",           label: "Profil",   icon: IconUser    },
];

// ── Komponent ─────────────────────────────────────────────────────────────────

export default function BottomNav({ variant }: BottomNavProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [activeBadge, setActiveBadge] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (variant !== "worker") return;
    const fetchBadge = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("worker_id", user.id)
        .eq("status", "pending");
      setActiveBadge(count ?? 0);
    };
    fetchBadge();
  }, [variant]);

  const tabs = variant === "customer" ? customerTabs : workerTabs;
  const currentTab = searchParams.get("tab");

  const isActive = (tab: typeof customerTabs[0]): boolean => {
    if (tab.key === "fab")     return false;
    if (tab.key === "profile") return pathname === "/profile";
    if (tab.key === "history" && variant === "customer") return pathname.includes("/history");
    if (tab.key === "history" && variant === "worker")   return pathname === "/worker/panel" && currentTab === "history";
    if (tab.key === "active")  return pathname === "/worker/panel" && currentTab === "active";
    if (tab.key === "home")    return pathname === "/dashboard" && !currentTab;
    if (tab.key === "orders")  return pathname === "/dashboard" && currentTab === "active";
    if (tab.key === "jobs")    return pathname === "/worker/panel" && !currentTab;
    return false;
  };

  return (
    <>
      <style>{`
        @keyframes fab-pulse {
          0%   { box-shadow: 0 6px 20px rgba(27,79,216,0.45), 0 0 0 0 rgba(27,79,216,0.3); }
          70%  { box-shadow: 0 6px 20px rgba(27,79,216,0.45), 0 0 0 10px rgba(27,79,216,0); }
          100% { box-shadow: 0 6px 20px rgba(27,79,216,0.45), 0 0 0 0 rgba(27,79,216,0); }
        }
        .bnav-tab { transition: transform 0.12s ease; }
        .bnav-tab:active { transform: scale(0.88); }
        .bnav-fab:active { transform: scale(0.92) translateY(-2px) !important; }
      `}</style>

      <div style={{ height: "80px" }} />

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(228,234,251,0.8)",
        height: "80px",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex", alignItems: "center",
        padding: "0 6px",
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 -4px 24px rgba(13,31,60,0.07)",
      }}>
        {tabs.map((tab) => {
          const active    = isActive(tab as any);
          const showBadge = tab.key === "active" && activeBadge > 0;

          // ── FAB ──
          if (tab.isFab) {
            return (
              <Link key={tab.key} href={tab.href}
                className="bnav-fab"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "5px", flex: 1, textDecoration: "none",
                  transition: "transform 0.15s ease",
                }}>
                <div style={{
                  width: "54px", height: "54px", borderRadius: "18px",
                  background: "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: "-22px",
                  animation: "fab-pulse 2.5s ease-in-out infinite",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: "10px", color: "#94A3C0", fontWeight: 500, lineHeight: 1 }}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          // ── Normal tab ──
          const IconComp = tab.icon!;
          return (
            <Link key={tab.key} href={tab.href}
              className="bnav-tab"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "5px", flex: 1, textDecoration: "none",
                padding: "8px 2px 4px", position: "relative",
              }}>

              {/* Aktiv: pill background ikonun arxasında */}
              <div style={{
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "44px", height: "32px",
                borderRadius: "12px",
                background: active ? "rgba(27,79,216,0.10)" : "transparent",
                transition: "background 0.2s ease",
              }}>
                <IconComp active={active} />

                {showBadge && (
                  <span style={{
                    position: "absolute", top: "-3px", right: "-2px",
                    minWidth: "17px", height: "17px",
                    background: "#F87171", borderRadius: "999px",
                    fontSize: "9px", color: "white", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px", border: "1.5px solid white",
                  }}>
                    {activeBadge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: "10px", lineHeight: 1,
                color: active ? "#1B4FD8" : "#94A3C0",
                fontWeight: active ? 700 : 500,
                transition: "color 0.15s",
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
