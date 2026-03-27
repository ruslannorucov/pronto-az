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

// ── State 1: Usta axtarılır ──
function SearchingCard({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Animasiya hissəsi */}
      <div
        className="relative flex flex-col items-center gap-3 py-6 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D1F3C, #162F6A)" }}
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(27,79,216,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(27,79,216,0.08) 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Pulse ring */}
        <div className="relative z-10 flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(147,180,255,0.3)] animate-[pulse-out_2s_ease-out_infinite]" />
          <div className="absolute inset-[-8px] rounded-full border border-[rgba(147,180,255,0.15)] animate-[pulse-out_2s_ease-out_0.5s_infinite]" />
          <div className="w-12 h-12 rounded-full bg-[rgba(27,79,216,0.4)] flex items-center justify-center text-2xl z-10">
            {order.categories?.icon ?? "🔧"}
          </div>
        </div>
        {/* Bouncing dots */}
        <div className="flex gap-1.5 z-10">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#93B4FF]"
              style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <p className="text-[12px] text-white/70 z-10 text-center">
          Ustalar sifarişinizi görür...
        </p>
      </div>

      {/* Məlumat hissəsi */}
      <div className="px-4 py-3">
        <p className="text-[13px] font-bold text-[var(--navy)] mb-0.5">
          {order.categories?.icon} {order.categories?.name_az} · {formatId(order.id)}
        </p>
        <p className="text-[11px] text-[var(--gray-400)] mb-3">
          📍 {order.address ?? "Ünvan yoxdur"} · {formatTime(order)}
        </p>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--gray-100)] rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #1B4FD8, #60A5FA)",
              animation: "progress-pulse 2s ease-in-out infinite",
            }}
          />
        </div>
        <p className="text-[11px] text-[var(--gray-400)] text-center mb-3">
          Adətən <span className="font-semibold text-[var(--navy)]">15–45 dəq</span> ərzində təklif gəlir
        </p>

        <button
          onClick={() => onCancel(order.id)}
          className="w-full py-2 rounded-xl border border-[var(--border)] text-[12px] font-semibold text-[var(--gray-400)] hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          Sifarişi ləğv et
        </button>
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

    const { data: activeOrders } = await supabase
      .from("job_requests")
      .select(`
        id, description, address, status,
        time_type, exact_datetime, urgency, created_at,
        categories ( name_az, icon )
      `)
      .eq("customer_id", user.id)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });

    const ordersWithOffers = await Promise.all(
      (activeOrders ?? []).map(async (order: any) => {
        const { count } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("job_id", order.id)
          .eq("status", "pending");

        const categoryData = Array.isArray(order.categories)
          ? order.categories[0]
          : order.categories;

        return {
          ...order,
          categories: categoryData || null,
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
    await supabase
      .from("job_requests")
      .update({ status: "cancelled" })
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

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-serif text-[24px] font-bold text-[var(--navy)]">
              Salam, {firstName}! 👋
            </h1>
            <p className="text-[13px] text-[var(--gray-400)] mt-1">
              {offerOrders.length > 0
                ? `${offerOrders.length} sifarişinizə təklif gəldi`
                : searchingOrders.length > 0
                ? `${searchingOrders.length} sifariş usta gözləyir`
                : activeOrders.length > 0
                ? `${activeOrders.length} aktiv sifarişiniz var`
                : "Aktiv sifariş yoxdur"}
            </p>
          </div>
          <Link
            href="/request/new"
            className="bg-[var(--primary)] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl hover:bg-[var(--primary-light)] transition-colors shrink-0"
          >
            + Yeni Sifariş
          </Link>
        </div>

        {/* Email xəbərdarlığı */}
        {!isVerified && (
          <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
            <span className="text-lg">📧</span>
            <p className="text-[13px] text-[#92400E] flex-1">
              Emailinizi təsdiqləyin — hesabınız tam aktiv deyil
            </p>
            <button className="bg-[#F59E0B] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0">
              Emaili yoxla
            </button>
          </div>
        )}

        {/* Worker üçün İş paneli keçidi */}
        {profile?.role === "worker" && (
          <div className="bg-[var(--primary-bg)] border border-[var(--primary-mid)] rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
            <span className="text-lg">🔧</span>
            <p className="text-[13px] text-[var(--navy)] flex-1">
              Usta panelinizə keçmək istəyirsiniz?
            </p>
            <a
              href="/worker/panel"
              className="bg-[var(--primary)] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-[var(--primary-light)] transition-colors"
            >
              İş paneli →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">

            {/* Təklif gəlmiş sifarişlər */}
            {offerOrders.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-[var(--navy)] mb-2 flex items-center justify-between">
                  Təklif Gəldi
                  <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-2 py-0.5 rounded-full">
                    {offerOrders.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {offerOrders.map(order => (
                    <OfferCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* Usta axtarılan sifarişlər */}
            {searchingOrders.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-[var(--navy)] mb-2">
                  Usta Axtarılır
                </p>
                <div className="space-y-2">
                  {searchingOrders.map(order => (
                    <SearchingCard
                      key={order.id}
                      order={order}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Boş hal */}
            {orders.length === 0 && (
              <div className="bg-white border border-[var(--border)] rounded-2xl p-8 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-[14px] font-bold text-[var(--navy)] mb-1">
                  Aktiv sifariş yoxdur
                </p>
                <p className="text-[12px] text-[var(--gray-400)] mb-4">
                  Yeni sifariş yaradın, ustalar təklif göndərsin
                </p>
                <Link
                  href="/request/new"
                  className="inline-flex items-center gap-2 bg-[var(--primary)] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-[var(--primary-light)] transition-colors"
                >
                  + Yeni Sifariş
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Tracking */}
            {activeOrders.length > 0 && (
              <div>
                <p className="text-[12px] font-bold text-[var(--navy)] mb-2 flex items-center gap-2">
                  Aktiv · İzlə
                  <span className="text-[10px] font-bold text-[#10B981] animate-pulse">
                    ● Canlı
                  </span>
                </p>
                <div className="space-y-2">
                  {activeOrders.map(order => (
                    <TrackingCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {/* Tarixçə */}
            <Link
              href="/dashboard/history"
              className="flex items-center justify-between bg-[var(--gray-100)] rounded-2xl px-4 py-3.5 hover:bg-[var(--gray-200)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔄</span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-2)]">Tarixçə</p>
                  <p className="text-[11px] text-[var(--gray-400)]">Tamamlanmış sifarişlər</p>
                </div>
              </div>
              <span className="text-[var(--gray-400)] group-hover:text-[var(--primary)] transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
