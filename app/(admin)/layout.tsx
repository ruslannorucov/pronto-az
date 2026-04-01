"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0D1F3C",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Yüklənir...</div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 32px",
        maxWidth: 380, width: "100%", textAlign: "center",
        boxShadow: "0 24px 64px rgba(13,31,60,0.35)",
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 700, color: "#0D1F3C", marginBottom: 8,
        }}>
          Giriş qadağandır
        </h1>
        <p style={{ fontSize: 13, color: "#94A3C0", lineHeight: 1.6, marginBottom: 24 }}>
          Bu səhifəyə yalnız administrator daxil ola bilər.
        </p>
        <Link href="/" style={{
          display: "block", padding: "12px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
          color: "#fff", fontSize: 13, fontWeight: 600,
          textDecoration: "none", textAlign: "center",
        }}>
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login?redirect=/admin"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          setStatus("ok");
        } else {
          setStatus("denied");
        }
      } catch {
        setStatus("denied");
      }
    }
    check();
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "denied") return <AccessDenied />;
  return <>{children}</>;
}
