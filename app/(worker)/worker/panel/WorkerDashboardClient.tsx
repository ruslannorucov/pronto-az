"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import SendOfferModal from "@/components/SendOfferModal";

interface JobRequest {
  id: string;
  category_name: string;
  sub_category_name: string | null;
  address: string;
  description: string;
  time_type: "exact" | "flexible";
  exact_datetime: string | null;
  urgency: string | null;
  preferred_time: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  offer_count: number;
}

interface ActiveOffer {
  id: string;
  job_id: string;
  price: number;
  status: "accepted" | "pending";
  job: {
    id: string;
    category_name: string;
    address: string;
    description: string;
    time_type: "exact" | "flexible";
    exact_datetime: string | null;
    urgency: string | null;
    preferred_time: string | null;
    status: string;
    customer_name: string;
  };
  payment_status: string | null;
}

interface PendingOffer {
  id: string;
  job_id: string;
  price: number;
  note: string | null;
  created_at: string;
  job: {
    category_name: string;
    address: string;
    time_type: string;
    exact_datetime: string | null;
    urgency: string | null;
    preferred_time: string | null;
  };
}

interface HistoryOffer {
  id: string;
  price: number;
  job: { category_name: string; created_at: string; };
  review: { rating: number } | null;
}

interface Props {
  userId: string;
  fullName: string;
  rating: number;
  reviewCount: number;
  categoryId: string | null;
  isActive: boolean;
  isVerified: boolean;
}

function formatTimeLabel(job: { time_type: string; exact_datetime: string | null; urgency: string | null; preferred_time: string | null; }): string {
  if (job.time_type === "exact" && job.exact_datetime) {
    return new Date(job.exact_datetime).toLocaleString("az-AZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  const urgencyMap: Record<string, string> = { today: "Bu gün", this_week: "Bu həftə", flexible: "Çevik" };
  const timeMap: Record<string, string> = { morning: "Səhər", afternoon: "Gündüz", evening: "Axşam" };
  const u = urgencyMap[job.urgency ?? ""] ?? "Çevik";
  const t = timeMap[job.preferred_time ?? ""] ?? "";
  return t ? `${u} · ${t}` : u;
}

function formatPriceId(id: string) { return `#PRN-${id.slice(0, 4).toUpperCase()}`; }

const AZ_MONTHS_SHORT = ["Yan","Fev","Mar","Apr","May","İyn","İyl","Avq","Sen","Okt","Noy","Dek"];

function formatTimeBadge(job: { time_type: string; exact_datetime: string | null; urgency: string | null; preferred_time: string | null; }): { label: string; sub: string; color: string; bg: string } {
  if (job.time_type === "exact" && job.exact_datetime) {
    const d = new Date(job.exact_datetime);
    const day = d.getDate();
    const month = AZ_MONTHS_SHORT[d.getMonth()];
    const hours = String(d.getHours()).padStart(2,"0");
    const mins = String(d.getMinutes()).padStart(2,"0");
    return { label: `${day} ${month}`, sub: `${hours}:${mins}`, color: "#1B4FD8", bg: "#EFF4FF" };
  }
  if (job.urgency === "today") return { label: "Bu gün", sub: "", color: "#92400E", bg: "#FEF3C7" };
  if (job.urgency === "this_week") return { label: "Bu həftə", sub: "", color: "#065F46", bg: "#D1FAE5" };
  const prefMap: Record<string, string> = { "09:00–12:00": "Səhər", "12:00–18:00": "Gündüz", "18:00–21:00": "Axşam" };
  const pref = prefMap[job.preferred_time ?? ""] ?? "";
  return { label: "Çevik", sub: pref, color: "#4A5878", bg: "#F1F5FE" };
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  return `${Math.floor(diff / 86400)} gün əvvəl`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[10px]" style={{ color: "#F59E0B" }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < rating ? "#F59E0B" : "#E4EAFB" }}>★</span>
      ))}
    </span>
  );
}

const STEPS = ["Qəbul", "Ödəniş", "Yolda", "Gəldi", "Bitdi"];

function stepIndex(paymentStatus: string | null, jobStatus: string): number {
  if (jobStatus === "done") return 5;
  if (jobStatus === "in_progress") {
    if (paymentStatus === "released") return 5;
    if (paymentStatus === "held") return 3;
    return 2;
  }
  return 1;
}

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center my-2.5">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <span className="text-[8px] text-center flex-1" style={{
            color: i < currentStep ? "var(--green, #10B981)" : i === currentStep ? "var(--primary, #1B4FD8)" : "var(--text-3, #94A3C0)",
            fontWeight: i <= currentStep ? 700 : 400,
          }}>{s}</span>
          {i < STEPS.length - 1 && (
            <div className="h-[1.5px] flex-[0.4]" style={{ background: i < currentStep - 1 ? "var(--green, #10B981)" : "var(--gray-200, #E4EAFB)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function NextPill({ paymentStatus, jobStatus }: { paymentStatus: string | null; jobStatus: string; }) {
  let label = ""; let style: React.CSSProperties = {};
  if (jobStatus === "in_progress") {
    if (!paymentStatus || paymentStatus === "pending") { label = "→ Ödəniş gözləyir"; style = { background: "#FEF3C7", color: "#92400E" }; }
    else if (paymentStatus === "held") { label = "→ Yola düş"; style = { background: "#EFF4FF", color: "#1B4FD8" }; }
    else if (paymentStatus === "released") { label = "→ İş bitdi"; style = { background: "#D1FAE5", color: "#065F46" }; }
  }
  if (!label) return null;
  return <span className="inline-flex items-center rounded-full px-[7px] py-[1px] text-[9px] font-bold ml-1" style={style}>{label}</span>;
}

function ActionButton({ paymentStatus, offerId, onAction, loading }: { paymentStatus: string | null; offerId: string; onAction: (offerId: string, action: "en_route" | "done") => void; loading: boolean; }) {
  if (!paymentStatus || paymentStatus === "pending") {
    return <button disabled className="flex-[2] py-2 rounded-xl text-[11px] font-bold cursor-not-allowed" style={{ background: "#D1D5DB", color: "#6B7280" }}>Ödəniş gözlənilir</button>;
  }
  if (paymentStatus === "held") {
    return <button onClick={() => onAction(offerId, "en_route")} disabled={loading} className="flex-[2] py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:-translate-y-px active:scale-[0.98] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1B4FD8, #2563EB)", boxShadow: "0 3px 10px rgba(27,79,216,0.25)" }}>{loading ? "..." : "Yola düş →"}</button>;
  }
  if (paymentStatus === "released") {
    return <button onClick={() => onAction(offerId, "done")} disabled={loading} className="flex-[2] py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:-translate-y-px active:scale-[0.98] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 3px 10px rgba(16,185,129,0.25)" }}>{loading ? "..." : "İş bitdi ✓"}</button>;
  }
  return null;
}

// ── Worker Chat Modal ─────────────────────────────────────────────────────────
function WorkerChatModal({ jobId, customerName, onClose }: {
  jobId: string;
  offerId: string;
  customerName: string;
  onClose: () => void;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        await supabase.from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("job_id", jobId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
    };
    init();
    const channel = supabase.channel(`worker-chat-${jobId}`)
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

  function getInit(name: string) {
    return name.trim().split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  }

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
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#0A7A4F,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
            {getInit(customerName)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C" }}>{customerName}</p>
            <p style={{ fontSize: 10, color: "#1B4FD8", marginTop: 1 }}>● Aktiv sifariş</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F8FAFF", border: "0.5px solid #E4EAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#4A5878", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 32 }}>
              <p style={{ fontSize: 12, color: "#94A3C0" }}>Müştəri ilə söhbəti başladın 👋</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                {!isMe && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0A7A4F,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
                    {getInit(customerName)}
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

export default function WorkerDashboardClient({ userId, fullName, rating, categoryId }: Props) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [newJobs, setNewJobs] = useState<JobRequest[]>([]);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const [activeOffers, setActiveOffers] = useState<ActiveOffer[]>([]);
  const [history, setHistory] = useState<HistoryOffer[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [sentOfferIds, setSentOfferIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<JobRequest | null>(null);
  const [chatOffer, setChatOffer] = useState<ActiveOffer | null>(null);
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Fetch new jobs — join olmadan ──────────────────────────────────────────
  const fetchNewJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      // 1. job_requests çək
      let query = supabase
        .from("job_requests")
        .select("id, address, description, time_type, exact_datetime, urgency, preferred_time, location_lat, location_lng, created_at, category_id, sub_category_id")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (categoryId) query = query.eq("category_id", categoryId);

      const { data: jobsRaw, error } = await query;
      if (error) throw error;

      // 2. Offer sayları
      const jobIds = (jobsRaw ?? []).map((j: any) => j.id);
      const { data: offersRaw } = jobIds.length > 0
        ? await supabase.from("offers").select("job_id").in("job_id", jobIds)
        : { data: [] };

      // 3. Öz offer-lərim
      const { data: myOffers } = await supabase.from("offers").select("job_id").eq("worker_id", userId);
      const myJobIds = new Set((myOffers ?? []).map((o: any) => o.job_id));

      // 4. Kategoriyalar
      const catIds = [...new Set((jobsRaw ?? []).map((j: any) => j.category_id).filter(Boolean))];
      const subCatIds = [...new Set((jobsRaw ?? []).map((j: any) => j.sub_category_id).filter(Boolean))];
      const allCatIds = [...new Set([...catIds, ...subCatIds])];
      const { data: catsData } = allCatIds.length > 0
        ? await supabase.from("categories").select("id, name_az").in("id", allCatIds)
        : { data: [] };
      const catMap: Record<string, string> = {};
      (catsData ?? []).forEach((c: any) => { catMap[c.id] = c.name_az; });

      // Offer count map
      const offerCountMap: Record<string, number> = {};
      (offersRaw ?? []).forEach((o: any) => { offerCountMap[o.job_id] = (offerCountMap[o.job_id] ?? 0) + 1; });

      const jobs: JobRequest[] = (jobsRaw ?? [])
        .filter((d: any) => !myJobIds.has(d.id))
        .map((d: any) => ({
          id: d.id,
          category_name: catMap[d.category_id] ?? "Xidmət",
          sub_category_name: d.sub_category_id ? catMap[d.sub_category_id] ?? null : null,
          address: d.address,
          description: d.description,
          time_type: d.time_type,
          exact_datetime: d.exact_datetime,
          urgency: d.urgency,
          preferred_time: d.preferred_time,
          location_lat: d.location_lat,
          location_lng: d.location_lng,
          created_at: d.created_at,
          offer_count: offerCountMap[d.id] ?? 0,
        }));

      setNewJobs(jobs);
    } catch (err) {
      console.error("fetchNewJobs error:", err);
    } finally {
      setLoadingJobs(false);
    }
  }, [supabase, userId, categoryId]);

  // ── Fetch active offers — RPC ilə (RLS bypass) ────────────────────────────
  const fetchActiveOffers = useCallback(async () => {
    setLoadingActive(true);
    try {
      const { data: rows, error } = await supabase
        .rpc("get_worker_active_jobs", { p_worker_id: userId });
      if (error) throw error;

      if (!rows || rows.length === 0) { setActiveOffers([]); setLoadingActive(false); return; }

      // Kategoriyalar
      const catIds = [...new Set(rows.map((r: any) => r.job_category_id).filter(Boolean))];
      const { data: catsData } = catIds.length > 0
        ? await supabase.from("categories").select("id, name_az").in("id", catIds)
        : { data: [] };
      const catMap: Record<string, string> = {};
      (catsData ?? []).forEach((c: any) => { catMap[c.id] = c.name_az; });

      // Müştəri adları
      const custIds = [...new Set(rows.map((r: any) => r.job_customer_id).filter(Boolean))];
      const { data: custsData } = custIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", custIds)
        : { data: [] };
      const custMap: Record<string, string> = {};
      (custsData ?? []).forEach((c: any) => { custMap[c.id] = c.full_name; });

      const offers: ActiveOffer[] = rows.map((r: any) => ({
        id: r.offer_id,
        job_id: r.job_id,
        price: r.offer_price,
        status: r.offer_status,
        job: {
          id: r.job_id,
          category_name: catMap[r.job_category_id] ?? "Xidmət",
          address: r.job_address,
          description: r.job_description,
          time_type: r.job_time_type,
          exact_datetime: r.job_exact_datetime,
          urgency: r.job_urgency,
          preferred_time: r.job_preferred_time,
          status: r.job_status,
          customer_name: custMap[r.job_customer_id] ?? "Müştəri",
        },
        payment_status: r.payment_status ?? null,
      })).sort((a: ActiveOffer, b: ActiveOffer) => {
        const ta = a.job.exact_datetime ? new Date(a.job.exact_datetime).getTime() : 0;
        const tb = b.job.exact_datetime ? new Date(b.job.exact_datetime).getTime() : 0;
        return ta - tb;
      });

      setActiveOffers(offers);
    } catch (err) {
      console.error("fetchActiveOffers error:", err);
    } finally {
      setLoadingActive(false);
    }
  }, [supabase, userId]);

  // ── Fetch pending offers ──────────────────────────────────────────────────────
  const fetchPendingOffers = useCallback(async () => {
    setLoadingPending(true);
    try {
      const { data: offersRaw } = await supabase
        .from("offers")
        .select("id, price, note, created_at, job_id, status")
        .eq("worker_id", userId)
        .in("status", ["pending", "rejected"])
        .order("created_at", { ascending: false });

      if (!offersRaw || offersRaw.length === 0) { setPendingOffers([]); setLoadingPending(false); return; }

      const jobIds = offersRaw.map((o: any) => o.job_id);
      const { data: jobsRaw } = await supabase
        .from("job_requests")
        .select("id, address, time_type, exact_datetime, urgency, preferred_time, category_id")
        .in("id", jobIds);

      const catIds = [...new Set((jobsRaw ?? []).map((j: any) => j.category_id).filter(Boolean))];
      const { data: catsData } = catIds.length > 0
        ? await supabase.from("categories").select("id, name_az").in("id", catIds)
        : { data: [] };
      const catMap: Record<string, string> = {};
      (catsData ?? []).forEach((c: any) => { catMap[c.id] = c.name_az; });

      const jobMap: Record<string, any> = {};
      (jobsRaw ?? []).forEach((j: any) => { jobMap[j.id] = j; });

      const items: PendingOffer[] = offersRaw
        .filter((o: any) => jobMap[o.job_id])
        .map((o: any) => {
          const j = jobMap[o.job_id];
          return {
            id: o.id,
            job_id: o.job_id,
            price: o.price,
            note: o.note,
            created_at: o.created_at,
            status: o.status,
            job: {
              category_name: catMap[j.category_id] ?? "Xidmət",
              address: j.address,
              time_type: j.time_type,
              exact_datetime: j.exact_datetime,
              urgency: j.urgency,
              preferred_time: j.preferred_time,
            },
          };
        });

      setPendingOffers(items);
    } catch (err) {
      console.error("fetchPendingOffers error:", err);
    } finally {
      setLoadingPending(false);
    }
  }, [supabase, userId]);

  // ── Fetch history ───────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data: offersRaw } = await supabase
        .from("offers").select("id, price, job_id")
        .eq("worker_id", userId).eq("status", "accepted")
        .order("created_at", { ascending: false }).limit(20);

      if (!offersRaw || offersRaw.length === 0) { setHistory([]); setLoadingHistory(false); return; }

      const jobIds = offersRaw.map((o: any) => o.job_id);
      const { data: jobsRaw } = await supabase
        .from("job_requests").select("id, category_id, created_at, status").in("id", jobIds).eq("status", "done");

      const catIds = [...new Set((jobsRaw ?? []).map((j: any) => j.category_id).filter(Boolean))];
      const { data: catsData } = catIds.length > 0
        ? await supabase.from("categories").select("id, name_az").in("id", catIds)
        : { data: [] };
      const catMap: Record<string, string> = {};
      (catsData ?? []).forEach((c: any) => { catMap[c.id] = c.name_az; });

      const offerIds = offersRaw.map((o: any) => o.id);
      const { data: reviewsData } = await supabase
        .from("reviews").select("offer_id, rating").in("offer_id", offerIds);
      const reviewMap: Record<string, number> = {};
      (reviewsData ?? []).forEach((r: any) => { reviewMap[r.offer_id] = r.rating; });

      const jobMap: Record<string, any> = {};
      (jobsRaw ?? []).forEach((j: any) => { jobMap[j.id] = j; });

      const items: HistoryOffer[] = offersRaw
        .filter((o: any) => jobMap[o.job_id])
        .map((o: any) => ({
          id: o.id,
          price: o.price,
          job: { category_name: catMap[jobMap[o.job_id].category_id] ?? "Xidmət", created_at: jobMap[o.job_id].created_at },
          review: reviewMap[o.id] ? { rating: reviewMap[o.id] } : null,
        }));

      setHistory(items);
    } catch (err) {
      console.error("fetchHistory error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase, userId]);

  useEffect(() => { fetchNewJobs(); fetchActiveOffers(); fetchPendingOffers(); }, [fetchNewJobs, fetchActiveOffers, fetchPendingOffers]);
  useEffect(() => { if (activeTab === 2 && history.length === 0) fetchHistory(); }, [activeTab, history.length, fetchHistory]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel("worker-new-jobs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_requests" }, () => fetchNewJobs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchNewJobs]);

  useEffect(() => {
    const channel = supabase.channel("worker-offers")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "offers", filter: `worker_id=eq.${userId}` }, () => fetchActiveOffers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId, fetchActiveOffers]);

  const handlePass = (jobId: string) => setPassedIds(prev => new Set(prev).add(jobId));

  const handleOfferSuccess = (jobId: string) => {
    setSentOfferIds(prev => new Set(prev).add(jobId));
    showToast("✓ Təklifiniz göndərildi! Müştəri bildiriş aldı.");
  };

  const handleAction = async (offerId: string, action: "en_route" | "done") => {
    setActionLoading(offerId);
    try {
      if (action === "en_route") {
        await supabase.from("payments").update({ status: "released" }).eq("offer_id", offerId);
        await supabase.from("worker_profiles").update({ is_en_route: true }).eq("user_id", userId);
      } else {
        const offer = activeOffers.find(o => o.id === offerId);
        if (offer) {
          await supabase.from("job_requests").update({ status: "done" }).eq("id", offer.job_id);
          await supabase.from("worker_profiles").update({ is_en_route: false }).eq("user_id", userId);
        }
      }
      await fetchActiveOffers();
    } catch (err) { console.error("handleAction error:", err); }
    finally { setActionLoading(null); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // ── Withdraw pending offer ────────────────────────────────────────────────────
  const handleWithdraw = async (offerId: string) => {
    try {
      await supabase.from("offers").delete().eq("id", offerId).eq("worker_id", userId);
      await fetchPendingOffers();
      await fetchNewJobs();
      showToast("Təklif geri çəkildi");
    } catch (err) {
      console.error("withdraw error:", err);
    }
  };

  const sortedNewJobs = [
    ...newJobs.filter(j => !passedIds.has(j.id) && !sentOfferIds.has(j.id)),
    ...newJobs.filter(j => passedIds.has(j.id)),
  ];
  const newJobCount = newJobs.filter(j => !passedIds.has(j.id) && !sentOfferIds.has(j.id)).length;
  const totalEarnings = history.reduce((sum, h) => sum + h.price, 0);
  const avgRating = history.filter(h => h.review).length > 0
    ? history.filter(h => h.review).reduce((sum, h) => sum + (h.review?.rating ?? 0), 0) / history.filter(h => h.review).length
    : rating;

  return (
    <div className="min-h-screen bg-[--gray-50]">
      {/* Header */}
      <div className="px-4 py-3 sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)" }}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="text-[15px] font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pronto<span style={{ color: "rgba(255,255,255,0.4)" }}>.az</span>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/65 font-medium">{fullName}</p>
            {rating > 0 && <p className="text-[10px] text-white/45">{rating.toFixed(1)} ★</p>}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-white border-b border-[--gray-200] sticky top-[50px] z-10 max-w-lg mx-auto">
        {(["Yeni işlər", "Aktiv işlərim", "Keçmiş"] as const).map((label, i) => (
          <button key={label} onClick={() => setActiveTab(i as 0 | 1 | 2)}
            className="relative flex-1 text-center py-2.5 text-[11px] font-medium border-b-2 transition-all"
            style={{ color: activeTab === i ? "var(--primary, #1B4FD8)" : "var(--text-3, #94A3C0)", borderBottomColor: activeTab === i ? "var(--primary, #1B4FD8)" : "transparent" }}>
            {label}
            {i === 0 && newJobCount > 0 && (
              <span className="absolute top-[7px] right-[12px] w-[5px] h-[5px] rounded-full" style={{ background: "var(--accent, #E8521A)" }} />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto pb-8">
        {/* TAB 0: YENİ İŞLƏR */}
        {activeTab === 0 && (
          <div>
            {loadingJobs ? (
              <div className="space-y-3 p-3">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" style={{ border: "0.5px solid var(--gray-200)" }} />)}
              </div>
            ) : sortedNewJobs.length === 0 ? (
              <div className="p-6 text-center">
                <div className="bg-white rounded-2xl p-8" style={{ border: "0.5px dashed var(--gray-200)" }}>
                  <p className="text-[13px] font-bold text-[--navy] mb-1">Hal-hazırda yeni sifariş yoxdur</p>
                  <p className="text-[11px] text-[--text-3] leading-relaxed">Yeni sifariş gəldikdə burada görünəcək<br/>və bildiriş alacaqsınız</p>
                </div>
              </div>
            ) : (
              <div className="px-2.5 pt-2">
                <p className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mb-2" style={{ color: "var(--text-3, #94A3C0)" }}>
                  {newJobCount > 0 ? `${newJobCount} yeni sifariş` : "Sifarişlər"}
                </p>
                {sortedNewJobs.map((job) => {
                  const isPassed = passedIds.has(job.id);
                  const isSent = sentOfferIds.has(job.id);
                  const isFull = job.offer_count >= 5;
                  const tb = formatTimeBadge(job);
                  const faded = isPassed || isSent;
                  return (
                    <div key={job.id}>
                      {isPassed && !passedIds.has(sortedNewJobs[0]?.id) && sortedNewJobs.indexOf(job) === sortedNewJobs.findIndex(j => passedIds.has(j.id)) && (
                        <p className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mt-4 mb-2" style={{ color: "#94A3C0" }}>Keçilmiş sifarişlər</p>
                      )}
                      <div style={{
                        background: "#fff",
                        borderRadius: 16,
                        marginBottom: 10,
                        border: faded ? "0.5px solid #F1F5FE" : "1px solid #E4EAFB",
                        opacity: faded ? 0.5 : 1,
                        boxShadow: faded ? "none" : "0 2px 12px rgba(13,31,60,0.06)",
                        transition: "all 0.15s",
                        overflow: "hidden",
                      }}>
                        {/* Top section */}
                        <div style={{ padding: "14px 14px 12px" }}>
                          {/* Row 1: category + badge */}
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1F3C", lineHeight: 1.3 }}>
                                {job.category_name}
                              </p>
                              {job.sub_category_name && (
                                <p style={{ fontSize: 11, color: "#94A3C0", marginTop: 2 }}>{job.sub_category_name}</p>
                              )}
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, flexShrink: 0,
                              ...(isSent ? { background: "#F1F5FE", color: "#94A3C0" }
                                : isPassed ? { background: "#F1F5FE", color: "#94A3C0" }
                                : { background: "#EFF4FF", color: "#1B4FD8" })
                            }}>
                              {isSent ? "Göndərildi" : isPassed ? "Keçildi" : "Yeni"}
                            </span>
                          </div>

                          {/* Row 2: location + time */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" as const }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4A5878" }}>
                              <span style={{ fontSize: 12 }}>📍</span>
                              <span>{job.address?.split(",")[0] ?? "—"}</span>
                            </div>
                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#E4EAFB", flexShrink: 0, display: "inline-block" }} />
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
                              background: tb.bg, color: tb.color,
                            }}>
                              {tb.label}{tb.sub ? <span style={{ opacity: 0.7 }}> · {tb.sub}</span> : null}
                            </span>
                          </div>

                          {/* Row 3: description */}
                          {job.description && (
                            <p style={{
                              fontSize: 12, color: "#94A3C0", lineHeight: 1.55,
                              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                            }}>
                              "{job.description}"
                            </p>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{
                          borderTop: "1px solid #F8FAFF",
                          padding: "10px 14px",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1B4FD8", fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>
                            {formatPriceId(job.id)}
                          </span>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {!isPassed && !isSent && (
                              <button onClick={() => handlePass(job.id)} style={{
                                padding: "6px 12px", borderRadius: 9, fontSize: 11, fontWeight: 500,
                                border: "1px solid #E4EAFB", color: "#94A3C0", background: "transparent", cursor: "pointer",
                              }}>Keç</button>
                            )}
                            <button onClick={() => setDetailJob(job)} style={{
                              padding: "6px 12px", borderRadius: 9, fontSize: 11, fontWeight: 600,
                              border: "1px solid #BFCFFE", color: "#1B4FD8", background: "#EFF4FF", cursor: "pointer",
                            }}>Detallara bax</button>
                            {!isSent && !isFull && !isPassed && (
                              <button onClick={() => setSelectedJob(job)} style={{
                                padding: "6px 14px", borderRadius: 9, fontSize: 11, fontWeight: 700,
                                border: "none", color: "#fff", cursor: "pointer",
                                background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
                                boxShadow: "0 2px 10px rgba(27,79,216,0.3)",
                              }}>Təklif ver</button>
                            )}
                            {isFull && !isSent && (
                              <span style={{ padding: "6px 12px", borderRadius: 9, fontSize: 11, color: "#94A3C0" }}>Doludur</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: AKTİV İŞLƏRİM */}
        {activeTab === 1 && (
          <div className="px-2.5 pt-2">

            {/* ── Gözləyən təkliflər ── */}
            {(loadingPending ? true : pendingOffers.length > 0) && (
              <div className="mb-4">
                <p style={{ fontSize: 9, fontWeight: 700, color: "#94A3C0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, paddingLeft: 2 }}>
                  Gözləyən təkliflər · {pendingOffers.length}
                </p>
                {loadingPending ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[1,2].map(i => <div key={i} style={{ background: "#fff", borderRadius: 12, height: 72, border: "0.5px solid #E4EAFB" }} className="animate-pulse" />)}
                  </div>
                ) : pendingOffers.map((offer: any) => {
                  const tb = formatTimeBadge(offer.job);
                  const isRejected = offer.status === "rejected";
                  return (
                    <div key={offer.id} style={{
                      background: "#fff",
                      border: isRejected ? "1px solid #FECACA" : "1px solid #FCD34D",
                      borderRadius: 12, padding: "11px 13px", marginBottom: 8,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C" }}>{offer.job.category_name}</p>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                          background: isRejected ? "#FEE2E2" : "#FEF3C7",
                          color: isRejected ? "#DC2626" : "#92400E",
                        }}>
                          {isRejected ? "Rədd edildi" : "Cavab gözlənilir"}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: "#94A3C0", marginBottom: 8 }}>
                        📍 {offer.job.address?.split(",")[0]} · {tb.label}{tb.sub ? ` · ${tb.sub}` : ""}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: isRejected ? "#94A3C0" : "#0D1F3C", fontFamily: "'Playfair Display', serif" }}>
                          {offer.price} ₼
                        </p>
                        {!isRejected && (
                          <button
                            onClick={() => handleWithdraw(offer.id)}
                            style={{ fontSize: 10, color: "#94A3C0", background: "none", border: "0.5px solid #E4EAFB", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit" }}>
                            Geri çək
                          </button>
                        )}
                      </div>
                      {offer.note && (
                        <p style={{ fontSize: 10, color: "#4A5878", background: "#F8FAFF", borderRadius: 8, padding: "6px 8px", marginTop: 7, lineHeight: 1.4 }}>
                          "{offer.note}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Aktiv işlər ── */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#94A3C0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, paddingLeft: 2 }}>
                Aktiv işlər · {activeOffers.length}
              </p>
            {loadingActive ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1,2].map(i => <div key={i} style={{ background: "#fff", borderRadius: 12, height: 60, border: "0.5px solid #E4EAFB" }} className="animate-pulse" />)}
              </div>
            ) : activeOffers.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 12, padding: "20px 16px", textAlign: "center", border: "0.5px dashed #E4EAFB" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0D1F3C", marginBottom: 4 }}>Aktiv iş yoxdur</p>
                <p style={{ fontSize: 10, color: "#94A3C0" }}>Müştəri təklifinizi qəbul etdikdən sonra<br/>iş burada görünəcək</p>
              </div>
            ) : (
              <div className="px-2.5 pt-2">
                <p className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mb-2" style={{ color: "var(--text-3)" }}>
                  Bu günün sırası · {activeOffers.length} iş
                </p>
                {activeOffers.map((offer, idx) => {
                  const isOpen = openAccordion === offer.id;
                  const isActive = offer.payment_status === "released";
                  return (
                    <div key={offer.id} className="bg-white rounded-2xl mb-2 overflow-hidden" style={{ border: `1.5px solid ${isActive ? "#A7F3D0" : "#FCD34D"}` }}>
                      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none" onClick={() => setOpenAccordion(isOpen ? null : offer.id)}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
                          style={{ background: isActive ? "linear-gradient(135deg,#1B4FD8,#2563EB)" : "linear-gradient(135deg,#F59E0B,#FBBF24)" }}>{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[--navy] truncate">{offer.job.category_name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
                            {offer.job.address.split(",")[0]} · {formatTimeLabel(offer.job)}
                            <NextPill paymentStatus={offer.payment_status} jobStatus={offer.job.status} />
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isActive && <span className="w-[6px] h-[6px] rounded-full" style={{ background: "#10B981", animation: "pulse 1.5s infinite" }} />}
                          <button onClick={e => { e.stopPropagation(); }} className="w-[26px] h-[26px] rounded-lg flex items-center justify-center transition-colors hover:bg-[--primary-bg]" style={{ border: "0.5px solid var(--gray-200, #E4EAFB)" }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                              <path d="M6.5 1.5C3.7 1.5 1.5 3.4 1.5 5.8c0 .9.3 1.8.9 2.5L1.5 11l2.8-1c.6.3 1.4.5 2.2.5 2.8 0 5-1.9 5-4.2S9.3 1.5 6.5 1.5z" stroke="#1B4FD8" strokeWidth="1.2"/>
                            </svg>
                          </button>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                            <path d="M3 5l4 4 4-4" stroke="#94A3C0" strokeWidth="1.4" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      <div style={{ maxHeight: isOpen ? "400px" : "0", overflow: "hidden", transition: "max-height 0.3s ease" }}>
                        <div className="px-3 pb-3" style={{ borderTop: "0.5px solid var(--gray-100, #F1F5FE)" }}>
                          <div className="flex gap-1.5 mt-2.5 mb-2">
                            {[{ label: "Ünvan", value: offer.job.address.split(",")[0] }, { label: "Qiymət", value: `${offer.price} ₼` }, { label: "Müştəri", value: offer.job.customer_name.split(" ")[0] }].map(({ label, value }) => (
                              <div key={label} className="flex-1 rounded-lg px-2 py-1.5" style={{ background: "var(--gray-50, #F8FAFF)" }}>
                                <p className="text-[9px]" style={{ color: "var(--text-3, #94A3C0)" }}>{label}</p>
                                <p className="text-[11px] font-bold text-[--navy] truncate">{value}</p>
                              </div>
                            ))}
                          </div>
                          <StepProgress currentStep={stepIndex(offer.payment_status, offer.job.status)} />
                          {offer.job.description && (
                            <div className="rounded-lg px-2.5 py-2 mb-2 text-[11px] leading-relaxed" style={{ background: "var(--gray-50, #F8FAFF)", color: "var(--text-2, #4A5878)" }}>
                              &ldquo;{offer.job.description}&rdquo;
                            </div>
                          )}
                          <div className="flex gap-1.5">
                            <button onClick={e => { e.stopPropagation(); setChatOffer(offer); }} className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all hover:bg-[--primary-bg]"
                              style={{ border: "0.5px solid var(--gray-200, #E4EAFB)", color: "var(--primary, #1B4FD8)" }}>💬 Chat</button>
                            <ActionButton paymentStatus={offer.payment_status} offerId={offer.id} onAction={handleAction} loading={actionLoading === offer.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}

        {/* TAB 2: KEÇMİŞ */}
        {activeTab === 2 && (
          <div>
            {loadingHistory ? (
              <div className="space-y-2 p-3">
                {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-14 animate-pulse" style={{ border: "0.5px solid var(--gray-200)" }} />)}
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center">
                <div className="bg-white rounded-2xl p-8" style={{ border: "0.5px dashed var(--gray-200)" }}>
                  <p className="text-[13px] font-bold text-[--navy] mb-1">Hələ tamamlanmış iş yoxdur</p>
                  <p className="text-[11px] text-[--text-3]">Tamamlanan işlər burada görünəcək</p>
                </div>
              </div>
            ) : (
              <div className="px-2.5 pt-2">
                <p className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mb-2" style={{ color: "var(--text-3)" }}>Tamamlanmış işlər · {history.length}</p>
                {history.map(item => (
                  <div key={item.id} className="bg-white rounded-xl mb-1.5 px-3 py-2.5 flex items-center justify-between" style={{ border: "0.5px solid var(--gray-200)" }}>
                    <div>
                      <p className="text-[12px] font-bold text-[--navy]">{item.job.category_name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{timeAgo(item.job.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-[--navy]" style={{ fontFamily: "'Playfair Display', serif" }}>{item.price} ₼</p>
                      {item.review ? <Stars rating={item.review.rating} /> : <p className="text-[9px]" style={{ color: "var(--text-3)" }}>Rəy yoxdur</p>}
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl mt-3 mb-2.5 p-[14px] flex justify-between items-center" style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)" }}>
                  <div>
                    <p className="text-[10px] text-white/60">Ümumi qazandım</p>
                    <p className="text-[22px] font-bold text-white mt-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>{totalEarnings} ₼</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/60">Orta reytinq</p>
                    <p className="text-[18px] font-bold mt-0.5" style={{ color: "#FCD34D" }}>{avgRating > 0 ? avgRating.toFixed(1) : "—"} ★</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ── */}
      {detailJob && (() => {
        const tb = formatTimeBadge(detailJob);
        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(13,31,60,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setDetailJob(null)}
          >
            <div
              className="w-full max-w-lg bg-white"
              style={{ borderRadius: "20px 20px 0 0" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div style={{ width: 32, height: 3, borderRadius: 999, background: "#E4EAFB", margin: "14px auto 0" }} />

              {/* Header */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>🔧</div>
                  <div>
                    <p className="text-[16px] font-bold text-[var(--navy)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {detailJob.category_name}
                    </p>
                    {detailJob.sub_category_name && (
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{detailJob.sub_category_name}</p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] font-bold text-[var(--primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {formatPriceId(detailJob.id)} · {timeAgo(detailJob.created_at)}
                </p>
              </div>

              {/* Ünvan və vaxt */}
              <div className="px-4 mb-3">
                <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-[0.06em] mb-2">Ünvan və vaxt</p>
                <div className="grid grid-cols-2 gap-2">
                  <div style={{ background: "#F8FAFF", borderRadius: 10, padding: "10px 12px" }}>
                    <p className="text-[9px] text-[var(--text-3)] mb-1">📍 Ünvan</p>
                    <p className="text-[12px] font-semibold text-[var(--navy)]">{detailJob.address ?? "—"}</p>
                  </div>
                  <div style={{ background: "#F8FAFF", borderRadius: 10, padding: "10px 12px" }}>
                    <p className="text-[9px] text-[var(--text-3)] mb-1">🕐 Vaxt</p>
                    <p className="text-[12px] font-semibold" style={{ color: tb.color }}>
                      {tb.label}{tb.sub ? ` · ${tb.sub}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Müştəri izahı */}
              {detailJob.description && (
                <div className="px-4 mb-3">
                  <p className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-[0.06em] mb-2">Müştərinin izahı</p>
                  <div style={{ background: "#F8FAFF", borderRadius: 10, padding: "12px 14px" }}>
                    <p className="text-[12px] text-[var(--text-2)] leading-relaxed">&ldquo;{detailJob.description}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Offer sayı */}
              <div className="px-4 mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div style={{ background: "#F8FAFF", borderRadius: 10, padding: "10px 12px" }}>
                    <p className="text-[9px] text-[var(--text-3)] mb-1">Təklif sayı</p>
                    <p className="text-[12px] font-semibold text-[var(--navy)]">{detailJob.offer_count} / 5</p>
                  </div>
                  <div style={{ background: "#F8FAFF", borderRadius: 10, padding: "10px 12px" }}>
                    <p className="text-[9px] text-[var(--text-3)] mb-1">Status</p>
                    <p className="text-[12px] font-semibold text-[#1B4FD8]">Açıq</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 0.5, background: "#E4EAFB", margin: "0 16px 14px" }} />

              {/* Actions */}
              <div className="px-4 pb-6 flex gap-2">
                <button
                  onClick={() => { handlePass(detailJob.id); setDetailJob(null); }}
                  style={{ flex: 1, padding: "11px", borderRadius: 12, border: "0.5px solid #E4EAFB", color: "#94A3C0", background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Keç
                </button>
                {detailJob.offer_count < 5 && !sentOfferIds.has(detailJob.id) && (
                  <button
                    onClick={() => { setSelectedJob(detailJob); setDetailJob(null); }}
                    style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", color: "#fff", background: "linear-gradient(135deg,#1B4FD8,#2563EB)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(27,79,216,0.25)" }}>
                    Təklif ver →
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── WORKER CHAT MODAL ── */}
      {chatOffer && (
        <WorkerChatModal
          jobId={chatOffer.job_id}
          customerName={chatOffer.job.customer_name}
          offerId={chatOffer.id}
          onClose={() => setChatOffer(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <div className="rounded-xl px-4 py-3 text-[12px] font-semibold text-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", border: "1px solid #6EE7B7", color: "#065F46" }}>
            {toast}
          </div>
        </div>
      )}

      {selectedJob && (
        <SendOfferModal job={selectedJob} workerId={userId} onClose={() => setSelectedJob(null)} onSuccess={handleOfferSuccess} />
      )}
    </div>
  );
}
