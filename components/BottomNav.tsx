"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

type NavVariant = "customer" | "worker";
interface BottomNavProps {
  variant: NavVariant;
  activeBadge?: number; // unread messages count
}

// ── Rəngli ikonlar ─────────────────────────────────────────────────────────────

function IcHome({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"
        fill="url(#hg)" stroke="url(#hg)" strokeWidth="0.5"/>
      <path d="M9 21V12h6v9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="hg" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6"/><stop offset="1" stopColor="#1B4FD8"/>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path d="M9 21V12h6v9M3 9l9-7 9 7v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"
        stroke="#B8C5D6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IcOrders({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#og)"/>
      <path d="M7 8h10M7 12h7M7 16h5" stroke="white" strokeWidth="1.9" strokeLinecap="round"/>
      <defs>
        <linearGradient id="og" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6"/><stop offset="1" stopColor="#6D28D9"/>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="#B8C5D6" strokeWidth="1.8"/>
      <path d="M7 8h10M7 12h7M7 16h5" stroke="#B8C5D6" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IcMessages({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        fill="url(#mg)"/>
      <path d="M8 10h8M8 14h5" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
      <defs>
        <linearGradient id="mg" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981"/><stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="#B8C5D6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 10h8M8 14h5" stroke="#B8C5D6" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

function IcJobs({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7.5" fill="url(#jg)"/>
      <path d="M21 21l-4.35-4.35" stroke="url(#jg2)" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M8 11a3 3 0 013-3" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.7"/>
      <defs>
        <linearGradient id="jg" x1="3.5" y1="3.5" x2="18.5" y2="18.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981"/><stop offset="1" stopColor="#059669"/>
        </linearGradient>
        <linearGradient id="jg2" x1="16" y1="16" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981"/><stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="#B8C5D6" strokeWidth="1.8"/>
      <path d="M21 21l-4.35-4.35" stroke="#B8C5D6" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IcSchedule({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" fill="url(#scg)"/>
      <path d="M8 2v3M16 2v3M3 9h18" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="14" r="1.2" fill="white"/>
      <circle cx="12" cy="14" r="1.2" fill="white"/>
      <circle cx="16" cy="14" r="1.2" fill="white"/>
      <circle cx="8" cy="18" r="1.2" fill="white" opacity="0.6"/>
      <circle cx="12" cy="18" r="1.2" fill="white" opacity="0.6"/>
      <defs>
        <linearGradient id="scg" x1="3" y1="4" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24"/><stop offset="1" stopColor="#F59E0B"/>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="#B8C5D6" strokeWidth="1.8"/>
      <path d="M8 2v3M16 2v3M3 9h18" stroke="#B8C5D6" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="8" cy="14" r="1.2" fill="#B8C5D6"/>
      <circle cx="12" cy="14" r="1.2" fill="#B8C5D6"/>
      <circle cx="16" cy="14" r="1.2" fill="#B8C5D6"/>
    </svg>
  );
}

function IcEarnings({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1.5" fill="#60A5FA"/>
      <rect x="10" y="7" width="4" height="14" rx="1.5" fill="#3B82F6"/>
      <rect x="17" y="3" width="4" height="18" rx="1.5" fill="#1B4FD8"/>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1.5" stroke="#B8C5D6" strokeWidth="1.8"/>
      <rect x="10" y="7" width="4" height="14" rx="1.5" stroke="#B8C5D6" strokeWidth="1.8"/>
      <rect x="17" y="3" width="4" height="18" rx="1.5" stroke="#B8C5D6" strokeWidth="1.8"/>
    </svg>
  );
}

function IcUser({ active }: { active: boolean }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" fill="url(#ug)"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="url(#ug2)" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="ug" x1="8" y1="4" x2="16" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F472B6"/><stop offset="1" stopColor="#EC4899"/>
        </linearGradient>
        <linearGradient id="ug2" x1="4" y1="13" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F472B6"/><stop offset="1" stopColor="#EC4899"/>
        </linearGradient>
      </defs>
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#B8C5D6" strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#B8C5D6" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ── Tab label rəngləri (aktiv halda) ──────────────────────────────────────────
const activeColors: Record<string, string> = {
  home:     "#3B82F6",
  orders:   "#7C3AED",
  messages: "#10B981",
  jobs:     "#059669",
  schedule: "#F59E0B",
  earnings: "#1B4FD8",
  profile:  "#EC4899",
};

const customerTabs = [
  { key: "home",     href: "/dashboard",     label: "Əsas",       Icon: IcHome     },
  { key: "orders",   href: "/orders",         label: "Sifarişlər", Icon: IcOrders   },
  { key: "fab",      href: "/request/new",    label: "Sifariş ver" },
  { key: "messages", href: "/messages",       label: "Mesajlar",   Icon: IcMessages },
  { key: "profile",  href: "/profile",        label: "Profil",     Icon: IcUser     },
];

const workerTabs = [
  { key: "jobs",     href: "/worker/panel",                    label: "İşlər",   Icon: IcJobs     },
  { key: "schedule", href: "/worker/panel?tab=schedule",       label: "Cədvəl",  Icon: IcSchedule },
  { key: "fab",      href: "/worker/panel",                    label: "Yeni iş"  },
  { key: "earnings", href: "/worker/panel?tab=earnings",       label: "Qazanc",  Icon: IcEarnings },
  { key: "profile",  href: "/profile",                         label: "Profil",  Icon: IcUser     },
];

export default function BottomNav({ variant, activeBadge = 0 }: BottomNavProps) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const currentTab   = searchParams.get("tab");
  const tabs = variant === "customer" ? customerTabs : workerTabs;

  const isActive = (key: string): boolean => {
    if (key === "fab")      return false;
    if (key === "profile")  return pathname === "/profile";
    if (key === "home")     return pathname === "/dashboard" && !currentTab;
    if (key === "orders")   return pathname === "/orders" || (pathname === "/dashboard" && currentTab === "orders");
    if (key === "messages") return pathname === "/messages";
    if (key === "jobs")     return pathname === "/worker/panel" && !currentTab;
    if (key === "schedule") return pathname === "/worker/panel" && currentTab === "schedule";
    if (key === "earnings") return pathname === "/worker/panel" && currentTab === "earnings";
    return false;
  };

  return (
    <>
      <style>{`
        @keyframes fab-glow {
          0%, 100% { box-shadow: 0 8px 24px rgba(27,79,216,0.5), 0 0 0 0 rgba(27,79,216,0.35); }
          50%       { box-shadow: 0 8px 24px rgba(27,79,216,0.5), 0 0 0 8px rgba(27,79,216,0); }
        }
        .bnav-tab:active  { transform: scale(0.85); }
        .bnav-fab:active  { transform: scale(0.90) translateY(-1px) !important; }
      `}</style>

      {/* Spacer */}
      <div style={{ height: "82px" }} />

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(255,255,255,0.98)",
        backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
        borderTop: "1px solid rgba(200,215,240,0.6)",
        height: "82px",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex", alignItems: "center",
        padding: "0 8px",
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 -8px 32px rgba(13,31,60,0.08)",
      }}>
        {tabs.map((tab) => {
          const active     = isActive(tab.key);
          const showBadge  = tab.key === "messages" && activeBadge > 0;
          const labelColor = active ? (activeColors[tab.key] ?? "#1B4FD8") : "#9BABB8";

          // ── FAB ──
          if (!tab.Icon) {
            return (
              <Link key={tab.key} href={tab.href}
                className="bnav-fab"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "5px", flex: 1, textDecoration: "none",
                  transition: "transform 0.15s",
                }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "20px",
                  background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginTop: "-24px",
                  animation: "fab-glow 2.5s ease-in-out infinite",
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v16M4 12h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: "10px", color: "#9BABB8", fontWeight: 500, lineHeight: 1 }}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          const IconComp = tab.Icon;
          return (
            <Link key={tab.key} href={tab.href}
              className="bnav-tab"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "5px", flex: 1, textDecoration: "none",
                padding: "8px 2px 4px", position: "relative",
              }}>

              {/* Aktiv: rəngli pill */}
              <div style={{
                width: "46px", height: "34px", borderRadius: "14px",
                background: active
                  ? `${activeColors[tab.key] ?? "#1B4FD8"}18`
                  : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                transition: "background 0.2s",
              }}>
                <IconComp active={active} />

                {/* Oxunmamış mesaj badge */}
                {showBadge && (
                  <span style={{
                    position: "absolute", top: "-2px", right: "0px",
                    minWidth: "18px", height: "18px",
                    background: "linear-gradient(135deg, #F87171, #EF4444)",
                    borderRadius: "999px", fontSize: "9px", color: "white", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px", border: "2px solid white",
                  }}>
                    {activeBadge}
                  </span>
                )}
              </div>

              <span style={{
                fontSize: "10px", lineHeight: 1,
                color: labelColor,
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