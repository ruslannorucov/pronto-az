"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  job_id: string | null;
  read_at: string | null;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)     return "İndicə";
  if (diff < 3600)   return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} saat əvvəl`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün əvvəl`;
  return new Date(dateStr).toLocaleDateString("az-AZ", { day: "numeric", month: "long" });
}

function notifIcon(type: string): { icon: string; bg: string; color: string } {
  switch (type) {
    case "offer_received":   return { icon: "💼", bg: "#EFF4FF", color: "#1B4FD8" };
    case "offer_accepted":   return { icon: "✅", bg: "#D1FAE5", color: "#059669" };
    case "offer_rejected":   return { icon: "✕",  bg: "#FEE2E2", color: "#DC2626" };
    case "payment_held":     return { icon: "💳", bg: "#FEF3C7", color: "#D97706" };
    case "payment_released": return { icon: "💰", bg: "#D1FAE5", color: "#059669" };
    case "job_completed":    return { icon: "🏁", bg: "#F0FDF4", color: "#059669" };
    case "worker_en_route":  return { icon: "🚶", bg: "#EFF4FF", color: "#1B4FD8" };
    case "new_request":      return { icon: "📋", bg: "#EFF4FF", color: "#1B4FD8" };
    default:                 return { icon: "🔔", bg: "#F1F5FE", color: "#4A5878" };
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div style={{ display: "flex", gap: 12, padding: "14px 16px", background: "#fff", borderRadius: 16, border: "1px solid var(--border)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ width: "55%", height: 13, borderRadius: 6, background: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ width: "80%", height: 11, borderRadius: 6, background: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      </div>
    </div>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotifCard({ notif, onClick }: { notif: Notification; onClick: (n: Notification) => void }) {
  const { icon, bg, color } = notifIcon(notif.type);
  const isUnread = !notif.read_at;

  return (
    <button
      onClick={() => onClick(notif)}
      style={{
        display: "flex", gap: 12, padding: "14px 16px",
        background: isUnread ? "#F8FAFF" : "#fff",
        borderRadius: 16,
        border: isUnread ? "1.5px solid var(--primary-mid)" : "1px solid var(--border)",
        width: "100%", textAlign: "left", cursor: notif.job_id ? "pointer" : "default",
        fontFamily: "inherit", position: "relative",
        boxShadow: isUnread ? "0 2px 12px rgba(27,79,216,0.07)" : "none",
        animation: "fadeUp 0.3s ease both",
      }}
    >
      {/* İkon */}
      <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        {icon}
      </div>

      {/* Mətn */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: "var(--navy)", margin: 0, lineHeight: 1.3 }}>
            {notif.title}
          </p>
          {isUnread && (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 3 }} />
          )}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-2)", margin: "0 0 5px", lineHeight: 1.5 }}>
          {notif.body}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-3)", margin: 0 }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Sifariş linki oxu */}
      {notif.job_id && (
        <div style={{ alignSelf: "center", color: color, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, job_id, read_at, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data ?? []);

      const unreadIds = (data ?? [])
        .filter((n: Notification) => !n.read_at)
        .map((n: Notification) => n.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleNotifClick = (notif: Notification) => {
    if (!notif.job_id) return;
    router.push(`/dashboard?tab=orders`);
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const todayNotifs = notifications.filter(n =>
    (Date.now() - new Date(n.created_at).getTime()) / 86400000 < 1
  );
  const olderNotifs = notifications.filter(n =>
    (Date.now() - new Date(n.created_at).getTime()) / 86400000 >= 1
  );

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 100 }}>

        {/* ── HEADER — sticky, tam yuxarıdan başlayır ── */}
        <div style={{
          background: "linear-gradient(135deg,#0D1F3C 0%,#1B3A7A 60%,#1B4FD8 100%)",
          padding: "14px 16px 18px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          overflow: "hidden",
        }}>
          {/* Grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(27,79,216,0.07) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>

            {/* ✕ Bağla düyməsi */}
            <button
              onClick={() => router.back()}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Başlıq + alt mətn */}
            <div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                Bildirişlər
              </p>
              {!loading && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                  {unreadCount > 0
                    ? `${unreadCount} oxunmamış bildiriş`
                    : notifications.length > 0 ? "Hamısı oxunub" : "Bildiriş yoxdur"
                  }
                </p>
              )}
            </div>

          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: "16px", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4].map(i => <SkeletonItem key={i} />)}
            </div>
          )}

          {/* Boş state */}
          {!loading && notifications.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid var(--border)", padding: "48px 24px", textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Bildiriş yoxdur
              </p>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                Yeni sifariş, təklif və ya ödəniş bildirişləri burada görünəcək
              </p>
            </div>
          )}

          {/* Bu gün */}
          {!loading && todayNotifs.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                Bu gün
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {todayNotifs.map((n, i) => (
                  <div key={n.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <NotifCard notif={n} onClick={handleNotifClick} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Əvvəlki */}
          {!loading && olderNotifs.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                Əvvəlki
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {olderNotifs.map((n, i) => (
                  <div key={n.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <NotifCard notif={n} onClick={handleNotifClick} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}