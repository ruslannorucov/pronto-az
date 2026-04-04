"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  description: string;
  address: string | null;
  status: string;
  time_type: string | null;
  exact_datetime: string | null;
  urgency: string | null;
  created_at: string;
  offerCount: number;
  categories: { name_az: string; icon: string } | null;
};

function formatTime(order: Order): string {
  if (order.time_type === "exact" && order.exact_datetime) {
    const d = new Date(order.exact_datetime);
    return d.toLocaleDateString("az-AZ", { day: "numeric", month: "short" }) +
      ", " + d.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
  }
  if (order.urgency === "today") return "Bu gün";
  if (order.urgency === "this_week") return "Bu həftə";
  return "Çevik";
}

function formatId(id: string): string {
  return "#PRN-" + id.slice(0, 4).toUpperCase();
}

// ── State 1: Usta axtarılır (accordion) ──
function SearchingCard({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all"
      style={{ border: open ? "1.5px solid #1B4FD8" : "1px solid var(--border)" }}
    >
      {/* Header — həmişə görünür */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        {/* Pulse ikon */}
        <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-[1.5px] border-[rgba(27,79,216,0.3)]"
            style={{ animation: "pulse-out 2s ease-out infinite" }} />
          <div className="absolute rounded-full border border-[rgba(27,79,216,0.15)]"
            style={{ inset: "-5px", animation: "pulse-out 2s ease-out 0.5s infinite" }} />
          <div className="w-7 h-7 rounded-full bg-[#1B2D5A] flex items-center justify-center text-sm z-10">
            {order.categories?.icon ?? "🔧"}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-[var(--navy)] truncate">
              {order.categories?.name_az ?? "Xidmət"}
            </p>
            <span className="text-[10px] font-semibold text-[#1B4FD8] bg-[#EFF4FF] px-2 py-0.5 rounded-full flex-shrink-0">
              {formatId(order.id)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--gray-400)] mt-0.5 truncate">
            📍 {order.address ?? "Ünvan yoxdur"} · {formatTime(order)}
          </p>
        </div>

        {/* Dots + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-[3px] items-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-[5px] h-[5px] rounded-full bg-[#1B4FD8]"
                style={{ animation: `bounce-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
            ))}
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M3 5l4 4 4-4" stroke="#94A3C0" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Body — açılanda görünür */}
      <div style={{ maxHeight: open ? "300px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div className="px-4 pb-4 border-t border-[var(--gray-200)]">
          {/* Progress bar */}
          <div className="h-[3px] bg-[var(--gray-100)] rounded-full overflow-hidden mt-3 mb-2">
            <div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #1B4FD8, #60A5FA)", animation: "progress-pulse 2s ease-in-out infinite" }} />
          </div>
          <p className="text-[11px] text-[var(--gray-400)] text-center mb-3">
            Adətən <span className="font-semibold text-[var(--navy)]">15–45 dəq</span> ərzində təklif gəlir
          </p>
          {/* Meta pills */}
          <div className="flex gap-2 mb-3">
            {[
              { label: "Ünvan", value: order.address ?? "—" },
              { label: "Vaxt", value: formatTime(order) },
              { label: "Status", value: "Axtarılır", blue: true },
            ].map(m => (
              <div key={m.label} className="flex-1 bg-[var(--gray-50)] rounded-xl px-2 py-2">
                <p className="text-[9px] text-[var(--gray-400)]">{m.label}</p>
                <p className={`text-[11px] font-semibold truncate mt-0.5 ${m.blue ? "text-[#1B4FD8]" : "text-[var(--navy)]"}`}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(order.id); }}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[12px] font-semibold text-[var(--gray-400)] hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Sifarişi ləğv et
          </button>
        </div>
      </div>
    </div>
  );
}

// ── State 2: Təklif gəldi ──
function OfferCard({ order }: { order: Order }) {
  return (
    <Link
      href={`/request/${order.id}`}
      className="block bg-white border-[1.5px] border-[var(--primary)] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(27,79,216,0.1)] hover:shadow-[0_8px_24px_rgba(27,79,216,0.15)] transition-all"
    >
      {/* Header */}
      <div className="bg-[var(--primary-bg)] px-4 py-2.5 flex items-center justify-between">
        <p className="text-[12px] font-bold text-[var(--navy)]">
          {order.categories?.icon} {order.categories?.name_az} · {formatId(order.id)}
        </p>
        <div className="flex items-center gap-1.5 bg-white border border-[var(--primary-mid)] rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[10px] font-bold text-[var(--primary)]">
            {order.offerCount} yeni təklif
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-[11px] text-[var(--gray-400)] mb-3">
          📍 {order.address ?? "Ünvan yoxdur"} · {formatTime(order)}
        </p>
        <div className="bg-[var(--primary-bg)] rounded-xl px-3 py-2.5 flex items-center justify-between">
          <p className="text-[12px] font-bold text-[var(--primary)]">
            Müqayisə et və seç
          </p>
          <span className="text-[var(--primary)]">→</span>
        </div>
      </div>
    </Link>
  );
}

// ── State 3: Usta yolda (tracking accordion) ──
function TrackingCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(true);

  const steps = [
    { label: "Qəbul", done: true },
    { label: "Ödəniş", done: true },
    { label: "Yolda", done: false, active: true },
    { label: "Gəldi", done: false },
    { label: "Bitdi", done: false },
  ];

  return (
    <div className="bg-white border-[1.5px] border-[#A7F3D0] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F0FBF7] transition-colors text-left"
      >
        <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 animate-pulse" />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-[var(--navy)]">
            {order.categories?.icon} {order.categories?.name_az} · {formatId(order.id)}
          </p>
          <p className="text-[11px] text-[var(--gray-400)] mt-0.5">
            📍 {order.address ?? "Ünvan yoxdur"} · ~12 dəq
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
            Yolda
          </span>
          <span className={`text-[var(--gray-400)] text-xs transition-transform duration-250 ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[240px]" : "max-h-0"}`}>
        <div className="px-4 pb-4">
          {/* Step progress */}
          <div className="flex items-center justify-between mb-4 relative">
            <div className="absolute top-[9px] left-0 right-0 h-[2px] bg-[var(--gray-200)] z-0" />
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center z-10">
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[8px] mb-1 transition-all ${
                  s.done ? "bg-[#10B981] border-[#10B981] text-white" :
                  s.active ? "bg-[var(--primary)] border-[var(--primary)] text-white animate-pulse" :
                  "bg-white border-[var(--gray-200)]"
                }`}>
                  {s.done ? "✓" : s.active ? "→" : ""}
                </div>
                <p className={`text-[9px] ${
                  s.done ? "text-[#10B981] font-semibold" :
                  s.active ? "text-[var(--primary)] font-bold" :
                  "text-[var(--gray-400)]"
                }`}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Mini map */}
          <div className="bg-[#E8F0FE] rounded-xl h-[90px] relative overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "linear-gradient(#94A3C0 1px,transparent 1px),linear-gradient(90deg,#94A3C0 1px,transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-tl-full rounded-tr-full rounded-br-none rounded-bl-full rotate-[-45deg] border-2 border-white shadow" />
              <div className="w-8 border-t-2 border-dashed border-[var(--primary)]" />
              <span className="text-xl" style={{ animation: "walk 1s ease-in-out infinite alternate" }}>
                🚶
              </span>
            </div>
            <div className="absolute bottom-2 left-3 text-[9px] font-semibold text-[var(--primary)] bg-white rounded px-1.5 py-0.5">
              Siz
            </div>
            <div className="absolute top-2 right-3 text-[9px] font-bold text-[var(--navy)] bg-white rounded px-1.5 py-0.5 border border-[var(--gray-200)]">
              ~12 dəq
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isVerified, setIsVerified] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_verified, role")
      .eq("id", user.id)
      .single();

    // Variant B: worker da /dashboard-a gire biler
    // role yoxlaması silinib — worker redirect edilmir
    if (profile?.role === "admin") { router.push("/admin"); return; }

    setProfile(profile);
    setIsVerified(profile?.is_verified ?? false);

    // Join olmadan ayrı query — browser client üçün daha etibarlı
    const { data: activeOrders } = await supabase
      .from("job_requests")
      .select("id, description, address, status, time_type, exact_datetime, urgency, created_at, category_id")
      .eq("customer_id", user.id)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });

    // Category ID-ləri topla və ayrıca çək
    const catIds = [...new Set((activeOrders ?? []).map((o: any) => o.category_id).filter(Boolean))];
    const { data: catsData } = catIds.length > 0
      ? await supabase.from("categories").select("id, name_az, icon").in("id", catIds)
      : { data: [] };
    const catMap: Record<string, any> = {};
    (catsData ?? []).forEach((c: any) => { catMap[c.id] = c; });

    const ordersWithOffers = await Promise.all(
      (activeOrders ?? []).map(async (order: any) => {
        const { count } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("job_id", order.id)
          .eq("status", "pending");

        return {
          ...order,
          categories: catMap[order.category_id] ?? null,
          offerCount: count ?? 0,
        } as Order;
      })
    );

    // Prioritet: təklif var → usta axtarılır → aktiv
    const sorted = ordersWithOffers.sort((a, b) => {
      if (a.offerCount > 0 && b.offerCount === 0) return -1;
      if (a.offerCount === 0 && b.offerCount > 0) return 1;
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      return 0;
    });

    setOrders(sorted);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (orderId: string) => {
    if (!confirm("Sifarişi ləğv etmək istədiyinizə əminsiniz?")) return;
    setCancelling(orderId);
    const supabase = createClient();

    // Ləğv mərhələsini müəyyən et
    const order = orders.find(o => o.id === orderId);
    const cancelReason = order
      ? order.offerCount > 0
        ? "offer_received"   // Təklif var idi, müştəri ləğv etdi
        : "no_offers"        // Təklif gəlmədi, müştəri ləğv etdi
      : "customer";

    await supabase
      .from("job_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
      })
      .eq("id", orderId);

    await load();
    setCancelling(null);
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "Salam";
  const offerOrders = orders.filter(o => o.offerCount > 0);
  const searchingOrders = orders.filter(o => o.offerCount === 0 && o.status === "open");
  const activeOrders = orders.filter(o => o.status === "in_progress");

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 py-6 space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-[200px] bg-[var(--gray-100)] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse-out {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes progress-pulse {
          0% { width: 20%; margin-left: 0; }
          50% { width: 40%; }
          100% { width: 20%; margin-left: 80%; }
        }
        @keyframes walk {
          0% { transform: translateX(0); }
          100% { transform: translateX(-4px); }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-serif text-[22px] sm:text-[24px] font-bold text-[var(--navy)]">
              Salam, {firstName}! 👋
            </h1>
            <p className="text-[12px] text-[var(--gray-400)] mt-1">
              {offerOrders.length > 0
                ? `${offerOrders.length} sifarişinizə təklif gəldi`
                : activeOrders.length > 0
                ? `${activeOrders.length} aktiv sifarişiniz var`
                : searchingOrders.length > 0
                ? `${searchingOrders.length} sifariş usta gözləyir`
                : "Aktiv sifariş yoxdur"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard/history"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-2)] hover:text-[var(--primary)] transition-colors px-3 py-2 rounded-xl hover:bg-[var(--primary-bg)]"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Tarixçə</span>
            </Link>
            <Link
              href="/request/new"
              className="bg-[var(--primary)] text-white font-bold text-[12px] sm:text-[13px] px-4 py-2.5 rounded-xl hover:bg-[var(--primary-light)] transition-colors"
            >
              + Yeni Sifariş
            </Link>
          </div>
        </div>

        {/* ── Email xəbərdarlığı ── */}
        {!isVerified && (
          <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <span>📧</span>
            <p className="text-[12px] text-[#92400E] flex-1">Emailinizi təsdiqləyin — hesabınız tam aktiv deyil</p>
            <button className="bg-[#F59E0B] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0">Emaili yoxla</button>
          </div>
        )}

        {/* ── Worker banner ── */}
        {profile?.role === "worker" && (
          <div className="bg-[var(--primary-bg)] border border-[var(--primary-mid)] rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
            <span>🔧</span>
            <p className="text-[12px] text-[var(--navy)] flex-1">Usta panelinizə keçmək istəyirsiniz?</p>
            <a href="/worker/panel" className="bg-[var(--primary)] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-[var(--primary-light)] transition-colors">
              İş paneli →
            </a>
          </div>
        )}

        {/* ── Boş hal ── */}
        {orders.length === 0 && (
          <div className="bg-white border border-[var(--border)] rounded-2xl p-10 text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-[15px] font-bold text-[var(--navy)] mb-2">Aktiv sifariş yoxdur</p>
            <p className="text-[12px] text-[var(--gray-400)] mb-5">Yeni sifariş yaradın, ustalar təklif göndərsin</p>
            <Link href="/request/new" className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-[13px] font-bold px-6 py-3 rounded-xl hover:bg-[var(--primary-light)] transition-colors">
              + Yeni Sifariş
            </Link>
          </div>
        )}

        {/* ── 1. PRİORİTET: Təklif Gəldi ── */}
        {offerOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-2">
                🔔 Təklif Gəldi
              </p>
              <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-2.5 py-0.5 rounded-full">
                {offerOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {offerOrders.map(order => (
                <OfferCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* ── 2. PRİORİTET: Aktiv Sifariş ── */}
        {activeOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-2">
                ✅ Aktiv Sifariş
                <span className="text-[10px] font-bold text-[#10B981] normal-case tracking-normal animate-pulse">● Canlı</span>
              </p>
              <span className="text-[10px] font-bold text-[#10B981] bg-[#D1FAE5] px-2.5 py-0.5 rounded-full">
                {activeOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <TrackingCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        )}

        {/* ── 3. PRİORİTET: Usta Axtarılır ── */}
        {searchingOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider">
                🔍 Usta Axtarılır
              </p>
              <span className="text-[10px] font-bold text-[var(--text-3)] bg-[var(--gray-100)] px-2.5 py-0.5 rounded-full">
                {searchingOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {searchingOrders.map(order => (
                <SearchingCard key={order.id} order={order} onCancel={handleCancel} />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
