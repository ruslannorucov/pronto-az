"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AppTopBarProps {
  userRole?: "customer" | "worker";
}

export default function AppTopBar({ userRole }: AppTopBarProps) {
  const [unreadCount, setUnreadCount]   = useState(0);
  const [initials, setInitials]         = useState("?");
  const [userName, setUserName]         = useState("");
  const [userEmail, setUserEmail]       = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) {
        setUserName(profile.full_name);
        const parts = profile.full_name.trim().split(" ");
        const ini = parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : parts[0].substring(0, 2).toUpperCase();
        setInitials(ini);
      }
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      setUnreadCount(count ?? 0);
    };
    init();
  }, []);

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

  return (
    <>
      <style>{`
        .topbar-bell:hover { background: rgba(255,255,255,0.2) !important; }
        .topbar-avatar:hover { transform: scale(1.05); box-shadow: 0 0 0 3px rgba(255,255,255,0.3) !important; }
        .topbar-avatar { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .dropdown-item:hover { background: #F8FAFF !important; }
        .dropdown-item { transition: background 0.12s ease; }
      `}</style>

      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "linear-gradient(135deg, #0D1F3C 0%, #1B3A6B 100%)",
        height: "58px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        fontFamily: "'DM Sans', sans-serif",
        boxShadow: "0 2px 20px rgba(13,31,60,0.25)",
      }}>

        {/* Logo */}
        <Link href={dashboardLink} style={{ textDecoration: "none", display: "flex", alignItems: "baseline" }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "21px", fontWeight: 700,
            color: "white", letterSpacing: "-0.3px",
          }}>Pronto</span>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "21px", fontWeight: 700,
            color: "#60A5FA",
          }}>.</span>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "21px", fontWeight: 700,
            color: "white", letterSpacing: "-0.3px",
          }}>az</span>
        </Link>

        {/* Sağ: Bell + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

          {/* Bell */}
          <Link href="/notifications" style={{ textDecoration: "none", position: "relative", display: "flex" }}>
            <div className="topbar-bell" style={{
              width: "38px", height: "38px", borderRadius: "12px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s ease",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: "3px", right: "3px",
                minWidth: "17px", height: "17px",
                background: "#F87171",
                borderRadius: "999px", fontSize: "9px", color: "white", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", border: "2px solid #0D1F3C", lineHeight: 1,
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar + Dropdown */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className="topbar-avatar"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6, #1B4FD8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, color: "white",
                border: "2px solid rgba(255,255,255,0.25)",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                width: "230px", background: "white",
                border: "1px solid #E4EAFB", borderRadius: "18px",
                boxShadow: "0 16px 48px rgba(13,31,60,0.18)",
                zIndex: 50, overflow: "hidden",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {/* İstifadəçi məlumatı */}
                <div style={{
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, #0D1F3C, #1B3A6B)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "linear-gradient(135deg, #3B82F6, #1B4FD8)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 700, color: "white",
                      border: "2px solid rgba(255,255,255,0.2)",
                      flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "white", margin: 0, lineHeight: 1.3 }}>
                        {userName || "İstifadəçi"}
                      </p>
                      {userEmail && (
                        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {userEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "6px" }}>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)}
                    className="dropdown-item"
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 10px", textDecoration: "none", borderRadius: "10px" }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 9, background: "#EFF4FF",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                    }}>👤</span>
                    <span style={{ fontSize: "13px", color: "#0D1F3C", fontWeight: 500 }}>Profil</span>
                  </Link>

                  <Link href="/settings" onClick={() => setDropdownOpen(false)}
                    className="dropdown-item"
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 10px", textDecoration: "none", borderRadius: "10px" }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 9, background: "#F1F5FE",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                    }}>⚙️</span>
                    <span style={{ fontSize: "13px", color: "#0D1F3C", fontWeight: 500 }}>Parametrlər</span>
                  </Link>

                  <div style={{ height: "1px", background: "#F1F5FE", margin: "4px 0" }} />

                  <button onClick={handleLogout}
                    className="dropdown-item"
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 10px", width: "100%", borderRadius: "10px",
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 9, background: "#FEE2E2",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                    }}>🚪</span>
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
