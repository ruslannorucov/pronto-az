"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const BAKU_DISTRICTS = [
  "Nərimanov", "Yasamal", "Nəsimi", "Səbail",
  "Binəqədi", "Suraxanı", "Xəzər", "Pirallahı",
  "Nizami", "Xətai", "Abşeron", "Qaradağ",
];

const AVAILABLE_DAYS = [
  { key: "mon", label: "B.e" },
  { key: "tue", label: "Ç.a" },
  { key: "wed", label: "Çər" },
  { key: "thu", label: "C.a" },
  { key: "fri", label: "Cüm" },
  { key: "sat", label: "Şnb" },
  { key: "sun", label: "Baz" },
];

const EXPERIENCE_OPTIONS = [
  "1 ildən az", "1–3 il", "3–5 il", "5–10 il", "10+ il",
];

interface Category {
  id: string;
  name_az: string;
  icon: string;
}

interface Props {
  categories: Category[];
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass =
  "w-full border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-4 text-[16px] text-[var(--navy)] bg-[var(--gray-50)] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(27,79,216,0.08)] transition-all placeholder:text-[var(--gray-400)]";

const labelClass =
  "block text-[13px] font-bold text-[var(--gray-600)] mb-2.5";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--gray-50)] rounded-2xl p-5 border border-[var(--gray-200)]">
      {children}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full transition-all duration-300"
          style={{
            background:
              i <= step
                ? "var(--primary, #1B4FD8)"
                : "var(--gray-200, #E4EAFB)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WorkerRegisterClient({ categories }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [bio, setBio] = useState("");

  // Step 3
  const [districts, setDistricts] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  // ── Toggles ──────────────────────────────────────────────────────────────────

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id)
        ? prev.filter((v) => v !== id)
        : prev.length >= 4 ? prev : [...prev, id]
    );
  };

  const toggleDistrict = (d: string) =>
    setDistricts((prev) =>
      prev.includes(d) ? prev.filter((v) => v !== d) : [...prev, d]
    );

  const toggleDay = (key: string) =>
    setAvailableDays((prev) =>
      prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
    );

  // ── Validation ────────────────────────────────────────────────────────────────

  const validate = (): string => {
    if (step === 1) {
      if (!fullName.trim()) return "Ad Soyad daxil edin.";
      if (!phone.trim()) return "Telefon daxil edin.";
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return "Email düzgün deyil.";
      if (password.length < 6) return "Şifrə ən az 6 simvol olmalıdır.";
    }
    if (step === 2) {
      if (categoryIds.length === 0) return "Ən az 1 kateqoriya seçin.";
      if (!experience) return "Təcrübə seçin.";
      if (!priceMin || !priceMax) return "Qiymət aralığı daxil edin.";
      if (Number(priceMin) >= Number(priceMax))
        return "Minimum qiymət maksimumdan az olmalıdır.";
    }
    if (step === 3) {
      if (districts.length === 0) return "Ən az 1 rayon seçin.";
      if (availableDays.length === 0) return "Ən az 1 iş günü seçin.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => (s === 1 ? 2 : 3) as 1 | 2 | 3);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => (s === 3 ? 2 : 1) as 1 | 2 | 3);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  // Uses RPC (SECURITY DEFINER) to bypass RLS —
  // because after signUp with email confirmation, auth.uid() is null
  // so direct INSERT into profiles/worker_profiles would fail RLS.

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), role: "worker" },
        },
      });

      if (authError) {
        setError(
          authError.message.includes("already registered")
            ? "Bu email artıq qeydiyyatdan keçib. Giriş edin."
            : `Xəta: ${authError.message}`
        );
        return;
      }

      if (!authData.user) {
        setError("İstifadəçi yaradılmadı. Yenidən cəhd edin.");
        return;
      }

      const userId = authData.user.id;
      const cleanPhone = phone.trim().startsWith("+994")
        ? phone.trim()
        : `+994${phone.trim()}`;

      // 2. Call RPC — SECURITY DEFINER bypasses RLS
      const { error: rpcError } = await supabase.rpc("create_worker_profile", {
        p_user_id: userId,
        p_full_name: fullName.trim(),
        p_phone: cleanPhone,
        p_category_id: categoryIds[0],
        p_category_ids: categoryIds,
        p_bio: bio.trim() || null,
        p_experience_years: experienceToYears(experience),
        p_price_min: Number(priceMin),
        p_price_max: Number(priceMax),
        p_available_days: availableDays,
        p_available_districts: districts,
      });

      if (rpcError) {
        setError(`Xəta: ${rpcError.message}`);
        return;
      }

      setStep("success");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1F3C] via-[#162F6A] to-[#1E1B6E] flex items-center justify-center px-5 py-12">

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[440px]">

        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-white tracking-tight flex items-center justify-center mb-8"
        >
          Pronto<span className="text-[var(--primary)]">.</span>az
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">

          {/* ── SUCCESS ───────────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[var(--primary-bg)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="font-serif text-[24px] font-bold text-[var(--navy)] mb-3">
                Müraciətiniz qəbul edildi!
              </h2>
              <p className="text-[15px] text-[var(--gray-400)] leading-relaxed mb-6">
                Admin yoxlamasından sonra hesabınız aktivləşəcək. Adətən{" "}
                <span className="font-semibold text-[var(--navy)]">24–48 saat</span>{" "}
                ərzində cavab veririk.
              </p>
              <div className="bg-[var(--gray-50)] rounded-2xl p-5 text-left mb-8 border border-[var(--gray-200)]">
                <p className="text-[13px] font-bold text-[var(--navy)] mb-3">
                  📌 Növbəti addımlar:
                </p>
                <ul className="space-y-3">
                  {[
                    "Admin məlumatlarınızı yoxlayır",
                    "Emailinizə aktivləşdirmə linki göndərilir",
                    "Hesabınız açılır, sifarişlərə baxmağa başlayırsınız",
                  ].map((text, i) => (
                    <li key={i} className="text-[14px] text-[var(--gray-600)] flex items-start gap-3">
                      <span className="text-[var(--primary)] shrink-0 font-bold">{i + 1}.</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/login"
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-[var(--primary)] text-white text-[16px] font-bold hover:bg-[var(--primary-light)] transition-colors"
              >
                Giriş səhifəsinə get
              </Link>
            </div>
          )}

          {/* ── FORM STEPS ────────────────────────────────────────────────── */}
          {step !== "success" && (
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider mb-6 bg-[var(--primary-bg)] text-[var(--primary)]">
                ⚒️ Usta qeydiyyatı · {step}/3
              </div>

              <h1 className="font-serif text-[28px] font-bold text-[var(--navy)] mb-2">
                {step === 1 && "Hesab məlumatları"}
                {step === 2 && "Peşə məlumatları"}
                {step === 3 && "Əlçatanlıq"}
              </h1>
              <p className="text-[15px] text-[var(--gray-400)] mb-8">
                {step === 1 && "Pronto.az-da usta kimi qeydiyyat"}
                {step === 2 && "Hansı sahələrdə xidmət göstərirsiniz?"}
                {step === 3 && "Hansı ərazilərdə və günlərdə işləyirsiniz?"}
              </p>

              <ProgressBar step={step as number} />

              {/* ── STEP 1 ──────────────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5">

                  <Section>
                    <label className={labelClass}>Ad Soyad</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Rauf Əliyev"
                      className={inputClass}
                    />
                  </Section>

                  <Section>
                    <label className={labelClass}>Telefon</label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-4 py-4 bg-white border-[1.5px] border-[var(--gray-200)] rounded-xl text-[16px] font-medium text-[var(--navy)] shrink-0">
                        🇦🇿 +994
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="50 123 45 67"
                        className="flex-1 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-4 text-[16px] text-[var(--navy)] bg-white outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(27,79,216,0.08)] transition-all placeholder:text-[var(--gray-400)]"
                      />
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rauf@example.com"
                      className={inputClass}
                    />
                  </Section>

                  <Section>
                    <label className={labelClass}>Şifrə</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 simvol"
                      minLength={6}
                      className={inputClass}
                    />
                  </Section>

                </div>
              )}

              {/* ── STEP 2 ──────────────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5">

                  <Section>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[13px] font-bold text-[var(--gray-600)]">
                        Kateqoriya
                      </label>
                      <span
                        className="text-[12px] font-bold px-3 py-1 rounded-full"
                        style={{
                          background: categoryIds.length >= 4 ? "#FEF3C7" : "var(--primary-bg)",
                          color: categoryIds.length >= 4 ? "#92400E" : "var(--primary)",
                        }}
                      >
                        {categoryIds.length}/4 seçildi
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {categories.map((cat) => {
                        const sel = categoryIds.includes(cat.id);
                        const maxed = !sel && categoryIds.length >= 4;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => !maxed && toggleCategory(cat.id)}
                            disabled={maxed}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all border-[1.5px] bg-white"
                            style={{
                              borderColor: sel ? "var(--primary)" : "var(--gray-200)",
                              background: sel ? "var(--primary-bg)" : "white",
                              opacity: maxed ? 0.4 : 1,
                              cursor: maxed ? "not-allowed" : "pointer",
                            }}
                          >
                            <span className="text-[20px]">{cat.icon}</span>
                            <span
                              className="text-[13px] font-semibold"
                              style={{ color: sel ? "var(--primary)" : "var(--navy)" }}
                            >
                              {cat.name_az}
                            </span>
                            {sel && (
                              <span className="ml-auto font-bold" style={{ color: "var(--primary)" }}>✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>Təcrübə</label>
                    <div className="flex flex-wrap gap-2.5">
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setExperience(opt)}
                          className="px-4 py-2.5 rounded-full text-[14px] font-medium transition-all border-[1.5px] bg-white"
                          style={{
                            borderColor: experience === opt ? "var(--primary)" : "var(--gray-200)",
                            background: experience === opt ? "var(--primary-bg)" : "white",
                            color: experience === opt ? "var(--primary)" : "var(--navy)",
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>Qiymət aralığı (₼)</label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center flex-1 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3.5 gap-2 bg-white focus-within:border-[var(--primary)] transition-all">
                        <input
                          type="number"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          placeholder="30"
                          className="w-full bg-transparent text-[18px] font-bold text-[var(--navy)] outline-none font-serif"
                        />
                        <span className="text-[16px] font-bold text-[var(--gray-400)]">₼</span>
                      </div>
                      <span className="text-[18px] font-bold text-[var(--gray-400)]">—</span>
                      <div className="flex items-center flex-1 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3.5 gap-2 bg-white focus-within:border-[var(--primary)] transition-all">
                        <input
                          type="number"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          placeholder="200"
                          className="w-full bg-transparent text-[18px] font-bold text-[var(--navy)] outline-none font-serif"
                        />
                        <span className="text-[16px] font-bold text-[var(--gray-400)]">₼</span>
                      </div>
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>
                      Özünüz haqqında{" "}
                      <span className="font-normal text-[var(--gray-400)]">(istəyə bağlı)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Peşəkar santexnik, 8 illik təcrübəm var..."
                      maxLength={300}
                      className="w-full border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-4 text-[15px] text-[var(--navy)] bg-white outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(27,79,216,0.08)] transition-all placeholder:text-[var(--gray-400)] resize-none"
                    />
                    <p className="text-[12px] text-right mt-1.5 text-[var(--gray-400)]">
                      {bio.length}/300
                    </p>
                  </Section>

                </div>
              )}

              {/* ── STEP 3 ──────────────────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-5">

                  <Section>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[13px] font-bold text-[var(--gray-600)]">
                        İş rayonları — Bakı
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDistricts(
                            districts.length === BAKU_DISTRICTS.length
                              ? []
                              : [...BAKU_DISTRICTS]
                          )
                        }
                        className="text-[13px] font-bold transition-colors"
                        style={{ color: "var(--primary)" }}
                      >
                        {districts.length === BAKU_DISTRICTS.length ? "Sıfırla" : "Hamısı"}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {BAKU_DISTRICTS.map((d) => {
                        const sel = districts.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDistrict(d)}
                            className="px-2 py-3 rounded-xl text-[13px] font-medium transition-all text-center border-[1.5px] bg-white"
                            style={{
                              borderColor: sel ? "var(--primary)" : "var(--gray-200)",
                              background: sel ? "var(--primary-bg)" : "white",
                              color: sel ? "var(--primary)" : "var(--navy)",
                            }}
                          >
                            {sel ? "✓ " : ""}{d}
                          </button>
                        );
                      })}
                    </div>
                    {districts.length > 0 && (
                      <p className="text-[13px] mt-3" style={{ color: "var(--gray-400)" }}>
                        {districts.length} rayon seçildi
                      </p>
                    )}
                  </Section>

                  <Section>
                    <label className={labelClass}>İş günləri</label>
                    <div className="flex gap-2.5 flex-wrap">
                      {AVAILABLE_DAYS.map(({ key, label }) => {
                        const sel = availableDays.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleDay(key)}
                            className="w-12 h-12 rounded-xl text-[13px] font-bold transition-all border-[1.5px]"
                            style={{
                              borderColor: sel ? "var(--primary)" : "var(--gray-200)",
                              background: sel ? "var(--primary-bg)" : "white",
                              color: sel ? "var(--primary)" : "var(--gray-600)",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </Section>

                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex items-start gap-3">
                  <span className="text-[18px] shrink-0">⚠️</span>
                  <p className="text-[14px] font-medium text-red-600">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                {(step as number) > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-4 rounded-2xl border-[1.5px] border-[var(--gray-200)] text-[16px] font-semibold text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                  >
                    Geri
                  </button>
                )}
                <button
                  type="button"
                  onClick={step === 3 ? handleSubmit : handleNext}
                  disabled={loading}
                  className={`flex-[2] font-bold text-[16px] py-4 rounded-2xl transition-all duration-200 ${
                    loading
                      ? "bg-[var(--gray-200)] text-[var(--gray-400)] cursor-not-allowed"
                      : "bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(27,79,216,0.3)] hover:bg-[var(--primary-light)] active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Göndərilir...
                    </span>
                  ) : step === 3 ? (
                    "Qeydiyyatı tamamla"
                  ) : (
                    "Növbəti →"
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-7">
                <div className="h-px flex-1 bg-[var(--gray-200)]" />
                <p className="text-[12px] font-bold text-[var(--gray-400)] uppercase tracking-wider whitespace-nowrap">
                  artıq hesabınız var?
                </p>
                <div className="h-px flex-1 bg-[var(--gray-200)]" />
              </div>

              <Link
                href="/login"
                className="flex items-center justify-center w-full py-4 rounded-2xl border-[1.5px] border-[var(--gray-200)] text-[16px] font-semibold text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
              >
                Daxil ol
              </Link>
            </>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center mt-5">
          <Link
            href="/"
            className="text-[14px] text-white/30 hover:text-white/50 transition-colors"
          >
            ← Ana səhifəyə qayıt
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function experienceToYears(exp: string): number {
  if (exp === "1 ildən az") return 0;
  if (exp === "1–3 il") return 2;
  if (exp === "3–5 il") return 4;
  if (exp === "5–10 il") return 7;
  if (exp === "10+ il") return 10;
  return 0;
}
