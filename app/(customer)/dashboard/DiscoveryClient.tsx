"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name_az: string;
  icon: string;
  workerCount: number;
};

type ActiveOrder = {
  id: string;
  status: string;
  offerCount: number;
  categoryName: string;
  categoryIcon: string;
};

const bannerGradients = [
  "linear-gradient(135deg, #1B4FD8, #2563EB)",
  "linear-gradient(135deg, #B45309, #D97706)",
  "linear-gradient(135deg, #0A7A4F, #10B981)",
  "linear-gradient(135deg, #6D28D9, #7C3AED)",
  "linear-gradient(135deg, #C2410C, #EA580C)",
  "linear-gradient(135deg, #0369A1, #0EA5E9)",
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: "📋",
    title: "Sifariş ver",
    desc: "Kateqoriya seç, problemi təsvir et, ünvan və vaxt qeyd et",
    color: "#1B4FD8",
    bg: "#EFF4FF",
  },
  {
    step: "2",
    icon: "⚡",
    title: "Təklif al",
    desc: "15–45 dəqiqə ərzində yaxınlıqdakı ustalar təklif göndərir",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    step: "3",
    icon: "✅",
    title: "İşi bitir",
    desc: "Ən uyğun ustanı seç, işi təsdiqlə, ödənişi cash ver",
    color: "#059669",
    bg: "#F0FDF4",
  },
];

function formatId(id: string) {
  return "#PRN-" + id.slice(0, 4).toUpperCase();
}

export default function DiscoveryClient() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      // Auth yoxla
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") { router.push("/admin"); return; }
      setUserName(profile?.full_name?.split(" ")[0] ?? "");

      // Kateqoriyalar (yalnız parent)
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name_az, icon")
        .is("parent_id", null)
        .limit(6);

      // Hər kateqoriya üçün worker count
      const catsWithCount: Category[] = await Promise.all(
        (cats ?? []).map(async (cat: any) => {
          const { count } = await supabase
            .from("worker_profiles")
            .select("*", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("verified", true)
            .eq("is_active", true);
          return { ...cat, workerCount: count ?? 0 };
        })
      );
      setCategories(catsWithCount);
      setLoadingCats(false);

      // Ən vacib aktiv sifariş
      const { data: orders } = await supabase
        .from("job_requests")
        .select("id, status, category_id")
        .eq("customer_id", user.id)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (orders && orders.length > 0) {
        // Offer count-ları çək
        const ordersWithOffers = await Promise.all(
          orders.map(async (o: any) => {
            const { count } = await supabase
              .from("offers")
              .select("*", { count: "exact", head: true })
              .eq("job_id", o.id)
              .eq("status", "pending");
            return { ...o, offerCount: count ?? 0 };
          })
        );

        // Prioritet: in_progress > offerCount > open
        const sorted = ordersWithOffers.sort((a, b) => {
          if (a.status === "in_progress" && b.status !== "in_progress") return -1;
          if (a.offerCount > 0 && b.offerCount === 0) return -1;
          return 0;
        });

        const top = sorted[0];
        const catIds = [...new Set(orders.map((o: any) => o.category_id))];
        const { data: catData } = await supabase
          .from("categories")
          .select("id, name_az, icon")
          .in("id", catIds);
        const catMap: Record<string, any> = {};
        (catData ?? []).forEach((c: any) => { catMap[c.id] = c; });

        setActiveOrder({
          id: top.id,
          status: top.status,
          offerCount: top.offerCount,
          categoryName: catMap[top.category_id]?.name_az ?? "Xidmət",
          categoryIcon: catMap[top.category_id]?.icon ?? "🔧",
        });
      }
    };

    init();
  }, []);

  // Salam mətni
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Sabahınız xeyir" : hour < 18 ? "Günortanız xeyir" : "Axşamınız xeyir";

  // Aktiv sifariş banner mətni
  const getOrderBanner = () => {
    if (!activeOrder) return null;
    if (activeOrder.status === "in_progress") {
      return { text: "Usta yoldadır — izlə", color: "#059669", bg: "#F0FDF4", border: "#A7F3D0", dot: "#10B981", href: "/dashboard?tab=orders" };
    }
    if (activeOrder.offerCount > 0) {
      return { text: `${activeOrder.offerCount} yeni təklif gəldi — bax`, color: "#1B4FD8", bg: "#EFF4FF", border: "#BFCFFE", dot: "#1B4FD8", href: "/dashboard?tab=orders" };
    }
    return { text: "Usta axtarılır...", color: "#4A5878", bg: "#F8FAFF", border: "#E4EAFB", dot: "#94A3C0", href: "/dashboard?tab=orders" };
  };

  const banner = getOrderBanner();

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-8">

        {/* ── 1. Salam Banner ── */}
        <div style={{
          background: "linear-gradient(135deg, #0D1F3C 0%, #1B3A7A 60%, #1B4FD8 100%)",
          borderRadius: "0 0 28px 28px",
          padding: "20px 20px 24px",
          marginLeft: -16, marginRight: -16,
          position: "relative", overflow: "hidden",
          marginBottom: 20,
        }}>
          {/* Grid overlay */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>
              {greeting} 👋
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>
              {userName ? `Salam, ${userName}!` : "Xoş gəldiniz!"}
            </p>

            {/* Search / CTA bar */}
            <Link href="/request/new" style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fff", borderRadius: 16, padding: "11px 14px",
              textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v16M4 12h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C", fontFamily: "'DM Sans', sans-serif" }}>
                  Sifariş ver
                </p>
                <p style={{ fontSize: 11, color: "#94A3C0", fontFamily: "'DM Sans', sans-serif" }}>
                  Santexnik, elektrik, boyaqçı...
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#1B4FD8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* ── 2. Aktiv Sifariş Banner (varsa) ── */}
        {banner && activeOrder && (
          <Link href={banner.href} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: banner.bg,
            border: `1.5px solid ${banner.border}`,
            borderRadius: 14, padding: "12px 14px",
            textDecoration: "none", marginBottom: 20,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: banner.dot, flexShrink: 0,
              animation: "pulse-dot 1.5s ease-in-out infinite",
              display: "inline-block",
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: banner.color, fontFamily: "'DM Sans', sans-serif" }}>
                {activeOrder.categoryIcon} {activeOrder.categoryName} · {formatId(activeOrder.id)}
              </p>
              <p style={{ fontSize: 11, color: banner.color, opacity: 0.75, marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>
                {banner.text}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke={banner.color} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
        )}

        {/* ── 3. Kateqoriyalar ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0D1F3C", fontFamily: "'Playfair Display', serif" }}>
              Xidmətlər
            </p>
            <Link href="/categories" style={{ fontSize: 11, fontWeight: 600, color: "#1B4FD8", textDecoration: "none" }}>
              Hamısı →
            </Link>
          </div>

          {loadingCats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 88, borderRadius: 16, background: "#F1F5FE", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {categories.map((cat, idx) => (
                <Link
                  key={cat.id}
                  href={`/request/new?category=${cat.id}`}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "14px 8px", borderRadius: 16,
                    background: bannerGradients[idx % bannerGradients.length],
                    textDecoration: "none", position: "relative", overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  }}
                >
                  <span style={{ fontSize: 26 }}>{cat.icon}</span>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.2, fontFamily: "'DM Sans', sans-serif" }}>
                    {cat.name_az}
                  </p>
                  {cat.workerCount > 0 && (
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif" }}>
                      {cat.workerCount} usta
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. Necə işləyir ── */}
        <div style={{
          background: "linear-gradient(135deg, #0D1F3C, #162F6A)",
          borderRadius: 20, padding: "20px 16px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", marginBottom: 16, textAlign: "center" }}>
              Necə işləyir?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: step.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                      {step.step}. {step.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/request/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
              borderRadius: 14, padding: "13px", marginTop: 14,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(27,79,216,0.4)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
                İndi sifariş ver
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>
        </div>

      </div>
    </>
  );
}