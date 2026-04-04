"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const AZ_MONTHS_SHORT = ["Yan","Fev","Mar","Apr","May","İyn","İyl","Avq","Sen","Okt","Noy","Dek"];

function formatTime(job: { time_type: string; exact_datetime: string | null; urgency: string | null; preferred_time: string | null }): string {
  if (job.time_type === "exact" && job.exact_datetime) {
    const d = new Date(job.exact_datetime);
    return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  const urgMap: Record<string,string> = { today: "Bu gün", this_week: "Bu həftə", flexible: "Çevik" };
  const prefMap: Record<string,string> = { "09:00–12:00": "Səhər (09:00–12:00)", "12:00–18:00": "Gündüz (12:00–18:00)", "18:00–21:00": "Axşam (18:00–21:00)" };
  const u = urgMap[job.urgency ?? ""] ?? "Çevik";
  const p = prefMap[job.preferred_time ?? ""] ?? "";
  return p ? `${u} · ${p}` : u;
}

function getInitials(name: string): string {
  return name.trim().split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
}

const AV_COLORS = [
  "linear-gradient(135deg,#1B4FD8,#2563EB)",
  "linear-gradient(135deg,#0A7A4F,#10B981)",
  "linear-gradient(135deg,#6D28D9,#7C3AED)",
  "linear-gradient(135deg,#B45309,#D97706)",
  "linear-gradient(135deg,#C2410C,#EA580C)",
  "linear-gradient(135deg,#0369A1,#0EA5E9)",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: size, color: i < Math.round(rating) ? "#F59E0B" : "#E4EAFB" }}>★</span>
      ))}
    </span>
  );
}

const EXP_LABELS: Record<string,string> = {
  lt1: "1 ildən az", "1-4": "1–4 il", "5-9": "5–9 il", "10plus": "10+ il",
};

type SortType = "rating" | "price" | "time";

// ─── Types ────────────────────────────────────────────────────────────────────

type Job = {
  id: string;
  description: string;
  address: string | null;
  status: string;
  time_type: string;
  exact_datetime: string | null;
  urgency: string | null;
  preferred_time: string | null;
  category_id: string;
  customer_id: string;
  category: { name_az: string; icon: string } | null;
};

type Offer = {
  id: string;
  price: number;
  note: string | null;
  eta_hours: number | null;
  created_at: string;
  worker_id: string;
  workerName: string;
  rating: number;
  reviewCount: number;
  experienceRange: string | null;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sort, setSort] = useState<SortType>("rating");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!jobId) return;
    load();
  }, [jobId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // 1. Job
      const { data: jobRaw, error: jobErr } = await supabase
        .from("job_requests")
        .select("id, description, address, status, time_type, exact_datetime, urgency, preferred_time, category_id, customer_id")
        .eq("id", jobId)
        .single();

      if (jobErr || !jobRaw) { router.push("/dashboard"); return; }
      if (jobRaw.customer_id !== user.id) { router.push("/dashboard"); return; }

      // 2. Category
      const { data: catRaw } = await supabase
        .from("categories")
        .select("name_az, icon")
        .eq("id", jobRaw.category_id)
        .single();

      setJob({ ...jobRaw, category: catRaw ?? null });

      // 3. Pending offers
      const { data: offersRaw } = await supabase
        .from("offers")
        .select("id, price, note, eta_hours, created_at, worker_id")
        .eq("job_id", jobId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (!offersRaw || offersRaw.length === 0) {
        setOffers([]);
        setLoading(false);
        return;
      }

      // 4. Worker profiles
      const workerIds = offersRaw.map((o: any) => o.worker_id);
      const { data: wpRaw } = await supabase
        .from("worker_profiles")
        .select("user_id, rating, review_count, experience_range")
        .in("user_id", workerIds);

      // 5. Profiles (name)
      const { data: profRaw } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", workerIds);

      const wpMap: Record<string, any> = {};
      (wpRaw ?? []).forEach((w: any) => { wpMap[w.user_id] = w; });
      const profMap: Record<string, string> = {};
      (profRaw ?? []).forEach((p: any) => { profMap[p.id] = p.full_name; });

      const merged: Offer[] = offersRaw.map((o: any) => ({
        id: o.id,
        price: o.price,
        note: o.note,
        eta_hours: o.eta_hours,
        created_at: o.created_at,
        worker_id: o.worker_id,
        workerName: profMap[o.worker_id] ?? "Usta",
        rating: wpMap[o.worker_id]?.rating ?? 0,
        reviewCount: wpMap[o.worker_id]?.review_count ?? 0,
        experienceRange: wpMap[o.worker_id]?.experience_range ?? null,
      }));

      setOffers(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId: string) => {
    setAccepting(offerId);
    setConfirmId(null);
    try {
      // 1. Seçilmiş offer → accepted
      const { error } = await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offerId);
      if (error) throw error;

      // 2. Qalan offer-lər → rejected
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("job_id", jobId)
        .neq("id", offerId);

      // 3. Job → in_progress
      await supabase
        .from("job_requests")
        .update({ status: "in_progress" })
        .eq("id", jobId);

      showToast("Usta seçildi! Sifariş aktivdir.", "ok");
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (e) {
      console.error(e);
      showToast("Xəta baş verdi. Yenidən cəhd edin.", "err");
      setAccepting(null);
    }
  };

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sortedOffers = [...offers].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price")  return a.price - b.price;
    if (sort === "time")   return (a.eta_hours ?? 99) - (b.eta_hours ?? 99);
    return 0;
  });

  // ── Confirm Modal ──────────────────────────────────────────────────────────
  const confirmOffer = confirmId ? offers.find(o => o.id === confirmId) : null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #E4EAFB", borderTopColor: "#1B4FD8", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 12, color: "#94A3C0", fontFamily: "sans-serif" }}>Yüklənir...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFF", fontFamily: "-apple-system, 'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .offer-card { animation: fadeUp 0.3s ease both; }
        .accept-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        .accept-btn:active { transform: scale(0.98); }
        .sort-chip:hover { border-color: #BFCFFE !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "linear-gradient(135deg,#0D1F3C 0%,#162F6A 100%)", paddingBottom: 20 }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 180, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(27,79,216,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(27,79,216,0.06) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div style={{ position: "relative", padding: "16px 16px 0", maxWidth: 480, margin: "0 auto" }}>
          {/* Back */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Link href="/dashboard" style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", textDecoration: "none", fontSize: 16, flexShrink: 0,
            }}>←</Link>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}>
                {job.category?.icon} {job.category?.name_az}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                #{job.id.slice(0,4).toUpperCase()} · {offers.length} təklif gəldi
              </p>
            </div>
          </div>

          {/* Job summary card */}
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "13px 14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: job.description ? 10 : 0 }}>
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>📍 Ünvan</p>
                <p style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{job.address ?? "—"}</p>
              </div>
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>🕐 Vaxt</p>
                <p style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{formatTime(job)}</p>
              </div>
            </div>
            {job.description && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 9, marginTop: 2 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  "{job.description}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SORT CHIPS ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E4EAFB", padding: "10px 16px", display: "flex", gap: 6, maxWidth: 480, margin: "0 auto" }}>
        {([
          { key: "rating", label: "⭐ Reytinq" },
          { key: "price",  label: "💰 Qiymət" },
          { key: "time",   label: "⚡ Ən tez"  },
        ] as { key: SortType; label: string }[]).map(s => (
          <button key={s.key} className="sort-chip" onClick={() => setSort(s.key)} style={{
            padding: "5px 13px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            cursor: "pointer", border: "1.5px solid", transition: "all 0.15s", fontFamily: "inherit",
            borderColor: sort === s.key ? "#1B4FD8" : "#E4EAFB",
            background:   sort === s.key ? "#EFF4FF" : "#fff",
            color:        sort === s.key ? "#1B4FD8" : "#94A3C0",
          }}>{s.label}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#94A3C0", alignSelf: "center" }}>
          {offers.length} usta
        </span>
      </div>

      {/* ── OFFERS ── */}
      <div style={{ padding: "14px 16px 40px", maxWidth: 480, margin: "0 auto" }}>

        {offers.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 16px", textAlign: "center", border: "1px dashed #E4EAFB" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1F3C", marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>
              Hələ təklif gəlməyib
            </p>
            <p style={{ fontSize: 12, color: "#94A3C0", lineHeight: 1.6 }}>
              Ustalar sifarişinizi görüb<br/>tezliklə təklif göndərəcək
            </p>
          </div>
        ) : sortedOffers.map((offer, idx) => {
          const isBest = idx === 0;
          const initials = getInitials(offer.workerName);
          const avColor = avatarColor(offer.workerName);
          const delay = `${idx * 0.07}s`;

          return (
            <div key={offer.id} className="offer-card" style={{
              animationDelay: delay,
              background: "#fff",
              border: isBest ? "1.5px solid #1B4FD8" : "1px solid #E4EAFB",
              borderRadius: 18,
              marginBottom: 12,
              overflow: "hidden",
              boxShadow: isBest
                ? "0 6px 24px rgba(27,79,216,0.12)"
                : "0 2px 10px rgba(13,31,60,0.05)",
            }}>
              {/* Best banner */}
              {isBest && (
                <div style={{ background: "linear-gradient(90deg,#EFF4FF,#E8EFFE)", borderBottom: "1px solid #BFCFFE", padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>⭐</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#1B4FD8" }}>Ən yaxşı seçim</span>
                </div>
              )}

              <div style={{ padding: "16px" }}>
                {/* Worker info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: avColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 700, color: "#fff",
                    fontFamily: "'Playfair Display', serif",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0D1F3C", marginBottom: 3, fontFamily: "'Playfair Display', serif" }}>
                      {offer.workerName}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Stars rating={offer.rating} size={12} />
                      <span style={{ fontSize: 11, color: "#94A3C0" }}>
                        {offer.rating > 0 ? offer.rating.toFixed(1) : "—"} · {offer.reviewCount} rəy
                      </span>
                    </div>
                  </div>
                  {/* Price */}
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 22, fontWeight: 700, color: "#1B4FD8", lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
                      {offer.price}
                    </p>
                    <p style={{ fontSize: 11, color: "#94A3C0", marginTop: 1 }}>₼</p>
                  </div>
                </div>

                {/* Details row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Vaxt", value: offer.eta_hours ? `${offer.eta_hours} saat ərzində` : "Müzakirə ediləcək" },
                    { label: "Təcrübə", value: EXP_LABELS[offer.experienceRange ?? ""] ?? "Göstərilməyib" },
                    { label: "Reytinq", value: offer.rating > 0 ? `${offer.rating.toFixed(1)} / 5.0` : "Yeni usta" },
                  ].map(d => (
                    <div key={d.label} style={{ background: "#F8FAFF", borderRadius: 10, padding: "9px 10px", border: "0.5px solid #F1F5FE" }}>
                      <p style={{ fontSize: 9, color: "#94A3C0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{d.label}</p>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#0D1F3C", lineHeight: 1.3 }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Note */}
                {offer.note && (
                  <div style={{ background: "#F8FAFF", border: "0.5px solid #F1F5FE", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                    <p style={{ fontSize: 9, color: "#94A3C0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>Ustanın qeydi</p>
                    <p style={{ fontSize: 12, color: "#4A5878", lineHeight: 1.6 }}>"{offer.note}"</p>
                  </div>
                )}

                {/* Accept button */}
                <button
                  className="accept-btn"
                  onClick={() => setConfirmId(offer.id)}
                  disabled={!!accepting}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 13,
                    border: "none", fontSize: 13, fontWeight: 700, cursor: accepting ? "not-allowed" : "pointer",
                    color: "#fff", opacity: accepting ? 0.7 : 1,
                    background: isBest
                      ? "linear-gradient(135deg,#1B4FD8,#2563EB)"
                      : "linear-gradient(135deg,#4A5878,#64748B)",
                    boxShadow: isBest
                      ? "0 4px 16px rgba(27,79,216,0.35)"
                      : "0 4px 12px rgba(74,88,120,0.2)",
                    transition: "all 0.15s", fontFamily: "inherit",
                    letterSpacing: "0.01em",
                  }}
                >
                  {accepting === offer.id
                    ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                        Seçilir...
                      </span>
                    : `✓ ${offer.workerName.split(" ")[0]}-i seç`
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CONFIRM MODAL ── */}
      {confirmOffer && (
        <div
          onClick={() => setConfirmId(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(13,31,60,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", width: "100%", maxWidth: 480,
              borderRadius: "20px 20px 0 0", padding: "0 0 32px",
              animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
              fontFamily: "inherit",
            }}
          >
            <div style={{ width: 36, height: 3, background: "#E4EAFB", borderRadius: 999, margin: "14px auto 0" }} />
            <div style={{ padding: "20px 20px 0" }}>
              {/* Worker avatar + name */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: avatarColor(confirmOffer.workerName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#fff",
                  fontFamily: "'Playfair Display', serif", marginBottom: 10,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                }}>{getInitials(confirmOffer.workerName)}</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#0D1F3C", fontFamily: "'Playfair Display', serif" }}>
                  {confirmOffer.workerName}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Stars rating={confirmOffer.rating} size={13} />
                  <span style={{ fontSize: 12, color: "#94A3C0" }}>{confirmOffer.reviewCount} rəy</span>
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: "#F8FAFF", borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: "0.5px solid #E4EAFB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#94A3C0" }}>Qiymət</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1B4FD8", fontFamily: "'Playfair Display', serif" }}>{confirmOffer.price} ₼</span>
                </div>
                {confirmOffer.eta_hours && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#94A3C0" }}>Gəlmə vaxtı</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0D1F3C" }}>{confirmOffer.eta_hours} saat ərzində</span>
                  </div>
                )}
                {confirmOffer.note && (
                  <div style={{ borderTop: "0.5px solid #E4EAFB", paddingTop: 8, marginTop: 4 }}>
                    <p style={{ fontSize: 11, color: "#4A5878", lineHeight: 1.5 }}>"{confirmOffer.note}"</p>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 11, color: "#94A3C0", textAlign: "center", marginBottom: 16, lineHeight: 1.6 }}>
                Bu ustanı seçdikdən sonra digər təkliflər avtomatik rədd ediləcək. Usta sizinlə əlaqə saxlayacaq.
              </p>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmId(null)}
                  style={{
                    flex: 1, padding: "13px", borderRadius: 13,
                    border: "1.5px solid #E4EAFB", color: "#94A3C0", background: "#fff",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >Ləğv et</button>
                <button
                  onClick={() => handleAccept(confirmOffer.id)}
                  style={{
                    flex: 2, padding: "13px", borderRadius: 13,
                    border: "none", color: "#fff",
                    background: "linear-gradient(135deg,#1B4FD8,#2563EB)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    boxShadow: "0 4px 16px rgba(27,79,216,0.35)",
                  }}
                >✓ Təsdiqlə</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "ok" ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)" : "#FEE2E2",
          border: `1px solid ${toast.type === "ok" ? "#6EE7B7" : "#FECACA"}`,
          color: toast.type === "ok" ? "#065F46" : "#DC2626",
          padding: "11px 22px", borderRadius: 11,
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" as const,
          boxShadow: "0 8px 28px rgba(0,0,0,0.14)", zIndex: 9999, fontFamily: "inherit",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
