"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface WorkerStatus {
  verified:  boolean;
  is_active: boolean;
}

// Bu route-lar auth gate-dən keçir — login tələb edilmir
const PUBLIC_WORKER_ROUTES = [
  "/worker/register",
  "/worker/pending",
];

// ─── Pending UI ────────────────────────────────────────────────────────────────

function PendingScreen() {
  const STATUS_STEPS = [
    { label: "Qeydiyyat göndərildi",  icon: "✓", state: "done"    },
    { label: "Admin yoxlaması",        icon: "⏳", state: "active"  },
    { label: "Hesab aktivləşdirildi",  icon: "🎉", state: "pending" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
      position: "relative", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
      }} />

      <div style={{
        position: "relative", width: "100%", maxWidth: 440,
        background: "#fff", borderRadius: 24, padding: "36px 32px 32px",
        boxShadow: "0 24px 64px rgba(13,31,60,0.35)",
      }}>
        <div style={{ textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#0D1F3C" }}>
          Pronto<span style={{ color: "#1B4FD8" }}>.</span>az
        </div>

        <div style={{ textAlign: "center", margin: "24px 0 4px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "#FEF3C7", border: "2px solid #FCD34D",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto",
          }}>⏳</div>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#0D1F3C", textAlign: "center", margin: "14px 0 6px" }}>
          Hesabınız yoxlanılır
        </h1>
        <p style={{ fontSize: 13, color: "#94A3C0", textAlign: "center", margin: "0 0 28px", lineHeight: 1.6 }}>
          Admin tərəfindən növbəti <strong style={{ color: "#0D1F3C" }}>24–48 saat</strong> ərzində
          təsdiqlənəcəksiniz. Təsdiq sonrası WhatsApp və email bildirişi alacaqsınız.
        </p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3C0", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" as const }}>
            Qeydiyyat statusu
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {STATUS_STEPS.map((s, i) => (
              <div key={s.label}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    background:
                      s.state === "done"   ? "linear-gradient(135deg, #1B4FD8, #2563EB)" :
                      s.state === "active" ? "#FEF3C7" : "#F1F5FE",
                    border: s.state === "active" ? "1.5px solid #FCD34D" : "none",
                    color: s.state === "done" ? "#fff" : s.state === "active" ? "#92400E" : "#94A3C0",
                  }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: s.state === "done" ? "#0D1F3C" : s.state === "active" ? "#92400E" : "#94A3C0",
                    }}>{s.label}</div>
                    {s.state === "active" && (
                      <div style={{ fontSize: 11, color: "#94A3C0", marginTop: 1 }}>Orta müddət: 24–48 saat</div>
                    )}
                  </div>
                  {s.state === "done" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", background: "#D1FAE5", padding: "2px 8px", borderRadius: 999 }}>Tamamlandı</span>
                  )}
                  {s.state === "active" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "2px 8px", borderRadius: 999 }}>Gözlənilir</span>
                  )}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ width: 2, height: 18, background: s.state === "done" ? "#1B4FD8" : "#E4EAFB", margin: "4px 0 4px 17px" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#EFF4FF", border: "1px solid #BFCFFE", borderRadius: 12, padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💬</span>
          <div style={{ fontSize: 12, color: "#1E3A5F", lineHeight: 1.6 }}>
            Sualınız varsa <strong>+994 50 000 00 00</strong> nömrəsinə WhatsApp üzərindən yazın.
          </div>
        </div>

        <Link href="/" style={{
          display: "block", width: "100%", padding: 14, borderRadius: 14,
          background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
          color: "#fff", fontSize: 14, fontWeight: 600,
          textAlign: "center", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(27,79,216,0.28)",
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: "border-box" as const,
        }}>
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}

// ─── Blocked UI ────────────────────────────────────────────────────────────────

function BlockedScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: 440,
        background: "#fff", borderRadius: 24, padding: "36px 32px 32px",
        boxShadow: "0 24px 64px rgba(13,31,60,0.35)",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#0D1F3C", marginBottom: 24 }}>
          Pronto<span style={{ color: "#1B4FD8" }}>.</span>az
        </div>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚫</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#0D1F3C", margin: "0 0 8px" }}>
          Hesab deaktivdir
        </h1>
        <p style={{ fontSize: 13, color: "#94A3C0", lineHeight: 1.6, margin: "0 0 24px" }}>
          Hesabınız müvəqqəti olaraq deaktiv edilib. Ətraflı məlumat üçün bizimlə əlaqə saxlayın.
        </p>
        <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💬</span>
          <div style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.6 }}>
            Dəstək üçün <strong>+994 50 000 00 00</strong> nömrəsinə WhatsApp üzərindən yazın.
          </div>
        </div>
        <Link href="/" style={{
          display: "block", width: "100%", padding: 14, borderRadius: 14,
          background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
          color: "#fff", fontSize: 14, fontWeight: 600,
          textAlign: "center", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(27,79,216,0.28)",
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: "border-box" as const,
        }}>
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}

// ─── Loading UI ────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Yüklənir...</div>
    </div>
  );
}

// ─── Main layout ───────────────────────────────────────────────────────────────

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [status,  setStatus]  = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Public route-larda layout gate işləmir — birbaşa children render et
  const isPublicRoute = PUBLIC_WORKER_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    // Public route-larda Supabase sorğusu etmə
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Role yoxla
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "worker") {
        router.push("/dashboard");
        return;
      }

      // Worker status yoxla
      const { data: wp } = await supabase
        .from("worker_profiles")
        .select("verified, is_active")
        .eq("user_id", user.id)
        .single();

      if (!wp) {
        router.push("/worker/register");
        return;
      }

      setStatus({ verified: wp.verified, is_active: wp.is_active });
      setLoading(false);
    }

    checkStatus();
  }, [pathname]);

  // Public route — gate yoxdur
  if (isPublicRoute) return <>{children}</>;

  if (loading) return <LoadingScreen />;

  // Təsdiqlənməyib → pending ekranı
  if (!status?.verified) return <PendingScreen />;

  // Aktiv deyil → blok ekranı
  if (!status?.is_active) return <BlockedScreen />;

  // Hər şey okaysa → normal dashboard
  return <>{children}</>;
}
