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
        const ini =
          parts.length >= 2
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
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "0.5px solid #E4EAFB",
      height: "56px", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 16px",
      fontFamily: "'DM Sans', sans-serif",
    }}>

      {/* Logo */}
      <Link href={dashboardLink} style={{ textDecoration: "none", display: "flex", alignItems: "baseline" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#0D1F3C", letterSpacing: "-0.3px" }}>Pronto</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#1B4FD8" }}>.</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#0D1F3C", letterSpacing: "-0.3px" }}>az</span>
      </Link>

      {/* Sağ: Bell + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Bell */}
        <Link href="/notifications" style={{ textDecoration: "none", position: "relative", display: "flex" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "12px",
            background: "#F1F5FE", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#0D1F3C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: "4px", right: "4px",
              minWidth: "16px", height: "16px", background: "#E8281A",
              borderRadius: "999px", fontSize: "9px", color: "white", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px", border: "2px solid white", lineHeight: 1,
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar + Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 600, color: "white",
              border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: "220px", background: "white",
              border: "0.5px solid #E4EAFB", borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(13,31,60,0.12)",
              zIndex: 50, overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
            }}>
              {/* İstifadəçi məlumatı */}
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #F1F5FE" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#0D1F3C", margin: 0 }}>
                  {userName || "İstifadəçi"}
                </p>
                {userEmail && (
                  <p style={{ fontSize: "11px", color: "#94A3C0", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userEmail}
                  </p>
                )}
              </div>

              <Link href="/profile" onClick={() => setDropdownOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", textDecoration: "none", borderBottom: "0.5px solid #F1F5FE" }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: "#F1F5FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</span>
                <span style={{ fontSize: "13px", color: "#0D1F3C" }}>Profil</span>
              </Link>

              <Link href="/settings" onClick={() => setDropdownOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", textDecoration: "none", borderBottom: "0.5px solid #F1F5FE" }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: "#F1F5FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⚙️</span>
                <span style={{ fontSize: "13px", color: "#0D1F3C" }}>Parametrlər</span>
              </Link>

              <button onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "11px 14px", width: "100%",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{ width: 24, height: 24, borderRadius: 8, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🚪</span>
                <span style={{ fontSize: "13px", color: "#E24B4A" }}>Çıxış</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
