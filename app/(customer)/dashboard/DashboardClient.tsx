"use client";

import { useEffect, useRef, useState } from "react";
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
  worker: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    offerId: string;
  } | null;
  paymentStatus: string | null;
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

// ── Helpers ──
function getInitials(name: string) {
  return name.trim().split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
}

// ── State 3: Usta yolda (tracking card) ──
function TrackingCard({ order, onReload }: { order: Order; onReload: () => void }) {
  const [open, setOpen] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const worker = order.worker;
  const paymentStatus = order.paymentStatus;
  const supabase = createClient();

  const handleConfirmPayment = async () => {
    if (!worker?.offerId || confirmingPayment) return;
    setConfirmingPayment(true);
    try {
      await supabase.from("payments").insert({
        offer_id: worker.offerId,
        amount: 0,
        commission: 0,
        status: "held",
        epoint_ref: null,
      });
      await onReload();
    } catch (e) {
      console.error("payment error:", e);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const steps = [
    { label: "Qəbul",   done: true,  active: false },
    { label: "Ödəniş",  done: true,  active: false },
    { label: "Yolda",   done: false, active: true  },
    { label: "Gəldi",   done: false, active: false },
    { label: "Bitdi",   done: false, active: false },
  ];

  return (
    <div style={{ background: "#fff", border: "1.5px solid #A7F3D0", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(16,185,129,0.07)" }}>

      {/* ── Top bar ── */}
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
          <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#D1FAE5", padding: "3px 9px", borderRadius: 999 }}>Yolda</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M3 5l4 4 4-4" stroke="#94A3C0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      {/* ── Body ── */}
      <div style={{ maxHeight: open ? "500px" : "0", overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <div style={{ borderTop: "0.5px solid #E8FDF5" }}>

          {/* Usta row */}
          {worker ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "0.5px solid #F0F9F6" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#1B4FD8,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                {getInitials(worker.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1F3C", marginBottom: 3 }}>{worker.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: "#F59E0B", fontSize: 12 }}>
                    {"★".repeat(Math.round(worker.rating))}{"☆".repeat(5 - Math.round(worker.rating))}
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3C0" }}>
                    {worker.rating > 0 ? `${worker.rating.toFixed(1)} · ${worker.reviewCount} rəy` : "Yeni usta"}
                  </span>
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
                <Link
                  href={`/workers/${worker.id}`}
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: 11, fontWeight: 600, color: "#4A5878", background: "#F8FAFF", border: "0.5px solid #E4EAFB", padding: "6px 12px", borderRadius: 9, textAlign: "center", textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Profil →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #F0F9F6" }}>
              <p style={{ fontSize: 12, color: "#94A3C0" }}>📍 {order.address ?? "Ünvan yoxdur"}</p>
            </div>
          )}

          {/* Ödəniş təsdiqləmə düyməsi */}
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
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg,#F59E0B,#D97706)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    cursor: confirmingPayment ? "not-allowed" : "pointer",
                    opacity: confirmingPayment ? 0.7 : 1,
                    whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit",
                    boxShadow: "0 3px 10px rgba(245,158,11,0.3)",
                  }}
                >
                  {confirmingPayment ? "..." : "Təsdiqlə →"}
                </button>
              </div>
            </div>
          )}
          {paymentStatus === "held" && (
            <div style={{ padding: "10px 16px", borderBottom: "0.5px solid #F0F9F6", background: "#F0FDF4" }}>
              <p style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✓ Ödəniş təsdiqləndi — usta yola düşə bilər</p>
            </div>
          )}

          {/* Steps */}
          <div style={{ padding: "14px 16px 12px", position: "relative" }}>
            <div style={{ position: "absolute", top: 23, left: 28, right: 28, height: 2, background: "#E4EAFB", zIndex: 0 }} />
            <div style={{ position: "absolute", top: 23, left: 28, width: "40%", height: 2, background: "#10B981", zIndex: 1 }} />
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
                  }}>
                    {s.done ? "✓" : s.active ? "→" : ""}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: s.done ? 600 : s.active ? 700 : 400, color: s.done ? "#10B981" : s.active ? "#1B4FD8" : "#94A3C0" }}>
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
              <span style={{ fontSize: 20, animation: "walk 1s ease-in-out infinite alternate" }}>🚶</span>
            </div>
            <div style={{ position: "absolute", bottom: 6, left: 10, fontSize: 9, fontWeight: 600, color: "#1B4FD8", background: "#fff", borderRadius: 5, padding: "2px 6px" }}>Siz</div>
            <div style={{ position: "absolute", top: 6, right: 10, fontSize: 9, fontWeight: 700, color: "#0D1F3C", background: "#fff", borderRadius: 5, padding: "2px 6px", border: "0.5px solid #E4EAFB" }}>~12 dəq</div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
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

// ── Chat Modal ──
function ChatModal({ jobId, workerName, onClose }: {
  jobId: string;
  offerId: string;
  workerName: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      setMessages(data ?? []);
      if (user) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("job_id", jobId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
    };
    init();
    const channel = supabase
      .channel(`chat-${jobId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !userId || sending) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    await supabase.from("messages").insert({ job_id: jobId, sender_id: userId, content: msg });
    setSending(false);
  };

  function timeStr(d: string) {
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  }

  const initials = getInitials(workerName);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(13,31,60,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: "20px 20px 0 0", display: "flex", flexDirection: "column", height: "70vh", maxHeight: 560 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "0.5px solid #E4EAFB", flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#1B4FD8,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C" }}>{workerName}</p>
            <p style={{ fontSize: 10, color: "#10B981", marginTop: 1 }}>● Aktiv sifariş · Yolda</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F8FAFF", border: "0.5px solid #E4EAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#4A5878", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 32 }}>
              <p style={{ fontSize: 12, color: "#94A3C0" }}>Söhbəti başladın 👋</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                {!isMe && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1B4FD8,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
                    {initials}
                  </div>
                )}
                <div style={{ maxWidth: "72%" }}>
                  <div style={{ padding: "10px 12px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMe ? "#1B4FD8" : "#F1F5FE", color: isMe ? "#fff" : "#0D1F3C", fontSize: 13, lineHeight: 1.5 }}>
                    {msg.content}
                  </div>
                  <p style={{ fontSize: 9, color: "#94A3C0", marginTop: 3, textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                    {timeStr(msg.created_at)}{isMe ? " ✓✓" : ""}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px", borderTop: "0.5px solid #E4EAFB", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div style={{ flex: 1, background: "#F8FAFF", border: "0.5px solid #E4EAFB", borderRadius: 22, padding: "9px 14px" }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Mesaj yazın..."
              rows={1}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#0D1F3C", resize: "none", maxHeight: 80, fontFamily: "inherit" }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1B4FD8,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", flexShrink: 0, opacity: !text.trim() || sending ? 0.4 : 1, transition: "opacity 0.15s" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2 6-2 6 12-6z" fill="white"/>
            </svg>
          </button>
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

    // In-progress sifarişlər üçün qəbul edilmiş offer-i tap
    const inProgressIds = (activeOrders ?? [])
      .filter((o: any) => o.status === "in_progress")
      .map((o: any) => o.id);

    // Accepted offers
    const { data: acceptedOffers } = inProgressIds.length > 0
      ? await supabase
          .from("offers")
          .select("id, job_id, worker_id, price")
          .in("job_id", inProgressIds)
          .eq("status", "accepted")
      : { data: [] };

    // Worker profiles + names
    const workerIds = [...new Set((acceptedOffers ?? []).map((o: any) => o.worker_id))];
    const { data: workerProfiles } = workerIds.length > 0
      ? await supabase
          .from("worker_profiles")
          .select("user_id, rating, review_count")
          .in("user_id", workerIds)
      : { data: [] };
    const { data: workerNames } = workerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", workerIds)
      : { data: [] };

    // Maps
    const wpMap: Record<string, any> = {};
    (workerProfiles ?? []).forEach((w: any) => { wpMap[w.user_id] = w; });
    const wnMap: Record<string, string> = {};
    (workerNames ?? []).forEach((p: any) => { wnMap[p.id] = p.full_name; });
    const offerByJob: Record<string, any> = {};
    (acceptedOffers ?? []).forEach((o: any) => { offerByJob[o.job_id] = o; });

    // Payment status for accepted offers
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

        // Worker info for in_progress
        const acceptedOffer = offerByJob[order.id] ?? null;
        const worker = acceptedOffer ? {
          id: acceptedOffer.worker_id,
          name: wnMap[acceptedOffer.worker_id] ?? "Usta",
          rating: wpMap[acceptedOffer.worker_id]?.rating ?? 0,
          reviewCount: wpMap[acceptedOffer.worker_id]?.review_count ?? 0,
          offerId: acceptedOffer.id,
        } : null;

        return {
          ...order,
          categories: catMap[order.category_id] ?? null,
          offerCount: count ?? 0,
          worker,
          paymentStatus: payStatusMap[acceptedOffer?.id ?? ""] ?? null,
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
                <TrackingCard key={order.id} order={order} onReload={load} />
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
