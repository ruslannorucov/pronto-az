"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatModal, getInitials } from "@/components/ChatModal";

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
  worker: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    offerId: string;
    isEnRoute: boolean; // ← yeni sahə
  } | null;
  paymentStatus: string | null;
};

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error";

function Toast({ msg, type }: { msg: string; type: ToastType }) {
  return (
    <div style={{
      position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, whiteSpace: "nowrap",
      background: type === "success"
        ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)"
        : "linear-gradient(135deg,#FEE2E2,#FECACA)",
      border: `1px solid ${type === "success" ? "#6EE7B7" : "#FECACA"}`,
      color: type === "success" ? "#065F46" : "#991B1B",
      padding: "10px 20px", borderRadius: 10,
      fontSize: 12, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      animation: "slideUpToast 0.25s ease",
    }}>
      {msg}
    </div>
  );
}

// ─── Ləğv Modalı ──────────────────────────────────────────────────────────────

function CancelModal({
  order, onConfirm, onClose, loading,
}: {
  order: Order; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  const hasOffers = order.offerCount > 0;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(13,31,60,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: "0 0 32px", animation: "slideUpModal 0.28s cubic-bezier(0.32,0.72,0,1)" }}
      >
        <div style={{ width: 36, height: 3, background: "#E4EAFB", borderRadius: 999, margin: "14px auto 0" }} />
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEE2E2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 10 }}>🗑️</div>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 800, color: "var(--navy)", margin: 0 }}>Sifarişi ləğv et?</p>
          </div>
          <div style={{ background: "var(--gray-50)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "0.5px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{order.categories?.icon ?? "🔧"}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", margin: 0 }}>{order.categories?.name_az ?? "Xidmət"}</p>
                <p style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 0" }}>{order.address ?? "Ünvan yoxdur"}</p>
              </div>
            </div>
          </div>
          {hasOffers && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", gap: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 11, color: "#92400E", margin: 0, lineHeight: 1.5 }}>
                Bu sifarişə <strong>{order.offerCount} usta təklif göndərib</strong>. Ləğv etsəniz bütün təkliflər silinəcək.
              </p>
            </div>
          )}
          <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginBottom: 16, lineHeight: 1.6 }}>Bu əməliyyat geri qaytarıla bilməz.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 13, border: "1.5px solid var(--border)", color: "var(--text-2)", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Ləğv etmə
            </button>
            <button
              onClick={onConfirm} disabled={loading}
              style={{ flex: 1, padding: "13px", borderRadius: 13, border: "none", color: "#fff", background: loading ? "#FDA5A5" : "linear-gradient(135deg,#EF4444,#DC2626)", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {loading ? (
                <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Ləğv edilir...</>
              ) : "Bəli, ləğv et"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Step hesablama funksiyası ─────────────────────────────────────────────────
//
// DB vəziyyəti → step progress:
//   payment yoxdur       → Qəbul✓  Ödəniş(active)  Yolda    Gəldi    Bitdi
//   payment=held         → Qəbul✓  Ödəniş✓         Yolda(active) Gəldi Bitdi
//   is_en_route=true     → Qəbul✓  Ödəniş✓         Yolda✓   Gəldi(active) Bitdi
//   status=done          → Qəbul✓  Ödəniş✓         Yolda✓   Gəldi✓   Bitdi✓

function buildSteps(paymentStatus: string | null, isEnRoute: boolean) {
  const paid    = paymentStatus === "held" || paymentStatus === "released";
  const enRoute = isEnRoute;

  return [
    { label: "Qəbul",  done: true,      active: false                  },
    { label: "Ödəniş", done: paid,      active: !paid                  },
    { label: "Yolda",  done: enRoute,   active: paid && !enRoute       },
    { label: "Gəldi",  done: false,     active: enRoute                },
    { label: "Bitdi",  done: false,     active: false                  },
  ];
}

// Header badge mətni
function statusBadge(paymentStatus: string | null, isEnRoute: boolean): { text: string; color: string; bg: string } {
  if (isEnRoute)                   return { text: "Yolda 🚶",    color: "#059669", bg: "#D1FAE5" };
  if (paymentStatus === "held")    return { text: "Yola düşür",  color: "#1B4FD8", bg: "#EFF4FF" };
  return                                  { text: "Gözlənilir", color: "#D97706", bg: "#FEF3C7" };
}

// ─── SearchingCard ────────────────────────────────────────────────────────────

function SearchingCard({ order, onCancelRequest }: { order: Order; onCancelRequest: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl overflow-hidden transition-all" style={{ border: open ? "1.5px solid #1B4FD8" : "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-[1.5px] border-[rgba(27,79,216,0.3)]" style={{ animation: "pulse-out 2s ease-out infinite" }} />
          <div className="absolute rounded-full border border-[rgba(27,79,216,0.15)]" style={{ inset: "-5px", animation: "pulse-out 2s ease-out 0.5s infinite" }} />
          <div className="w-7 h-7 rounded-full bg-[#1B2D5A] flex items-center justify-center text-sm z-10">{order.categories?.icon ?? "🔧"}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-[var(--navy)] truncate">{order.categories?.name_az ?? "Xidmət"}</p>
            <span className="text-[10px] font-semibold text-[#1B4FD8] bg-[#EFF4FF] px-2 py-0.5 rounded-full flex-shrink-0">{formatId(order.id)}</span>
          </div>
          <p className="text-[11px] text-[var(--gray-400)] mt-0.5 truncate">📍 {order.address ?? "Ünvan yoxdur"} · {formatTime(order)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-[3px] items-center">
            {[0,1,2].map(i => <div key={i} className="w-[5px] h-[5px] rounded-full bg-[#1B4FD8]" style={{ animation: `bounce-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M3 5l4 4 4-4" stroke="#94A3C0" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div style={{ maxHeight: open ? "300px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div className="px-4 pb-4 border-t border-[var(--gray-200)]">
          <div className="h-[3px] bg-[var(--gray-100)] rounded-full overflow-hidden mt-3 mb-2">
            <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #1B4FD8, #60A5FA)", animation: "progress-pulse 2s ease-in-out infinite" }} />
          </div>
          <p className="text-[11px] text-[var(--gray-400)] text-center mb-3">
            Adətən <span className="font-semibold text-[var(--navy)]">15–45 dəq</span> ərzində təklif gəlir
          </p>
          <div className="flex gap-2 mb-3">
            {[
              { label: "Ünvan", value: order.address ?? "—" },
              { label: "Vaxt", value: formatTime(order) },
              { label: "Status", value: "Axtarılır", blue: true },
            ].map(m => (
              <div key={m.label} className="flex-1 bg-[var(--gray-50)] rounded-xl px-2 py-2">
                <p className="text-[9px] text-[var(--gray-400)]">{m.label}</p>
                <p className={`text-[11px] font-semibold truncate mt-0.5 ${m.blue ? "text-[#1B4FD8]" : "text-[var(--navy)]"}`}>{m.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onCancelRequest(order.id); }}
            className="w-full py-2.5 rounded-xl border border-[var(--border)] text-[12px] font-semibold text-[var(--gray-400)] hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            Sifarişi ləğv et
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OfferCard ────────────────────────────────────────────────────────────────

function OfferCard({ order }: { order: Order }) {
  return (
    <Link href={`/request/${order.id}`} className="block bg-white border-[1.5px] border-[var(--primary)] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(27,79,216,0.1)] hover:shadow-[0_8px_24px_rgba(27,79,216,0.15)] transition-all">
      <div className="bg-[var(--primary-bg)] px-4 py-2.5 flex items-center justify-between">
        <p className="text-[12px] font-bold text-[var(--navy)]">{order.categories?.icon} {order.categories?.name_az} · {formatId(order.id)}</p>
        <div className="flex items-center gap-1.5 bg-white border border-[var(--primary-mid)] rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[10px] font-bold text-[var(--primary)]">{order.offerCount} yeni təklif</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] text-[var(--gray-400)] mb-3">📍 {order.address ?? "Ünvan yoxdur"} · {formatTime(order)}</p>
        <div className="bg-[var(--primary-bg)] rounded-xl px-3 py-2.5 flex items-center justify-between">
          <p className="text-[12px] font-bold text-[var(--primary)]">Müqayisə et və seç</p>
          <span className="text-[var(--primary)]">→</span>
        </div>
      </div>
    </Link>
  );
}

// ─── TrackingCard ─────────────────────────────────────────────────────────────

function TrackingCard({ order, onReload }: { order: Order; onReload: () => void }) {
  const [open, setOpen] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const router = useRouter();
  const worker      = order.worker;
  const paymentStatus = order.paymentStatus;
  const isEnRoute   = worker?.isEnRoute ?? false;
  const supabase    = createClient();

  // ── Real status-a görə dinamik steps ──
  const steps = buildSteps(paymentStatus, isEnRoute);
  const badge = statusBadge(paymentStatus, isEnRoute);

  // Ödəniş təsdiqi
  const handleConfirmPayment = async () => {
    if (!worker?.offerId || confirmingPayment) return;
    setConfirmingPayment(true);
    try {
      await supabase.from("payments").insert({
        offer_id: worker.offerId, amount: 0, commission: 0,
        status: "held", epoint_ref: null,
      });
      await onReload();
    } catch (e) {
      console.error("payment error:", e);
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Progress bar genişliyi (0–100%) — active step-ə qədər
  const progressPct = (() => {
    const activeIdx = steps.findIndex(s => s.active);
    const doneCount = steps.filter(s => s.done).length;
    if (activeIdx < 0) return (doneCount / (steps.length - 1)) * 100;
    return (activeIdx / (steps.length - 1)) * 100;
  })();

  return (
    <div style={{ background: "#fff", border: "1.5px solid #A7F3D0", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(16,185,129,0.07)" }}>

      {/* Accordion header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", animation: "pulse-out 1.5s ease-in-out infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C" }}>
            {order.categories?.icon} {order.categories?.name_az} · {formatId(order.id)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Real status badge */}
          <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: "3px 9px", borderRadius: 999 }}>
            {badge.text}
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M3 5l4 4 4-4" stroke="#94A3C0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      <div style={{ maxHeight: open ? "560px" : "0", overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div style={{ borderTop: "0.5px solid #E8FDF5" }}>

          {/* Worker row */}
          {worker ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "0.5px solid #F0F9F6" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1B4FD8,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                {getInitials(worker.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1F3C", marginBottom: 3 }}>{worker.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: "#F59E0B", fontSize: 12 }}>{"★".repeat(Math.round(worker.rating))}{"☆".repeat(5 - Math.round(worker.rating))}</span>
                  <span style={{ fontSize: 11, color: "#94A3C0" }}>{worker.rating > 0 ? `${worker.rating.toFixed(1)} · ${worker.reviewCount} rəy` : "Yeni usta"}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={e => { e.stopPropagation(); setShowChat(true); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#1B4FD8", background: "#EFF4FF", border: "1px solid #BFCFFE", padding: "6px 12px", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C4.4 1.5 1.5 4 1.5 7.1c0 1.1.3 2.2 1 3.1L1.5 14l3.4-1.2c.9.4 1.9.7 3.1.7 3.6 0 6.5-2.5 6.5-5.6C14.5 4 11.6 1.5 8 1.5z" stroke="#1B4FD8" strokeWidth="1.3"/></svg>
                  Chat
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/workers/${worker.id}`); }}
                  style={{ fontSize: 11, fontWeight: 600, color: "#4A5878", background: "#F8FAFF", border: "0.5px solid #E4EAFB", padding: "6px 12px", borderRadius: 9, textAlign: "center", whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit" }}
                >
                  Profil →
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #F0F9F6" }}>
              <p style={{ fontSize: 12, color: "#94A3C0" }}>📍 {order.address ?? "Ünvan yoxdur"}</p>
            </div>
          )}

          {/* Ödəniş bölməsi */}
          {!paymentStatus && worker && (
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #F0F9F6", background: "#FFFBEB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>💳 Ödənişi təsdiqlə</p>
                  <p style={{ fontSize: 10, color: "#B45309", marginTop: 2 }}>Usta yalnız ödənişdən sonra ünvanı görəcək</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleConfirmPayment(); }}
                  disabled={confirmingPayment}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: confirmingPayment ? "not-allowed" : "pointer", opacity: confirmingPayment ? 0.7 : 1, whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit", boxShadow: "0 3px 10px rgba(245,158,11,0.3)" }}
                >
                  {confirmingPayment ? "..." : "Təsdiqlə →"}
                </button>
              </div>
            </div>
          )}
          {paymentStatus === "held" && !isEnRoute && (
            <div style={{ padding: "10px 16px", borderBottom: "0.5px solid #F0F9F6", background: "#EFF4FF" }}>
              <p style={{ fontSize: 11, color: "#1B4FD8", fontWeight: 600 }}>✓ Ödəniş təsdiqləndi — usta yola düşməyi gözlənilir</p>
            </div>
          )}
          {isEnRoute && (
            <div style={{ padding: "10px 16px", borderBottom: "0.5px solid #F0F9F6", background: "#F0FDF4" }}>
              <p style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>🚶 Usta yola düşüb — tezliklə gəlir</p>
            </div>
          )}

          {/* ── Step progress — dinamik ── */}
          <div style={{ padding: "14px 16px 12px", position: "relative" }}>
            {/* Arxa xətt */}
            <div style={{ position: "absolute", top: 23, left: 28, right: 28, height: 2, background: "#E4EAFB", zIndex: 0 }} />
            {/* İrəliləyiş xətti */}
            <div style={{
              position: "absolute", top: 23, left: 28,
              width: `calc((100% - 56px) * ${progressPct / 100})`,
              height: 2, background: "#10B981", zIndex: 1,
              transition: "width 0.5s ease",
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: s.done ? "#10B981" : s.active ? "#1B4FD8" : "#fff",
                    border: s.done ? "2px solid #10B981" : s.active ? "2px solid #1B4FD8" : "2px solid #E4EAFB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#fff",
                    animation: s.active ? "pulse-out 1.5s infinite" : "none",
                    transition: "all 0.3s ease",
                  }}>
                    {s.done ? "✓" : s.active ? "→" : ""}
                  </div>
                  <span style={{
                    fontSize: 9,
                    fontWeight: s.done ? 600 : s.active ? 700 : 400,
                    color: s.done ? "#10B981" : s.active ? "#1B4FD8" : "#94A3C0",
                    transition: "color 0.3s ease",
                  }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini map */}
          <div style={{ margin: "0 16px 16px", background: "#EEF3FF", borderRadius: 12, height: 76, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "linear-gradient(#94A3C0 1px,transparent 1px),linear-gradient(90deg,#94A3C0 1px,transparent 1px)", backgroundSize: "18px 18px" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 14, height: 14, background: "#EF4444", borderRadius: "50% 50% 0 50%", transform: "rotate(-45deg)", border: "2px solid #fff", flexShrink: 0 }} />
              <div style={{ width: 40, borderTop: "2px dashed #1B4FD8" }} />
              <span style={{ fontSize: 20, animation: isEnRoute ? "walk 1s ease-in-out infinite alternate" : "none" }}>🚶</span>
            </div>
            <div style={{ position: "absolute", bottom: 6, left: 10, fontSize: 9, fontWeight: 600, color: "#1B4FD8", background: "#fff", borderRadius: 5, padding: "2px 6px" }}>Siz</div>
            <div style={{ position: "absolute", top: 6, right: 10, fontSize: 9, fontWeight: 700, color: "#0D1F3C", background: "#fff", borderRadius: 5, padding: "2px 6px", border: "0.5px solid #E4EAFB" }}>
              {isEnRoute ? "Yolda 🚶" : "~gözlənilir"}
            </div>
          </div>

        </div>
      </div>

      {showChat && worker && (
        <ChatModal
          jobId={order.id}
          offerId={worker.offerId}
          workerName={worker.name}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OrdersClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") { router.push("/admin"); return; }

    const { data: activeOrders } = await supabase
      .from("job_requests")
      .select("id, description, address, status, time_type, exact_datetime, urgency, created_at, category_id")
      .eq("customer_id", user.id)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });

    const catIds = [...new Set((activeOrders ?? []).map((o: any) => o.category_id).filter(Boolean))];
    const { data: catsData } = catIds.length > 0
      ? await supabase.from("categories").select("id, name_az, icon").in("id", catIds)
      : { data: [] };
    const catMap: Record<string, any> = {};
    (catsData ?? []).forEach((c: any) => { catMap[c.id] = c; });

    const inProgressIds = (activeOrders ?? []).filter((o: any) => o.status === "in_progress").map((o: any) => o.id);
    const { data: acceptedOffers } = inProgressIds.length > 0
      ? await supabase.from("offers").select("id, job_id, worker_id, price").in("job_id", inProgressIds).eq("status", "accepted")
      : { data: [] };

    const workerIds = [...new Set((acceptedOffers ?? []).map((o: any) => o.worker_id))];

    const { data: workerProfiles } = workerIds.length > 0
      ? await supabase
          .from("worker_profiles")
          .select("user_id, rating, review_count, is_en_route") // ← is_en_route əlavə edildi
          .in("user_id", workerIds)
      : { data: [] };

    const { data: workerNames } = workerIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", workerIds)
      : { data: [] };

    const wpMap: Record<string, any> = {};
    (workerProfiles ?? []).forEach((w: any) => { wpMap[w.user_id] = w; });
    const wnMap: Record<string, string> = {};
    (workerNames ?? []).forEach((p: any) => { wnMap[p.id] = p.full_name; });
    const offerByJob: Record<string, any> = {};
    (acceptedOffers ?? []).forEach((o: any) => { offerByJob[o.job_id] = o; });

    const acceptedOfferIds = (acceptedOffers ?? []).map((o: any) => o.id);
    const { data: paymentsData } = acceptedOfferIds.length > 0
      ? await supabase.from("payments").select("offer_id, status").in("offer_id", acceptedOfferIds)
      : { data: [] };
    const payStatusMap: Record<string, string> = {};
    (paymentsData ?? []).forEach((p: any) => { payStatusMap[p.offer_id] = p.status; });

    const ordersWithOffers = await Promise.all(
      (activeOrders ?? []).map(async (order: any) => {
        const { count } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("job_id", order.id)
          .eq("status", "pending");
        const acceptedOffer = offerByJob[order.id] ?? null;
        const worker = acceptedOffer ? {
          id:          acceptedOffer.worker_id,
          name:        wnMap[acceptedOffer.worker_id] ?? "Usta",
          rating:      wpMap[acceptedOffer.worker_id]?.rating ?? 0,
          reviewCount: wpMap[acceptedOffer.worker_id]?.review_count ?? 0,
          offerId:     acceptedOffer.id,
          isEnRoute:   wpMap[acceptedOffer.worker_id]?.is_en_route ?? false, // ← yeni
        } : null;
        return {
          ...order,
          categories:    catMap[order.category_id] ?? null,
          offerCount:    count ?? 0,
          worker,
          paymentStatus: payStatusMap[acceptedOffer?.id ?? ""] ?? null,
        } as Order;
      })
    );

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

  const handleCancelRequest = (orderId: string) => setCancelTargetId(orderId);

  const handleCancelConfirm = async () => {
    if (!cancelTargetId || cancelling) return;
    setCancelling(true);
    try {
      const supabase = createClient();
      const order = orders.find(o => o.id === cancelTargetId);
      const cancelReason = order ? (order.offerCount > 0 ? "offer_received" : "no_offers") : "customer";
      const { error } = await supabase
        .from("job_requests")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: cancelReason })
        .eq("id", cancelTargetId);
      if (error) throw error;
      setCancelTargetId(null);
      showToast("Sifariş ləğv edildi", "success");
      await load();
    } catch (e) {
      console.error(e);
      showToast("Xəta baş verdi. Yenidən cəhd edin.", "error");
    } finally {
      setCancelling(false);
    }
  };

  const offerOrders     = orders.filter(o => o.offerCount > 0);
  const searchingOrders = orders.filter(o => o.offerCount === 0 && o.status === "open");
  const activeOrders    = orders.filter(o => o.status === "in_progress");
  const cancelTarget    = cancelTargetId ? orders.find(o => o.id === cancelTargetId) ?? null : null;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {[1,2].map(i => <div key={i} className="h-[200px] bg-[var(--gray-100)] rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bounce-dot { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes pulse-out  { 0%{transform:scale(.8);opacity:1} 100%{transform:scale(1.5);opacity:0} }
        @keyframes progress-pulse { 0%{width:20%;margin-left:0} 50%{width:40%} 100%{width:20%;margin-left:80%} }
        @keyframes walk       { 0%{transform:translateX(0)} 100%{transform:translateX(-4px)} }
        @keyframes slideUpModal { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideUpToast { from{transform:translateX(-50%) translateY(12px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes spin       { to{transform:rotate(360deg)} }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-serif text-[20px] font-bold text-[var(--navy)]">Sifarişlərim</h1>
            <p className="text-[12px] text-[var(--gray-400)] mt-0.5">
              {orders.length === 0 ? "Aktiv sifariş yoxdur" : `${orders.length} aktiv sifariş`}
            </p>
          </div>
          <Link href="/dashboard/history" className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-2)] hover:text-[var(--primary)] transition-colors px-3 py-2 rounded-xl hover:bg-[var(--primary-bg)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Tarixçə
          </Link>
        </div>

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

        {offerOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider">🔔 Təklif Gəldi</p>
              <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-2.5 py-0.5 rounded-full">{offerOrders.length}</span>
            </div>
            <div className="space-y-3">{offerOrders.map(o => <OfferCard key={o.id} order={o} />)}</div>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider flex items-center gap-2">
                ✅ Aktiv Sifariş
                <span className="text-[10px] font-bold text-[#10B981] normal-case tracking-normal animate-pulse">● Canlı</span>
              </p>
              <span className="text-[10px] font-bold text-[#10B981] bg-[#D1FAE5] px-2.5 py-0.5 rounded-full">{activeOrders.length}</span>
            </div>
            <div className="space-y-3">{activeOrders.map(o => <TrackingCard key={o.id} order={o} onReload={load} />)}</div>
          </div>
        )}

        {searchingOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-[var(--navy)] uppercase tracking-wider">🔍 Usta Axtarılır</p>
              <span className="text-[10px] font-bold text-[var(--text-3)] bg-[var(--gray-100)] px-2.5 py-0.5 rounded-full">{searchingOrders.length}</span>
            </div>
            <div className="space-y-3">{searchingOrders.map(o => <SearchingCard key={o.id} order={o} onCancelRequest={handleCancelRequest} />)}</div>
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !cancelling && setCancelTargetId(null)}
          loading={cancelling}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  );
}