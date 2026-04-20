"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryOrder = {
  id: string;
  status: "done" | "cancelled";
  cancel_reason: string | null;
  created_at: string;
  cancelled_at: string | null;
  description: string | null;
  address: string | null;
  category: { name_az: string; icon: string } | null;
  workerName: string | null;
  price: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatId(id: string): string {
  return "#PRN-" + id.slice(0, 4).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("az-AZ", { day: "numeric", month: "long", year: "numeric" });
}

function cancelReasonLabel(reason: string | null): string {
  switch (reason) {
    case "no_offers":      return "Təklif gəlmədi";
    case "offer_received": return "Müştəri ləğv etdi";
    case "in_progress":    return "İş zamanı ləğv";
    case "customer":       return "Müştəri ləğv etdi";
    case "admin":          return "Admin ləğv etdi";
    default:               return "Ləğv edildi";
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid var(--border)",
      padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, backgroundImage: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ width: "50%", height: 14, borderRadius: 6, backgroundImage: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
          <div style={{ width: "30%", height: 11, borderRadius: 6, backgroundImage: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        </div>
        <div style={{ width: 60, height: 22, borderRadius: 999, backgroundImage: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: HistoryOrder }) {
  const isDone = order.status === "done";

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${isDone ? "var(--border)" : "#FEE2E2"}`,
      padding: "14px 16px",
      animation: "fadeUp 0.3s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

        {/* Kateqoriya ikonu */}
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: isDone
            ? "linear-gradient(135deg,#EFF4FF,#DBEAFE)"
            : "linear-gradient(135deg,#FEE2E2,#FECACA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {order.category?.icon ?? "🔧"}
        </div>

        {/* Məlumat */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", fontFamily: "var(--font-playfair)", margin: 0 }}>
              {order.category?.name_az ?? "Xidmət"}
            </p>
            {isDone ? (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#065F46", background: "#D1FAE5", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                ✓ Tamamlandı
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, color: "#991B1B", background: "#FEE2E2", padding: "2px 8px", borderRadius: 999, flexShrink: 0 }}>
                ✕ {cancelReasonLabel(order.cancel_reason)}
              </span>
            )}
          </div>

          <p style={{ fontSize: 11, color: "var(--text-3)", margin: "0 0 6px" }}>
            {formatId(order.id)} · {formatDate(order.cancelled_at ?? order.created_at)}
          </p>

          {order.address && (
            <p style={{ fontSize: 11, color: "var(--text-2)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {order.address}
            </p>
          )}

          {(order.workerName || order.price) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "0.5px solid var(--border)" }}>
              {order.workerName && (
                <p style={{ fontSize: 11, color: "var(--text-2)", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {order.workerName}
                </p>
              )}
              {order.price && (
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-playfair)", margin: 0 }}>
                  ₼{order.price}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }

      const { data: rawOrders } = await supabase
        .from("job_requests")
        .select("id, status, cancel_reason, created_at, cancelled_at, description, address, category_id")
        .eq("customer_id", session.user.id)
        .in("status", ["done", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (!rawOrders || rawOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const catIds = [...new Set(rawOrders.map((o: any) => o.category_id).filter(Boolean))];
      const { data: catsData } = catIds.length > 0
        ? await supabase.from("categories").select("id,name_az,icon").in("id", catIds)
        : { data: [] };
      const catMap: Record<string, any> = {};
      (catsData ?? []).forEach((c: any) => { catMap[c.id] = c; });

      const doneIds = rawOrders.filter((o: any) => o.status === "done").map((o: any) => o.id);
      const { data: acceptedOffers } = doneIds.length > 0
        ? await supabase.from("offers").select("id,job_id,worker_id,price").in("job_id", doneIds).eq("status", "accepted")
        : { data: [] };

      const workerIds = [...new Set((acceptedOffers ?? []).map((o: any) => o.worker_id))];
      const { data: workerNames } = workerIds.length > 0
        ? await supabase.from("profiles").select("id,full_name").in("id", workerIds)
        : { data: [] };
      const wnMap: Record<string, string> = {};
      (workerNames ?? []).forEach((p: any) => { wnMap[p.id] = p.full_name; });

      const offerByJob: Record<string, any> = {};
      (acceptedOffers ?? []).forEach((o: any) => { offerByJob[o.job_id] = o; });

      const merged: HistoryOrder[] = rawOrders.map((o: any) => {
        const offer = offerByJob[o.id] ?? null;
        return {
          id: o.id,
          status: o.status,
          cancel_reason: o.cancel_reason,
          created_at: o.created_at,
          cancelled_at: o.cancelled_at,
          description: o.description,
          address: o.address,
          category: catMap[o.category_id] ?? null,
          workerName: offer ? (wnMap[offer.worker_id] ?? null) : null,
          price: offer?.price ?? null,
        };
      });

      setOrders(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const doneOrders      = orders.filter(o => o.status === "done");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 100 }}>

        {/* ── HEADER — sticky, tam yuxarıdan ── */}
        <div style={{
          background: "linear-gradient(135deg,#0D1F3C 0%,#1B3A7A 60%,#1B4FD8 100%)",
          padding: "14px 16px 18px",
          position: "sticky", top: 0, zIndex: 50,
          overflow: "hidden",
        }}>
          {/* Grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(27,79,216,0.07) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>

            {/* Geri düyməsi */}
            <button
              onClick={() => router.push("/dashboard?tab=orders")}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            {/* İkon + Başlıq */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15,
              }}>
                📋
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>
                  Tarixçə
                </p>
                {!loading && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
                    {orders.length > 0 ? `${orders.length} sifariş` : "Sifariş yoxdur"}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: "16px", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && orders.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid var(--border)", padding: "48px 24px", textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
                Tarixçə boşdur
              </p>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 20 }}>
                Tamamlanmış və ya ləğv edilmiş sifarişləriniz burada görünəcək
              </p>
              <button
                onClick={() => router.push("/request/new")}
                style={{ padding: "12px 28px", background: "linear-gradient(135deg,#1B4FD8,#2563EB)", color: "#fff", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(27,79,216,0.3)" }}
              >
                + Yeni sifariş ver
              </button>
            </div>
          )}

          {!loading && doneOrders.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                  ✅ Tamamlanmış
                </p>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#D1FAE5", padding: "2px 8px", borderRadius: 999 }}>
                  {doneOrders.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {doneOrders.map((o, i) => (
                  <div key={o.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <OrderCard order={o} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && cancelledOrders.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                  ✕ Ləğv Edilmiş
                </p>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#991B1B", background: "#FEE2E2", padding: "2px 8px", borderRadius: 999 }}>
                  {cancelledOrders.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cancelledOrders.map((o, i) => (
                  <div key={o.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <OrderCard order={o} />
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