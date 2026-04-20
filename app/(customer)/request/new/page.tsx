"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[268px] rounded-2xl bg-[var(--gray-100)] animate-pulse" />
  ),
});

type Category = {
  id: string;
  name_az: string;
  icon: string;
  parent_id: string | null;
};

type MediaFile = {
  file: File;
  url: string;
  type: "image" | "video";
};

type FormData = {
  categoryId: string;
  subCategoryId: string;
  description: string;
  media: MediaFile[];
  address: string;
  apartment: string;
  timeType: "exact" | "flexible" | "";
  exactDate: Date | null;
  exactTime: string;
  urgency: "today" | "this_week" | "flexible" | "";
  preferredTime: string;
  lat: number | null;
  lng: number | null;
};

const TIMES: string[] = [];
for (let h = 8; h <= 20; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 20) TIMES.push(`${String(h).padStart(2, "0")}:30`);
}

const URGENCY_OPTIONS = [
  { value: "today",     label: "Bu gün",    icon: "⚡" },
  { value: "this_week", label: "Bu həftə",  icon: "📅" },
  { value: "flexible",  label: "Çevik",     icon: "🔄" },
];

const PREFERRED_TIMES = [
  { value: "09:00–12:00", label: "Səhər",  sub: "09:00–12:00", icon: "🌅" },
  { value: "12:00–18:00", label: "Gündüz", sub: "12:00–18:00", icon: "☀️" },
  { value: "18:00–21:00", label: "Axşam",  sub: "18:00–21:00", icon: "🌆" },
];

const STEP_TITLES = [
  "Xidmət Seçin",
  "Problemi İzah Et",
  "Ünvan & Vaxt",
  "Sifariş Verildi",
];

const AZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","İyun",
  "İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr",
];
const AZ_DAYS = ["B.e","Ç.a","Çər","C.a","Cüm","Şən","Baz"];

function MiniCalendar({ value, onChange }: { value: Date | null; onChange: (d: Date) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-[var(--gray-100)] flex items-center justify-center text-[var(--navy)] transition-colors">‹</button>
        <span className="text-[14px] font-semibold text-[var(--navy)]">{AZ_MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-[var(--gray-100)] flex items-center justify-center text-[var(--navy)] transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {AZ_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-[var(--gray-400)] py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const date = new Date(viewYear, viewMonth, day);
          date.setHours(0, 0, 0, 0);
          const isPast       = date < today;
          const isSelected   = value && value.getFullYear() === viewYear && value.getMonth() === viewMonth && value.getDate() === day;
          const isToday      = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onChange(date)}
              className={`
                aspect-square rounded-xl text-[13px] font-medium transition-all
                ${isPast ? "text-[var(--gray-200)] cursor-not-allowed" : ""}
                ${isSelected ? "bg-[var(--primary)] text-white shadow-sm" : ""}
                ${!isSelected && !isPast ? "hover:bg-[var(--primary-bg)] text-[var(--navy)]" : ""}
                ${isToday && !isSelected ? "ring-1 ring-[var(--primary)] text-[var(--primary)]" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inner component (useSearchParams buradadır) ──────────────────────────────

function NewRequestInner() {
  const searchParams = useSearchParams();
  const presetCategoryId = searchParams.get("category") ?? "";
  const presetWorkerId   = searchParams.get("worker_id") ?? "";

  const [step,       setStep]       = useState(presetCategoryId ? 2 : 1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const [workerName, setWorkerName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    categoryId:    presetCategoryId,
    subCategoryId: "",
    description:   "",
    media:         [],
    address:       "",
    apartment:     "",
    timeType:      "",
    exactDate:     null,
    exactTime:     "",
    urgency:       "",
    preferredTime: "",
    lat:           null,
    lng:           null,
  });

  // Kateqoriyaları yüklə
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name_az, icon, parent_id")
        .is("parent_id", null)
        .order("name_az");
      setCategories(data ?? []);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // Alt kateqoriyaları yüklə
  useEffect(() => {
    if (!form.categoryId) { setSubCategories([]); return; }
    const fetchSubs = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name_az, icon, parent_id")
        .eq("parent_id", form.categoryId)
        .order("name_az");
      setSubCategories(data ?? []);
    };
    fetchSubs();
  }, [form.categoryId]);

  // Worker adını yüklə (worker_id varsa)
  useEffect(() => {
    if (!presetWorkerId) return;
    const fetchWorker = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", presetWorkerId)
        .single();
      setWorkerName(data?.full_name ?? null);
    };
    fetchWorker();
  }, [presetWorkerId]);

  const addMedia = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files)
      .filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .slice(0, 5 - form.media.length)
      .map(f => ({
        file: f,
        url: URL.createObjectURL(f),
        type: (f.type.startsWith("video/") ? "video" : "image") as "image" | "video",
      }));
    setForm(p => ({ ...p, media: [...p.media, ...newFiles].slice(0, 5) }));
  };

  const removeMedia = (i: number) => {
    URL.revokeObjectURL(form.media[i].url);
    setForm(p => ({ ...p, media: p.media.filter((_, idx) => idx !== i) }));
  };

  const step1Valid = !!form.categoryId;
  const step2Valid = form.description.trim().length >= 10;
  const step3Valid = (() => {
    if (!form.address.trim() || !form.timeType) return false;
    if (form.timeType === "exact")    return !!form.exactDate && !!form.exactTime;
    if (form.timeType === "flexible") return !!form.urgency && !!form.preferredTime;
    return false;
  })();

  const canProceed = () => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    return true;
  };

  const handleNext = async () => {
    if (step < 3) { setStep(step + 1); return; }
    if (step === 3) {
      setSubmitting(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }

        const exactDatetime = form.timeType === "exact" && form.exactDate && form.exactTime
          ? new Date(`${form.exactDate.toISOString().split("T")[0]}T${form.exactTime}:00`).toISOString()
          : null;

        const { error } = await supabase.from("job_requests").insert({
          customer_id:     user.id,
          category_id:     form.categoryId,
          sub_category_id: form.subCategoryId || null,
          description:     form.description,
          address:         form.address,
          location_lat:    form.lat,
          location_lng:    form.lng,
          time_type:       form.timeType,
          exact_datetime:  exactDatetime,
          urgency:         form.timeType === "flexible" ? form.urgency : null,
          preferred_time:  form.timeType === "flexible" ? form.preferredTime : null,
          preferred_worker_id: presetWorkerId || null,
          status:          "open",
        });

        if (!error) setStep(4);
      } catch (e) {
        console.error(e);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Seçilmiş kateqoriya adını tap
  const selectedCategory = categories.find(c => c.id === form.categoryId);

  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex flex-col max-w-lg mx-auto relative">
      <style>{`
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%       { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse-out {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes progress-pulse {
          0%   { width: 20%; margin-left: 0; }
          50%  { width: 40%; }
          100% { width: 20%; margin-left: 80%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[var(--gray-200)] px-5 pt-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 pb-3">
          <button
            onClick={() => step > 1 && step < 4 ? setStep(step - 1) : window.history.back()}
            className="w-9 h-9 rounded-full bg-[var(--gray-100)] flex items-center justify-center text-[var(--navy)] font-medium hover:bg-[var(--gray-200)] transition-all active:scale-95"
          >
            ←
          </button>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-[var(--navy)] leading-tight">
              {STEP_TITLES[step - 1]}
            </p>
            <p className="text-[11px] text-[var(--gray-400)] mt-0.5">
              {step < 4 ? `Addım ${step} / 4` : "Tamamlandı"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i <= step ? "w-5 h-1.5 bg-[var(--primary)]" : "w-1.5 h-1.5 bg-[var(--gray-200)]"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-1 pb-0">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-[var(--primary)]" : "bg-[var(--gray-200)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-6 px-5 pt-6">

        {/* ────── ADDIM 1 — Kateqoriya ────── */}
        {step === 1 && (
          <div>
            <h2 className="text-[22px] font-bold text-[var(--navy)] mb-1 leading-tight">Xidmət növü seçin</h2>
            <p className="text-[14px] text-[var(--gray-400)] mb-6">Probleminizə uyğun kateqoriyanı seçin</p>

            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-[var(--gray-200)] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setForm(p => ({ ...p, categoryId: cat.id, subCategoryId: "" }));
                      // Kateqoriya seçilən kimi birbaşa Step 2-yə keç
                      setStep(2);
                    }}
                    className={`
                      relative rounded-2xl py-4 px-3 text-center border-[1.5px]
                      transition-all duration-200 active:scale-95
                      ${form.categoryId === cat.id
                        ? "bg-[var(--primary)] border-[var(--primary)] shadow-[0_4px_16px_rgba(27,79,216,0.3)]"
                        : "bg-white border-[var(--gray-200)] hover:border-[var(--primary-mid)] hover:shadow-sm"
                      }
                    `}
                  >
                    <span className="text-2xl block mb-2">{cat.icon}</span>
                    <p className={`text-[11px] font-bold leading-tight ${form.categoryId === cat.id ? "text-white" : "text-[var(--navy)]"}`}>
                      {cat.name_az}
                    </p>
                    {form.categoryId === cat.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────── ADDIM 2 — Problem ────── */}
        {step === 2 && (
          <div>
            <h2 className="text-[22px] font-bold text-[var(--navy)] mb-1 leading-tight">Problemi izah edin</h2>
            <p className="text-[14px] text-[var(--gray-400)] mb-4">Nə baş verdiyini qısaca yazın</p>

            {/* Seçilmiş kateqoriya pill-i */}
            {selectedCategory && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border border-[var(--primary-mid)] bg-[var(--primary-bg)]"
                style={{ animation: "fadeIn 0.25s ease", display: "inline-flex" }}
              >
                <span className="text-base">{selectedCategory.icon}</span>
                <span className="text-[12px] font-700 text-[var(--primary)] font-bold">{selectedCategory.name_az}</span>
                <button
                  onClick={() => { setForm(p => ({ ...p, categoryId: "", subCategoryId: "" })); setStep(1); }}
                  className="ml-1 text-[var(--primary)] text-[14px] font-bold leading-none hover:text-red-500 transition-colors"
                  title="Kateqoriyanı dəyiş"
                >
                  ×
                </button>
              </div>
            )}

            {/* Worker banneri (worker_id varsa) */}
            {presetWorkerId && workerName && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border border-[#A7F3D0] bg-[#F0FDF4]"
                style={{ animation: "fadeIn 0.25s ease" }}
              >
                <span className="text-base">👷</span>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-[#065F46]">Seçilmiş usta</p>
                  <p className="text-[12px] text-[#059669] font-semibold">{workerName}</p>
                </div>
              </div>
            )}

            {/* Alt kateqoriya (varsa) */}
            {subCategories.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[var(--gray-200)]" />
                  <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider">
                    Alt kateqoriya <span className="font-normal normal-case">(ixtiyari)</span>
                  </p>
                  <div className="h-px flex-1 bg-[var(--gray-200)]" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {subCategories.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setForm(p => ({ ...p, subCategoryId: p.subCategoryId === sub.id ? "" : sub.id }))}
                      className={`
                        text-[12px] font-semibold px-4 py-2 rounded-full border-[1.5px]
                        transition-all duration-150 active:scale-95
                        ${form.subCategoryId === sub.id
                          ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm"
                          : "bg-white border-[var(--gray-200)] text-[var(--navy)] hover:border-[var(--primary-mid)]"
                        }
                      `}
                    >
                      {sub.name_az}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <textarea
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Məs: Mətbəxdəki kran sızırdı, su axır. Dərhal düzəltmək lazımdır."
                rows={4}
                className="w-full border-[1.5px] border-[var(--gray-200)] rounded-2xl p-4 text-[14px] text-[var(--navy)] bg-white resize-none outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(27,79,216,0.08)] transition-all placeholder:text-[var(--gray-400)] leading-relaxed"
              />
              <p className={`text-[11px] font-medium mt-2 px-1 ${form.description.length >= 10 ? "text-[var(--green)]" : "text-[var(--gray-400)]"}`}>
                {form.description.length >= 10 ? "✓ Kifayət qədər" : `Minimum 10 simvol (${form.description.length}/10)`}
              </p>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-[var(--navy)]">Şəkil / Video</p>
                <span className="text-[11px] text-[var(--gray-400)] bg-[var(--gray-100)] px-2 py-0.5 rounded-full">
                  {form.media.length}/5 · Optional
                </span>
              </div>
              {form.media.length < 5 && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addMedia(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
                    ${dragOver
                      ? "border-[var(--primary)] bg-[var(--primary-bg)] scale-[1.01]"
                      : "border-[var(--gray-200)] bg-white hover:border-[var(--primary-mid)] hover:bg-[var(--gray-50)]"
                    }
                  `}
                >
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => addMedia(e.target.files)} />
                  <div className="w-12 h-12 bg-[var(--gray-100)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📎</span>
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--navy)] mb-1">Fayl seçin və ya buraya sürükləyin</p>
                  <p className="text-[11px] text-[var(--gray-400)]">Şəkil (JPG, PNG) · Video (MP4) · Max 5 fayl</p>
                </div>
              )}
              {form.media.length > 0 && (
                <div className="flex gap-2.5 mt-3 flex-wrap">
                  {form.media.map((m, i) => (
                    <div key={i} className="relative">
                      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden border-[1.5px] border-[var(--gray-200)] bg-[var(--gray-100)]">
                        {m.type === "image" ? (
                          <img src={m.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <span className="text-2xl">🎬</span>
                            <p className="text-[9px] text-[var(--gray-400)] mt-1">Video</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--navy)] text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                      >×</button>
                    </div>
                  ))}
                  {form.media.length < 5 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-[72px] h-[72px] rounded-xl border-[1.5px] border-dashed border-[var(--gray-200)] bg-white flex flex-col items-center justify-center hover:border-[var(--primary-mid)] hover:bg-[var(--gray-50)] transition-all"
                    >
                      <span className="text-xl text-[var(--gray-400)]">+</span>
                      <p className="text-[9px] text-[var(--gray-400)] mt-0.5">Əlavə et</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────── ADDIM 3 — Ünvan & Vaxt ────── */}
        {step === 3 && (
          <div>
            <h2 className="text-[22px] font-bold text-[var(--navy)] mb-1 leading-tight">Harada, nə vaxt?</h2>
            <p className="text-[14px] text-[var(--gray-400)] mb-6">Ünvan və vaxt seçin</p>

            <MapPicker onSelect={(address, lat, lng) => setForm(p => ({ ...p, address, lat, lng }))} />

            <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden mb-4 shadow-sm mt-3">
              <div className="px-4 pt-4 pb-3">
                <label className="block text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">📍 Dəqiq ünvan</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Xəritədən seçin və ya əl ilə yazın"
                  className="w-full text-[14px] text-[var(--navy)] bg-transparent outline-none placeholder:text-[var(--gray-400)]"
                />
              </div>
              <div className="border-t border-[var(--gray-200)] px-4 pt-3 pb-4">
                <label className="block text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">🏢 Mərtəbə / Mənzil</label>
                <input
                  type="text"
                  value={form.apartment}
                  onChange={(e) => setForm(p => ({ ...p, apartment: e.target.value }))}
                  placeholder="Məs: m. 34, qapı 7"
                  className="w-full text-[14px] text-[var(--navy)] bg-transparent outline-none placeholder:text-[var(--gray-400)]"
                />
              </div>
            </div>

            <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-3">Vaxt növü</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { value: "exact",    icon: "🎯", title: "Dəqiq vaxt",  sub: "Tarix və saat seç"   },
                { value: "flexible", icon: "🔄", title: "Çevik vaxt",  sub: "Təxmini zaman bil"   },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm(p => ({ ...p, timeType: opt.value as "exact" | "flexible", exactDate: null, exactTime: "", urgency: "", preferredTime: "" }))}
                  className={`
                    flex flex-col items-start gap-1 p-4 rounded-2xl border-[1.5px]
                    transition-all duration-200 text-left active:scale-95
                    ${form.timeType === opt.value
                      ? "border-[var(--primary)] bg-[var(--primary-bg)] shadow-sm"
                      : "border-[var(--gray-200)] bg-white hover:border-[var(--primary-mid)]"
                    }
                  `}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <p className={`text-[13px] font-bold ${form.timeType === opt.value ? "text-[var(--primary)]" : "text-[var(--navy)]"}`}>{opt.title}</p>
                  <p className="text-[11px] text-[var(--gray-400)]">{opt.sub}</p>
                </button>
              ))}
            </div>

            {form.timeType === "exact" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-3">Tarix seçin</p>
                  <MiniCalendar value={form.exactDate} onChange={(d) => setForm(p => ({ ...p, exactDate: d }))} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-3">Saat seçin</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm(p => ({ ...p, exactTime: t }))}
                        className={`
                          py-2.5 rounded-xl text-[12px] font-semibold border-[1.5px]
                          transition-all duration-150 active:scale-95
                          ${form.exactTime === t
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm"
                            : "bg-white border-[var(--gray-200)] text-[var(--navy)] hover:border-[var(--primary-mid)]"
                          }
                        `}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.timeType === "flexible" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-3">Nə vaxt uyğundur?</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {URGENCY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm(p => ({ ...p, urgency: opt.value as FormData["urgency"] }))}
                        className={`
                          flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl
                          border-[1.5px] transition-all duration-150 active:scale-95
                          ${form.urgency === opt.value
                            ? "bg-[var(--primary)] border-[var(--primary)] shadow-sm"
                            : "bg-white border-[var(--gray-200)] hover:border-[var(--primary-mid)]"
                          }
                        `}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <p className={`text-[11px] font-bold ${form.urgency === opt.value ? "text-white" : "text-[var(--navy)]"}`}>{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-3">Günün hansı hissəsi?</p>
                  <div className="space-y-2.5">
                    {PREFERRED_TIMES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setForm(p => ({ ...p, preferredTime: t.value }))}
                        className={`
                          w-full flex items-center gap-4 p-4 rounded-2xl border-[1.5px]
                          transition-all duration-150 active:scale-[0.99]
                          ${form.preferredTime === t.value
                            ? "bg-[var(--primary-bg)] border-[var(--primary)] shadow-sm"
                            : "bg-white border-[var(--gray-200)] hover:border-[var(--primary-mid)]"
                          }
                        `}
                      >
                        <span className="text-2xl">{t.icon}</span>
                        <div className="text-left">
                          <p className={`text-[13px] font-bold ${form.preferredTime === t.value ? "text-[var(--primary)]" : "text-[var(--navy)]"}`}>{t.label}</p>
                          <p className="text-[11px] text-[var(--gray-400)]">{t.sub}</p>
                        </div>
                        {form.preferredTime === t.value && (
                          <div className="ml-auto w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────── ADDIM 4: Sifariş verildi ────── */}
        {step === 4 && (
          <div>
            <div
              className="relative flex flex-col items-center gap-4 py-8 px-4 rounded-2xl overflow-hidden mb-4"
              style={{ background: "linear-gradient(135deg, #0D1F3C, #162F6A)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: "linear-gradient(rgba(27,79,216,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(27,79,216,0.08) 1px,transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative z-10 flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-[rgba(147,180,255,0.3)]" style={{ animation: "pulse-out 2s ease-out infinite" }} />
                <div className="absolute rounded-full border border-[rgba(147,180,255,0.15)]" style={{ inset: "-10px", animation: "pulse-out 2s ease-out 0.5s infinite" }} />
                <div className="w-14 h-14 rounded-full bg-[rgba(27,79,216,0.4)] flex items-center justify-center text-3xl z-10">🔍</div>
              </div>
              <div className="flex gap-2 z-10">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#93B4FF]" style={{ animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <p className="text-[13px] text-white/70 z-10 text-center font-medium">
                {presetWorkerId && workerName
                  ? `${workerName} sifarişinizi görür...`
                  : "Ustalar sifarişinizi görür..."
                }
              </p>
            </div>

            <div className="h-1.5 bg-[var(--gray-100)] rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #1B4FD8, #60A5FA)", animation: "progress-pulse 2s ease-in-out infinite" }} />
            </div>

            <p className="text-[12px] text-[var(--gray-400)] text-center mb-5">
              Adətən <span className="font-semibold text-[var(--navy)]">15–45 dəq</span> ərzində{" "}
              <span className="font-semibold text-[var(--navy)]">tətbiq bildirişi</span> və{" "}
              <span className="font-semibold text-[#25D366]">WhatsApp bildirişi</span> alacaqsınız
            </p>

            <div className="bg-white border border-[var(--border)] rounded-2xl px-4 py-3.5 mb-4">
              <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Sifariş məlumatları</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">📍</span>
                  <p className="text-[12px] text-[var(--navy)]">{form.address || "Ünvan daxil edilməyib"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">📝</span>
                  <p className="text-[12px] text-[var(--navy)] truncate">{form.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px]">📅</span>
                  <p className="text-[12px] text-[var(--navy)]">
                    {form.timeType === "exact" && form.exactDate && form.exactTime
                      ? `${form.exactDate.toLocaleDateString("az-AZ")} · ${form.exactTime}`
                      : form.urgency === "today" ? "Bu gün"
                      : form.urgency === "this_week" ? "Bu həftə"
                      : "Çevik"}
                  </p>
                </div>
                {presetWorkerId && workerName && (
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]">👷</span>
                    <p className="text-[12px] text-[var(--navy)]">{workerName}</p>
                  </div>
                )}
              </div>
            </div>

            <a
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[var(--primary)] text-white text-[13px] font-bold hover:bg-[var(--primary-light)] transition-colors"
            >
              Sifarişlərimə get →
            </a>
          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      {step < 4 && step > 1 && (
        <div
          className="sticky bottom-0 left-0 right-0 px-5 py-4 bg-white/90 backdrop-blur-md border-t border-[var(--gray-200)]"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            className={`
              w-full font-bold text-[15px] py-4 rounded-2xl transition-all duration-200
              ${canProceed() && !submitting
                ? "bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(27,79,216,0.3)] hover:bg-[var(--primary-light)] active:scale-[0.99]"
                : "bg-[var(--gray-200)] text-[var(--gray-400)] cursor-not-allowed"
              }
            `}
          >
            {submitting ? "Göndərilir..." : step === 3 ? "Sifarişi Göndər ✓" : "Növbəti →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Export (Suspense ilə wrapped — useSearchParams tələbi) ──────────────────

export default function NewRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div style={{ width: 32, height: 32, border: "3px solid #E4EAFB", borderTopColor: "#1B4FD8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <NewRequestInner />
    </Suspense>
  );
}