"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import SendOfferModal from "@/components/SendOfferModal";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface HistoryOffer {
  id: string;
  price: number;
  job: {
    category_name: string;
    created_at: string;
  };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeLabel(job: {
  time_type: string;
  exact_datetime: string | null;
  urgency: string | null;
  preferred_time: string | null;
}): string {
  if (job.time_type === "exact" && job.exact_datetime) {
    return new Date(job.exact_datetime).toLocaleString("az-AZ", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const urgencyMap: Record<string, string> = {
    today: "Bu gün",
    this_week: "Bu həftə",
    flexible: "Çevik",
  };
  const timeMap: Record<string, string> = {
    morning: "Səhər",
    afternoon: "Gündüz",
    evening: "Axşam",
  };
  const u = urgencyMap[job.urgency ?? ""] ?? "Çevik";
  const t = timeMap[job.preferred_time ?? ""] ?? "";
  return t ? `${u} · ${t}` : u;
}

function formatPriceId(id: string) {
  return `#PRN-${id.slice(0, 4).toUpperCase()}`;
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
        <span key={i} style={{ color: i < rating ? "#F59E0B" : "#E4EAFB" }}>
          ★
        </span>
      ))}
    </span>
  );
}

// ─── Step Progress ─────────────────────────────────────────────────────────────

const STEPS = ["Qəbul", "Ödəniş", "Yolda", "Gəldi", "Bitdi"];

function stepIndex(paymentStatus: string | null, jobStatus: string): number {
  if (jobStatus === "done") return 5;
  if (jobStatus === "in_progress") {
    if (paymentStatus === "released") return 5;
    if (paymentStatus === "held") return 3; // en_route
    return 2; // paid, not yet en route
  }
  if (paymentStatus === "held") return 1;
  return 1;
}

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center my-2.5">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <span
            className="text-[8px] text-center flex-1"
            style={{
              color:
                i < currentStep
                  ? "var(--green, #10B981)"
                  : i === currentStep
                  ? "var(--primary, #1B4FD8)"
                  : "var(--text-3, #94A3C0)",
              fontWeight: i <= currentStep ? 700 : 400,
            }}
          >
            {s}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className="h-[1.5px] flex-[0.4]"
              style={{
                background:
                  i < currentStep - 1
                    ? "var(--green, #10B981)"
                    : "var(--gray-200, #E4EAFB)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Next Step Pill ────────────────────────────────────────────────────────────

function NextPill({
  paymentStatus,
  jobStatus,
}: {
  paymentStatus: string | null;
  jobStatus: string;
}) {
  let label = "";
  let style: React.CSSProperties = {};

  if (jobStatus === "in_progress") {
    if (!paymentStatus || paymentStatus === "pending") {
      label = "→ Ödəniş gözləyir";
      style = { background: "#FEF3C7", color: "#92400E" };
    } else if (paymentStatus === "held") {
      label = "→ Yola düş";
      style = { background: "#EFF4FF", color: "#1B4FD8" };
    } else if (paymentStatus === "released") {
      label = "→ İş bitdi";
      style = { background: "#D1FAE5", color: "#065F46" };
    }
  }

  if (!label) return null;

  return (
    <span
      className="inline-flex items-center rounded-full px-[7px] py-[1px] text-[9px] font-bold ml-1"
      style={style}
    >
      {label}
    </span>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────────────

function ActionButton({
  paymentStatus,
  offerId,
  onAction,
  loading,
}: {
  paymentStatus: string | null;
  offerId: string;
  onAction: (offerId: string, action: "en_route" | "done") => void;
  loading: boolean;
}) {
  if (!paymentStatus || paymentStatus === "pending") {
    return (
      <button
        disabled
        className="flex-[2] py-2 rounded-xl text-[11px] font-bold cursor-not-allowed"
        style={{ background: "#D1D5DB", color: "#6B7280" }}
      >
        Ödəniş gözlənilir
      </button>
    );
  }
  if (paymentStatus === "held") {
    return (
      <button
        onClick={() => onAction(offerId, "en_route")}
        disabled={loading}
        className="flex-[2] py-2 rounded-xl text-[11px] font-bold text-white
                   transition-all hover:-translate-y-px active:scale-[0.98] disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
          boxShadow: "0 3px 10px rgba(27,79,216,0.25)",
        }}
      >
        {loading ? "..." : "Yola düş →"}
      </button>
    );
  }
  if (paymentStatus === "released") {
    return (
      <button
        onClick={() => onAction(offerId, "done")}
        disabled={loading}
        className="flex-[2] py-2 rounded-xl text-[11px] font-bold text-white
                   transition-all hover:-translate-y-px active:scale-[0.98] disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #10B981, #34D399)",
          boxShadow: "0 3px 10px rgba(16,185,129,0.25)",
        }}
      >
        {loading ? "..." : "İş bitdi ✓"}
      </button>
    );
  }
  return null;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function WorkerDashboardClient({
  userId,
  fullName,
  rating,
  categoryId,
}: Props) {
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ── Fetch new jobs ──────────────────────────────────────────────────────────
  const fetchNewJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      let query = supabase
        .from("job_requests")
        .select(`
          id, address, description, time_type, exact_datetime,
          urgency, preferred_time, location_lat, location_lng, created_at,
          categories!job_requests_category_id_fkey(name_az),
          sub:categories!job_requests_sub_category_id_fkey(name_az),
          offers(id)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter out jobs where worker already sent an offer
      const { data: myOffers } = await supabase
        .from("offers")
        .select("job_id")
        .eq("worker_id", userId);

      const myJobIds = new Set((myOffers ?? []).map((o) => o.job_id));

      const jobs: JobRequest[] = (data ?? [])
        .filter((d: any) => !myJobIds.has(d.id))
        .map((d: any) => ({
          id: d.id,
          category_name: d.categories?.name_az ?? "Xidmət",
          sub_category_name: d.sub?.name_az ?? null,
          address: d.address,
          description: d.description,
          time_type: d.time_type,
          exact_datetime: d.exact_datetime,
          urgency: d.urgency,
          preferred_time: d.preferred_time,
          location_lat: d.location_lat,
          location_lng: d.location_lng,
          created_at: d.created_at,
          offer_count: d.offers?.length ?? 0,
        }));

      setNewJobs(jobs);
    } catch (err) {
      console.error("fetchNewJobs error:", err);
    } finally {
      setLoadingJobs(false);
    }
  }, [supabase, userId, categoryId]);

  // ── Fetch active offers ─────────────────────────────────────────────────────
  const fetchActiveOffers = useCallback(async () => {
    setLoadingActive(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          id, price, status, job_id,
          job_requests!offers_job_id_fkey(
            id, address, description, time_type, exact_datetime,
            urgency, preferred_time, status,
            categories!job_requests_category_id_fkey(name_az),
            profiles!job_requests_customer_id_fkey(full_name)
          ),
          payments(status)
        `)
        .eq("worker_id", userId)
        .eq("status", "accepted")
        .in("job_requests.status", ["in_progress", "open"]);

      if (error) throw error;

      const offers: ActiveOffer[] = (data ?? [])
        .filter((d: any) => d.job_requests)
        .map((d: any) => ({
          id: d.id,
          job_id: d.job_id,
          price: d.price,
          status: d.status,
          job: {
            id: d.job_requests.id,
            category_name: d.job_requests.categories?.name_az ?? "Xidmət",
            address: d.job_requests.address,
            description: d.job_requests.description,
            time_type: d.job_requests.time_type,
            exact_datetime: d.job_requests.exact_datetime,
            urgency: d.job_requests.urgency,
            preferred_time: d.job_requests.preferred_time,
            status: d.job_requests.status,
            customer_name: d.job_requests.profiles?.full_name ?? "Müştəri",
          },
          payment_status: d.payments?.[0]?.status ?? null,
        }))
        .sort((a: ActiveOffer, b: ActiveOffer) => {
          const ta = a.job.exact_datetime
            ? new Date(a.job.exact_datetime).getTime()
            : 0;
          const tb = b.job.exact_datetime
            ? new Date(b.job.exact_datetime).getTime()
            : 0;
          return ta - tb;
        });

      setActiveOffers(offers);
    } catch (err) {
      console.error("fetchActiveOffers error:", err);
    } finally {
      setLoadingActive(false);
    }
  }, [supabase, userId]);

  // ── Fetch history ───────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          id, price,
          job_requests!offers_job_id_fkey(
            categories!job_requests_category_id_fkey(name_az),
            created_at
          ),
          reviews(rating)
        `)
        .eq("worker_id", userId)
        .eq("status", "accepted")
        .eq("job_requests.status", "done")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const items: HistoryOffer[] = (data ?? [])
        .filter((d: any) => d.job_requests)
        .map((d: any) => ({
          id: d.id,
          price: d.price,
          job: {
            category_name: d.job_requests.categories?.name_az ?? "Xidmət",
            created_at: d.job_requests.created_at,
          },
          review: d.reviews?.[0] ?? null,
        }));

      setHistory(items);
    } catch (err) {
      console.error("fetchHistory error:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    fetchNewJobs();
    fetchActiveOffers();
  }, [fetchNewJobs, fetchActiveOffers]);

  useEffect(() => {
    if (activeTab === 2 && history.length === 0) {
      fetchHistory();
    }
  }, [activeTab, history.length, fetchHistory]);

  // ── Realtime: new job_requests ──────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("worker-new-jobs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "job_requests" },
        () => fetchNewJobs()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchNewJobs]);

  // ── Realtime: offer status changes ─────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("worker-offers")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
          filter: `worker_id=eq.${userId}`,
        },
        () => fetchActiveOffers()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId, fetchActiveOffers]);

  // ── Pass job ────────────────────────────────────────────────────────────────
  const handlePass = (jobId: string) => {
    setPassedIds((prev) => new Set(prev).add(jobId));
  };

  // ── Offer sent ──────────────────────────────────────────────────────────────
  const handleOfferSuccess = (jobId: string) => {
    setSentOfferIds((prev) => new Set(prev).add(jobId));
    showToast("✓ Təklifiniz göndərildi! Müştəri bildiriş aldı.");
  };

  // ── Active job action (en_route / done) ─────────────────────────────────────
  const handleAction = async (
    offerId: string,
    action: "en_route" | "done"
  ) => {
    setActionLoading(offerId);
    try {
      if (action === "en_route") {
        // Update payment status — worker is en route
        await supabase
          .from("payments")
          .update({ status: "released" })
          .eq("offer_id", offerId);

        // Update worker_profiles is_en_route
        await supabase
          .from("worker_profiles")
          .update({ is_en_route: true })
          .eq("user_id", userId);
      } else {
        // Mark job as done
        const offer = activeOffers.find((o) => o.id === offerId);
        if (offer) {
          await supabase
            .from("job_requests")
            .update({ status: "done" })
            .eq("id", offer.job_id);

          await supabase
            .from("worker_profiles")
            .update({ is_en_route: false })
            .eq("user_id", userId);
        }
      }
      await fetchActiveOffers();
    } catch (err) {
      console.error("handleAction error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Sorted new jobs (passed go to end) ─────────────────────────────────────
  const sortedNewJobs = [
    ...newJobs.filter(
      (j) => !passedIds.has(j.id) && !sentOfferIds.has(j.id)
    ),
    ...newJobs.filter((j) => passedIds.has(j.id)),
  ];

  const newJobCount = newJobs.filter(
    (j) => !passedIds.has(j.id) && !sentOfferIds.has(j.id)
  ).length;

  // ── Total earnings ──────────────────────────────────────────────────────────
  const totalEarnings = history.reduce((sum, h) => sum + h.price, 0);
  const avgRating =
    history.filter((h) => h.review).length > 0
      ? history
          .filter((h) => h.review)
          .reduce((sum, h) => sum + (h.review?.rating ?? 0), 0) /
        history.filter((h) => h.review).length
      : rating;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[--gray-50]">
      {/* Header */}
      <div
        className="px-4 py-3 sticky top-0 z-10"
        style={{
          background: "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)",
        }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div
            className="text-[15px] font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Pronto<span style={{ color: "rgba(255,255,255,0.4)" }}>.az</span>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-white/65 font-medium">{fullName}</p>
            {rating > 0 && (
              <p className="text-[10px] text-white/45">
                {rating.toFixed(1)} ★
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-white border-b border-[--gray-200] sticky top-[50px] z-10 max-w-lg mx-auto">
        {(["Yeni işlər", "Aktiv işlərim", "Keçmiş"] as const).map(
          (label, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i as 0 | 1 | 2)}
              className="relative flex-1 text-center py-2.5 text-[11px] font-medium
                         border-b-2 transition-all"
              style={{
                color:
                  activeTab === i
                    ? "var(--primary, #1B4FD8)"
                    : "var(--text-3, #94A3C0)",
                borderBottomColor:
                  activeTab === i
                    ? "var(--primary, #1B4FD8)"
                    : "transparent",
              }}
            >
              {label}
              {i === 0 && newJobCount > 0 && (
                <span
                  className="absolute top-[7px] right-[12px] w-[5px] h-[5px] rounded-full"
                  style={{ background: "var(--accent, #E8521A)" }}
                />
              )}
            </button>
          )
        )}
      </div>

      <div className="max-w-lg mx-auto pb-8">
        {/* ── TAB 0: YENİ İŞLƏR ─────────────────────────────────────────────── */}
        {activeTab === 0 && (
          <div>
            {loadingJobs ? (
              <div className="space-y-3 p-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-28 animate-pulse"
                    style={{ border: "0.5px solid var(--gray-200)" }}
                  />
                ))}
              </div>
            ) : sortedNewJobs.length === 0 ? (
              <div className="p-6 text-center">
                <div
                  className="bg-white rounded-2xl p-8"
                  style={{ border: "0.5px dashed var(--gray-200)" }}
                >
                  <p className="text-[13px] font-bold text-[--navy] mb-1">
                    Hal-hazırda yeni sifariş yoxdur
                  </p>
                  <p className="text-[11px] text-[--text-3] leading-relaxed">
                    Yeni sifariş gəldikdə burada görünəcək
                    <br />
                    və bildiriş alacaqsınız
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-2.5 pt-2">
                <p
                  className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mb-2"
                  style={{ color: "var(--text-3, #94A3C0)" }}
                >
                  {newJobCount > 0
                    ? `${newJobCount} yeni sifariş`
                    : "Sifarişlər"}
                </p>

                {sortedNewJobs.map((job) => {
                  const isPassed = passedIds.has(job.id);
                  const isSent = sentOfferIds.has(job.id);
                  const isFull = job.offer_count >= 5;

                  return (
                    <div key={job.id}>
                      {isPassed &&
                        !passedIds.has(sortedNewJobs[0]?.id) &&
                        sortedNewJobs.indexOf(job) ===
                          sortedNewJobs.findIndex((j) =>
                            passedIds.has(j.id)
                          ) && (
                          <p
                            className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mt-3 mb-2"
                            style={{ color: "var(--text-3)" }}
                          >
                            Keçilmiş sifarişlər
                          </p>
                        )}

                      <div
                        className="bg-white rounded-2xl mb-2 overflow-hidden transition-all"
                        style={{
                          border: "0.5px solid var(--gray-200, #E4EAFB)",
                          opacity: isPassed || isSent ? 0.45 : 1,
                        }}
                      >
                        <div className="px-3 py-2.5">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[12px] font-bold text-[--navy]">
                              {job.category_name}
                              {job.sub_category_name &&
                                ` · ${job.sub_category_name}`}
                            </span>
                            <span
                              className="text-[9px] font-bold px-[7px] py-[2px] rounded-full"
                              style={
                                isPassed || isSent
                                  ? {
                                      background:
                                        "var(--gray-100, #F1F5FE)",
                                      color: "var(--text-3, #94A3C0)",
                                    }
                                  : {
                                      background:
                                        "var(--primary-bg, #EFF4FF)",
                                      color:
                                        "var(--primary, #1B4FD8)",
                                    }
                              }
                            >
                              {isSent
                                ? "Göndərildi"
                                : isPassed
                                ? "Keçildi"
                                : "Yeni"}
                            </span>
                          </div>
                          <p
                            className="text-[10px] mb-1"
                            style={{ color: "var(--text-2, #4A5878)" }}
                          >
                            📍 {job.address} &nbsp;·&nbsp; 🕐{" "}
                            {formatTimeLabel(job)}
                          </p>
                          {job.description && (
                            <p
                              className="text-[10px] leading-[1.4]"
                              style={{ color: "var(--text-3, #94A3C0)" }}
                            >
                              &ldquo;{job.description}&rdquo;
                            </p>
                          )}
                        </div>
                        <div
                          className="px-3 py-[7px] flex items-center justify-between"
                          style={{
                            borderTop:
                              "0.5px solid var(--gray-100, #F1F5FE)",
                          }}
                        >
                          <span className="text-[11px] font-bold text-[--navy]">
                            {formatPriceId(job.id)}
                          </span>
                          <div className="flex gap-1.5">
                            {!isPassed && !isSent && (
                              <button
                                onClick={() => handlePass(job.id)}
                                className="px-3 py-[6px] rounded-lg text-[10px] transition-all
                                           hover:text-[--navy]"
                                style={{
                                  border:
                                    "0.5px solid var(--gray-200, #E4EAFB)",
                                  color: "var(--text-3, #94A3C0)",
                                }}
                              >
                                Keç
                              </button>
                            )}
                            {!isSent && !isFull && (
                              <button
                                onClick={() => setSelectedJob(job)}
                                disabled={isPassed}
                                className="px-3 py-[6px] rounded-lg text-[10px] font-semibold
                                           text-white transition-all hover:-translate-y-px
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #1B4FD8, #2563EB)",
                                  boxShadow:
                                    "0 2px 8px rgba(27,79,216,0.2)",
                                }}
                              >
                                Təklif ver
                              </button>
                            )}
                            {isFull && !isSent && (
                              <span
                                className="px-3 py-[6px] rounded-lg text-[10px]"
                                style={{ color: "var(--text-3)" }}
                              >
                                Sifariş doludur
                              </span>
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

        {/* ── TAB 1: AKTİV İŞLƏRİM ─────────────────────────────────────────── */}
        {activeTab === 1 && (
          <div>
            {loadingActive ? (
              <div className="space-y-3 p-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl h-20 animate-pulse"
                    style={{ border: "0.5px solid var(--gray-200)" }}
                  />
                ))}
              </div>
            ) : activeOffers.length === 0 ? (
              <div className="p-6 text-center">
                <div
                  className="bg-white rounded-2xl p-8"
                  style={{ border: "0.5px dashed var(--gray-200)" }}
                >
                  <p className="text-[13px] font-bold text-[--navy] mb-1">
                    Aktiv iş yoxdur
                  </p>
                  <p className="text-[11px] text-[--text-3]">
                    Müştəri təklifinizi qəbul etdikdən sonra
                    <br />
                    iş burada görünəcək
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-2.5 pt-2">
                <p
                  className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mb-2"
                  style={{ color: "var(--text-3)" }}
                >
                  Bu günün sırası · {activeOffers.length} iş
                </p>
                {activeOffers.map((offer, idx) => {
                  const isOpen = openAccordion === offer.id;
                  const isCurrentlyActive =
                    offer.payment_status === "released";
                  const borderColor = isCurrentlyActive
                    ? "#A7F3D0"
                    : "#FCD34D";
                  const numBg = isCurrentlyActive
                    ? "linear-gradient(135deg,#1B4FD8,#2563EB)"
                    : "linear-gradient(135deg,#F59E0B,#FBBF24)";

                  return (
                    <div
                      key={offer.id}
                      className="bg-white rounded-2xl mb-2 overflow-hidden"
                      style={{
                        border: `1.5px solid ${borderColor}`,
                      }}
                    >
                      {/* Accordion Header */}
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                        onClick={() =>
                          setOpenAccordion(isOpen ? null : offer.id)
                        }
                      >
                        {/* Number badge */}
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center
                                     text-[12px] font-bold text-white flex-shrink-0"
                          style={{ background: numBg }}
                        >
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[--navy] truncate">
                            {offer.job.category_name}
                          </p>
                          <p
                            className="text-[10px] mt-0.5"
                            style={{ color: "var(--text-3)" }}
                          >
                            {offer.job.address.split(",")[0]} ·{" "}
                            {formatTimeLabel(offer.job)}
                            <NextPill
                              paymentStatus={offer.payment_status}
                              jobStatus={offer.job.status}
                            />
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isCurrentlyActive && (
                            <span
                              className="w-[6px] h-[6px] rounded-full"
                              style={{
                                background: "#10B981",
                                animation: "pulse 1.5s infinite",
                              }}
                            />
                          )}
                          {/* Chat button — independent from accordion */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: open chat
                            }}
                            className="w-[26px] h-[26px] rounded-lg flex items-center
                                       justify-center transition-colors hover:bg-[--primary-bg]"
                            style={{
                              border:
                                "0.5px solid var(--gray-200, #E4EAFB)",
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 13 13"
                              fill="none"
                            >
                              <path
                                d="M6.5 1.5C3.7 1.5 1.5 3.4 1.5 5.8c0 .9.3 1.8.9 2.5L1.5 11l2.8-1c.6.3 1.4.5 2.2.5 2.8 0 5-1.9 5-4.2S9.3 1.5 6.5 1.5z"
                                stroke="#1B4FD8"
                                strokeWidth="1.2"
                              />
                            </svg>
                          </button>
                          {/* Chevron */}
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            style={{
                              transform: isOpen
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                          >
                            <path
                              d="M3 5l4 4 4-4"
                              stroke="#94A3C0"
                              strokeWidth="1.4"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      <div
                        style={{
                          maxHeight: isOpen ? "400px" : "0",
                          overflow: "hidden",
                          transition: "max-height 0.3s ease",
                        }}
                      >
                        <div
                          className="px-3 pb-3"
                          style={{
                            borderTop:
                              "0.5px solid var(--gray-100, #F1F5FE)",
                          }}
                        >
                          {/* Detail cards */}
                          <div className="flex gap-1.5 mt-2.5 mb-2">
                            {[
                              {
                                label: "Ünvan",
                                value: offer.job.address.split(",")[0],
                              },
                              {
                                label: "Qiymət",
                                value: `${offer.price} ₼`,
                              },
                              {
                                label: "Müştəri",
                                value: offer.job.customer_name.split(" ")[0],
                              },
                            ].map(({ label, value }) => (
                              <div
                                key={label}
                                className="flex-1 rounded-lg px-2 py-1.5"
                                style={{
                                  background: "var(--gray-50, #F8FAFF)",
                                }}
                              >
                                <p
                                  className="text-[9px]"
                                  style={{
                                    color: "var(--text-3, #94A3C0)",
                                  }}
                                >
                                  {label}
                                </p>
                                <p className="text-[11px] font-bold text-[--navy] truncate">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Step progress */}
                          <StepProgress
                            currentStep={stepIndex(
                              offer.payment_status,
                              offer.job.status
                            )}
                          />

                          {/* Description */}
                          {offer.job.description && (
                            <div
                              className="rounded-lg px-2.5 py-2 mb-2 text-[11px] leading-relaxed"
                              style={{
                                background: "var(--gray-50, #F8FAFF)",
                                color: "var(--text-2, #4A5878)",
                              }}
                            >
                              &ldquo;{offer.job.description}&rdquo;
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: open chat
                              }}
                              className="flex-1 py-2 rounded-xl text-[11px] font-semibold
                                         transition-all hover:bg-[--primary-bg]"
                              style={{
                                border:
                                  "0.5px solid var(--gray-200, #E4EAFB)",
                                color: "var(--primary, #1B4FD8)",
                              }}
                            >
                              Chat
                            </button>
                            <ActionButton
                              paymentStatus={offer.payment_status}
                              offerId={offer.id}
                              onAction={handleAction}
                              loading={actionLoading === offer.id}
                            />
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

        {/* ── TAB 2: KEÇMİŞ ─────────────────────────────────────────────────── */}
        {activeTab === 2 && (
          <div>
            {loadingHistory ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl h-14 animate-pulse"
                    style={{ border: "0.5px solid var(--gray-200)" }}
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center">
                <div
                  className="bg-white rounded-2xl p-8"
                  style={{ border: "0.5px dashed var(--gray-200)" }}
                >
                  <p className="text-[13px] font-bold text-[--navy] mb-1">
                    Hələ tamamlanmış iş yoxdur
                  </p>
                  <p className="text-[11px] text-[--text-3]">
                    Tamamlanan işlər burada görünəcək
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-2.5 pt-2">
                <p
                  className="text-[9px] font-bold tracking-[0.06em] uppercase px-1 mb-2"
                  style={{ color: "var(--text-3)" }}
                >
                  Tamamlanmış işlər · {history.length}
                </p>
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl mb-1.5 px-3 py-2.5 flex items-center
                               justify-between"
                    style={{ border: "0.5px solid var(--gray-200)" }}
                  >
                    <div>
                      <p className="text-[12px] font-bold text-[--navy]">
                        {item.job.category_name}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: "var(--text-3)" }}
                      >
                        {timeAgo(item.job.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-[13px] font-bold text-[--navy]"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {item.price} ₼
                      </p>
                      {item.review ? (
                        <Stars rating={item.review.rating} />
                      ) : (
                        <p
                          className="text-[9px]"
                          style={{ color: "var(--text-3)" }}
                        >
                          Rəy yoxdur
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Earnings card */}
                <div
                  className="rounded-2xl mx-0 mt-3 mb-2.5 p-[14px] flex justify-between
                             items-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)",
                  }}
                >
                  <div>
                    <p className="text-[10px] text-white/60">
                      Ümumi qazandım
                    </p>
                    <p
                      className="text-[22px] font-bold text-white mt-0.5"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {totalEarnings} ₼
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/60">
                      Orta reytinq
                    </p>
                    <p
                      className="text-[18px] font-bold mt-0.5"
                      style={{ color: "#FCD34D" }}
                    >
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"} ★
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <div
            className="rounded-xl px-4 py-3 text-[12px] font-semibold text-center shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
              border: "1px solid #6EE7B7",
              color: "#065F46",
            }}
          >
            {toast}
          </div>
        </div>
      )}

      {/* Send Offer Modal */}
      {selectedJob && (
        <SendOfferModal
          job={selectedJob}
          workerId={userId}
          onClose={() => setSelectedJob(null)}
          onSuccess={handleOfferSuccess}
        />
      )}
    </div>
  );
}
