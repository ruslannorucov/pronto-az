"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface JobRequest {
  id: string;
  category_name: string;
  address: string;
  time_type: "exact" | "flexible";
  exact_datetime: string | null;
  urgency: string | null;
  preferred_time: string | null;
}

interface SendOfferModalProps {
  job: JobRequest | null;
  workerId: string;
  onClose: () => void;
  onSuccess: (jobId: string) => void;
}

const TIME_SLOTS = [
  "Bu gün · 09:00", "Bu gün · 10:00", "Bu gün · 11:00",
  "Bu gün · 12:00", "Bu gün · 13:00", "Bu gün · 14:00",
  "Bu gün · 15:00", "Bu gün · 16:00", "Bu gün · 17:00",
  "Bu gün · 18:00", "Bu gün · 19:00", "Bu gün · 20:00",
  "Sabah · 09:00",  "Sabah · 10:00",  "Sabah · 11:00",
  "Sabah · 12:00",  "Sabah · 14:00",  "Sabah · 16:00",
  "Sabah · 18:00",
];

export default function SendOfferModal({
  job,
  workerId,
  onClose,
  onSuccess,
}: SendOfferModalProps) {
  const [price, setPrice] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[7]);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Trigger slide-up animation on mount
  useEffect(() => {
    if (job) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [job]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleSubmit = async () => {
    if (!job) return;
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError("Zəhmət olmasa qiymət daxil edin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check offer limit — max 5 pending offers per job
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "pending");

      if (count !== null && count >= 5) {
        setError("Bu sifariş üçün maksimum 5 təklif göndərilib.");
        setLoading(false);
        return;
      }

      // Check if worker already sent an offer for this job
      const { data: existing } = await supabase
        .from("offers")
        .select("id")
        .eq("job_id", job.id)
        .eq("worker_id", workerId)
        .maybeSingle();

      if (existing) {
        setError("Bu sifarişə artıq təklif göndərmisiniz.");
        setLoading(false);
        return;
      }

      // Insert offer
      const { error: offerError } = await supabase.from("offers").insert({
        job_id: job.id,
        worker_id: workerId,
        price: Number(price),
        note: note.trim() || null,
        eta_hours: 1,
        status: "pending",
      });

      if (offerError) throw offerError;

      // Fetch job owner (customer_id) for notification
      const { data: jobData } = await supabase
        .from("job_requests")
        .select("customer_id")
        .eq("id", job.id)
        .single();

      if (jobData?.customer_id) {
        // Fetch worker name for notification
        const { data: workerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", workerId)
          .single();

        const workerName = workerProfile?.full_name ?? "Usta";

        await supabase.from("notifications").insert({
          user_id: jobData.customer_id,
          type: "offer_received",
          title: "Yeni təklif gəldi",
          body: `${workerName} ${price} ₼ təklif göndərdi`,
          job_id: job.id,
          sent_whatsapp: false,
        });
      }

      onSuccess(job.id);
      handleClose();
    } catch (err) {
      console.error("Offer submit error:", err);
      setError("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  // Build time label for job
  const jobTimeLabel =
    job.time_type === "exact" && job.exact_datetime
      ? new Date(job.exact_datetime).toLocaleString("az-AZ", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : job.urgency === "today"
      ? "Bu gün"
      : job.urgency === "this_week"
      ? "Bu həftə"
      : "Çevik";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        background: "rgba(13,31,60,0.5)",
        backdropFilter: "blur(4px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-[20px] px-[14px] pt-[16px] pb-6"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Handle */}
        <div className="w-8 h-[3px] rounded-full bg-[--gray-200] mx-auto mb-[14px]" />

        {/* Job info */}
        <div className="mb-[14px]">
          <p className="text-[13px] font-bold text-[--navy]">
            {job.category_name} · {job.address}
          </p>
          <p className="text-[10px] text-[--text-3] mt-0.5">
            {jobTimeLabel} · Müştəriyə təklif göndər
          </p>
        </div>

        {/* Price */}
        <p className="text-[10px] font-bold text-[--text-2] mb-[5px]">
          Qiymətim
        </p>
        <div
          className="flex items-center rounded-xl px-3 py-2 mb-2.5"
          style={{
            background: "var(--gray-50, #F8FAFF)",
            border: "1.5px solid var(--gray-200, #E4EAFB)",
          }}
        >
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="border-none bg-transparent text-[22px] font-bold text-[--navy]
                       w-24 outline-none font-serif"
            style={{ fontFamily: "'Playfair Display', serif" }}
          />
          <span
            className="text-[18px] font-bold ml-1"
            style={{ color: "var(--text-3, #94A3C0)" }}
          >
            ₼
          </span>
        </div>

        {/* Time */}
        <p className="text-[10px] font-bold text-[--text-2] mb-[5px]">
          Nə vaxt gələ bilərəm
        </p>
        <select
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="w-full rounded-xl px-3 py-[9px] text-[12px] text-[--navy]
                     mb-2.5 outline-none"
          style={{
            border: "1.5px solid var(--gray-200, #E4EAFB)",
            background: "var(--gray-50, #F8FAFF)",
          }}
        >
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>

        {/* Note */}
        <p className="text-[10px] font-bold text-[--text-2] mb-[5px]">
          Qeyd{" "}
          <span className="font-normal" style={{ color: "var(--text-3)" }}>
            (istəyə bağlı)
          </span>
        </p>
        <div
          className="rounded-xl px-3 py-2 mb-3"
          style={{
            border: "1.5px solid var(--gray-200, #E4EAFB)",
            background: "var(--gray-50, #F8FAFF)",
          }}
        >
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Materiallar mənidədir, 1 saata həll edərəm..."
            className="w-full border-none bg-transparent text-[11px] text-[--navy]
                       outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-500 mb-2 text-center">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold
                       transition-all disabled:opacity-50"
            style={{
              border: "1.5px solid var(--gray-200, #E4EAFB)",
              color: "var(--text-3, #94A3C0)",
            }}
          >
            Ləğv et
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !price}
            className="flex-[2] py-2.5 rounded-xl text-[12px] font-bold text-white
                       transition-all hover:-translate-y-px active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)",
              boxShadow: "0 4px 12px rgba(27,79,216,0.25)",
            }}
          >
            {loading ? "Göndərilir..." : "Göndər →"}
          </button>
        </div>
      </div>
    </div>
  );
}
