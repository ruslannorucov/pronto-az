"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AppTopBarProps {
  userRole: "customer" | "worker";
  userName: string;
  userEmail: string;
  initials: string;
  unreadCount: number;
  pageTitle?: string; // "home" → logo, digər string → tab adı
}

export default function AppTopBar({
  userRole,
  userName,
  userEmail,
  initials,
  unreadCount,
  pageTitle = "home",
}: AppTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  const dashboardLink = userRole === "worker" ? "/worker/panel" : "/dashboard";

  const avatarGradient = userRole === "worker"
    ? "linear-gradient(135deg, #059669, #10B981)"
    : "linear-gradient(135deg, #3B82F6, #1B4FD8)";

  const showLogo = pageTitle === "home";

  return (
    <>
      <style>{`
        .topbar-bell {
          transition: background 0.15s, transform 0.15s;
        }
        .topbar-bell:hover {
          background: rgba(255,255,255,0.22) !important;
          transform: scale(1.05);
        }
        .topbar-avatar-btn {
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .topbar-avatar-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.3) !important;
        }
        .dd-item {
          transition: background 0.1s;
          cursor: pointer;
        }
        .dd-item:hover {
          background: #F0F4FF !important;
        }
      `}</style>

      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "linear-gradient(135deg, #0B1D3A 0%, #0F2D5C 50%, #0D2554 100%)",
        height: "60px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 2px 24px rgba(11,29,58,0.5)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>

        {/* Sol — Logo və ya Tab adı */}
        {showLogo ? (
          <Link href={dashboardLink} style={{
            textDecoration: "none", display: "flex", alignItems: "baseline", gap: "1px",
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "22px", fontWeight: 800,
              color: "white", letterSpacing: "-0.5px",
            }}>Pronto</span>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "22px", fontWeight: 800,
              background: "linear-gradient(135deg, #60A5FA, #93C5FD)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>.</span>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "22px", fontWeight: 800,
              color: "white", letterSpacing: "-0.5px",
            }}>az</span>
          </Link>
        ) : (
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "19px", fontWeight: 800,
            color: "white", letterSpacing: "-0.3px",
          }}>
            {pageTitle}
          </span>
        )}

        {/* Sağ tərəf — Tarixçə (şərti) + Bell + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

          {/* Tarixçə linki — yalnız Sifarişlərim tabında */}
          {pageTitle === "Sifarişlərim" && (
            <Link href="/dashboard/history" style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color: "rgba(255,255,255,0.65)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "5px 10px",
              textDecoration: "none",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Tarixçə
            </Link>
          )}

          {/* Bell */}
          <Link href="/notifications" style={{
            textDecoration: "none", position: "relative", display: "flex",
          }}>
            <div className="topbar-bell" style={{
              width: "38px", height: "38px", borderRadius: "12px",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"
                  stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: "2px", right: "2px",
                minWidth: "18px", height: "18px",
                background: "linear-gradient(135deg, #F87171, #EF4444)",
                borderRadius: "999px", fontSize: "9px", color: "white", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", border: "2px solid #0B1D3A", lineHeight: 1,
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className="topbar-avatar-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: "38px", height: "38px", borderRadius: "12px",
                background: avatarGradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 800, color: "white",
                border: "2px solid rgba(255,255,255,0.2)",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
              }}
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: "236px", background: "white",
                border: "1px solid #E4EAFB", borderRadius: "20px",
                boxShadow: "0 20px 60px rgba(11,29,58,0.20)",
                zIndex: 50, overflow: "hidden",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {/* Header */}
                <div style={{
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, #0B1D3A, #0F2D5C)",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "12px",
                    background: avatarGradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px", fontWeight: 800, color: "white", flexShrink: 0,
                  }}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "white", margin: 0, lineHeight: 1.3 }}>
                      {userName}
                    </p>
                    <p style={{
                      fontSize: "10px", color: "rgba(255,255,255,0.45)",
                      margin: "2px 0 0", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {userEmail}
                    </p>
                  </div>
                </div>

                {/* Menu items */}
                <div style={{ padding: "6px" }}>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)}
                    className="dd-item"
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 10px", textDecoration: "none", borderRadius: "12px",
                    }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "10px",
                      background: "#EFF4FF", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="#1B4FD8" strokeWidth="2"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: "13px", color: "#0D1F3C", fontWeight: 500 }}>Profil</span>
                  </Link>

                  <Link href="/settings" onClick={() => setDropdownOpen(false)}
                    className="dd-item"
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 10px", textDecoration: "none", borderRadius: "12px",
                    }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "10px",
                      background: "#F1F5FE", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="#4A5878" strokeWidth="2"/>
                        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#4A5878" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: "13px", color: "#0D1F3C", fontWeight: 500 }}>Parametrlər</span>
                  </Link>

                  <div style={{ height: "1px", background: "#F1F5FE", margin: "4px 2px" }} />

                  <button onClick={handleLogout}
                    className="dd-item"
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "9px 10px", width: "100%", borderRadius: "12px",
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "10px",
                      background: "#FEE2E2", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 17l5-5-5-5M21 12H9" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: "13px", color: "#E24B4A", fontWeight: 500 }}>Çıxış</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}