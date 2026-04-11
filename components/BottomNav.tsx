"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavVariant = "customer" | "worker";

interface BottomNavProps {
  variant: NavVariant;
}

// ── SVG ikonlar ───────────────────────────────────────────────────────────────

function IconHome({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 21V12h6v9M3 9l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconOrders({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={c} strokeWidth="1.8"/>
      <path d="M7 8h10M7 12h7M7 16h5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/>
      <path d="M12 7v5l3 3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSearch({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke={c} strokeWidth="1.8"/>
      <path d="M21 21l-4.35-4.35" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconBolt({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke={c} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconStats({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke={c} strokeWidth="1.8"/>
      <rect x="10" y="7" width="4" height="14" rx="1" stroke={c} strokeWidth="1.8"/>
      <rect x="17" y="3" width="4" height="18" rx="1" stroke={c} strokeWidth="1.8"/>
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  const c = active ? "#1B4FD8" : "#94A3C0";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function FabPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

// ── Tab konfiqurasiyaları ─────────────────────────────────────────────────────

const customerTabs = [
  { key: "home",    href: "/dashboard",         label: "Əsas",      icon: IconHome    },
  { key: "orders",  href: "/dashboard",          label: "Sifarişlər", icon: IconOrders, matchQuery: "tab=active" },
  { key: "fab",     href: "/request/new",        label: "Sifariş ver", isFab: true      },
  { key: "history", href: "/dashboard/history",  label: "Tarixçə",   icon: IconHistory },
  { key: "profile", href: "/profile",            label: "Profil",    icon: IconUser    },
];

const workerTabs = [
  { key: "jobs",    href: "/worker/panel",        label: "İşlər",    icon: IconSearch  },
  { key: "active",  href: "/worker/panel",        label: "Aktiv",    icon: IconBolt, matchQuery: "tab=active" },
  { key: "fab",     href: "/worker/panel",        label: "Yeni iş",  isFab: true, matchQuery: "tab=new" },
  { key: "history", href: "/worker/panel",        label: "Keçmiş",   icon: IconStats, matchQuery: "tab=history" },
  { key: "profile", href: "/profile",             label: "Profil",   icon: IconUser    },
];

// ── Komponent ─────────────────────────────────────────────────────────────────

export default function BottomNav({ variant }: BottomNavProps) {
  const pathname = usePathname();
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

  const isActive = (tab: typeof customerTabs[0]) => {
    if (tab.key === "fab") return false;
    // Profil
    if (tab.href === "/profile") return pathname === "/profile";
    // Tarixçə
    if (tab.href === "/dashboard/history") return pathname.includes("/history");
    // Əsas (customer) — yalnız /dashboard, query yoxdur
    if (tab.key === "home" && variant === "customer")
      return pathname === "/dashboard" && !window?.location?.search?.includes("tab=");
    // Worker işlər — yalnız /worker/panel, query yoxdur
    if (tab.key === "jobs")
      return pathname === "/worker/panel" && !window?.location?.search?.includes("tab=");
    return false;
  };

  return (
    <>
      {/* Content-un altına düşməsin deyə spacer */}
      <div style={{ height: "72px" }} />

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid #E4EAFB",
        height: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex", alignItems: "center", justifyContent: "space-around",
        padding: "0 4px",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {tabs.map((tab) => {
          const active = isActive(tab as any);
          const showBadge = tab.key === "active" && activeBadge > 0;

          // ── FAB (ortadakı böyük düymə) ──
          if (tab.isFab) {
            return (
              <Link key={tab.key} href={tab.href}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1, textDecoration: "none", paddingBottom: "2px" }}>
                <div style={{
                  width: "50px", height: "50px", borderRadius: "16px",
                  background: "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: "-16px",
                  boxShadow: "0 6px 20px rgba(27,79,216,0.40)",
                }}>
                  <FabPlus />
                </div>
                <span style={{ fontSize: "9.5px", color: "#94A3C0", fontWeight: 500 }}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          // ── Normal tab ──
          const IconComp = tab.icon!;
          return (
            <Link key={tab.key} href={tab.href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                flex: 1, textDecoration: "none", padding: "6px 2px 2px", position: "relative",
              }}>

              {/* Aktiv xətt — yuxarıda */}
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: "20px", height: "2.5px",
                  background: "#1B4FD8", borderRadius: "0 0 3px 3px",
                }} />
              )}

              {/* İkon + badge */}
              <div style={{ position: "relative", display: "inline-flex" }}>
                <IconComp active={active} />
                {showBadge && (
                  <span style={{
                    position: "absolute", top: "-4px", right: "-6px",
                    minWidth: "16px", height: "16px",
                    background: "#E8281A", borderRadius: "999px",
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
                fontSize: "9.5px",
                color: active ? "#1B4FD8" : "#94A3C0",
                fontWeight: active ? 600 : 500,
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
