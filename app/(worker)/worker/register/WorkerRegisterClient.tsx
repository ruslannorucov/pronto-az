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
              i <= (typeof step === 'number' ? step : 3)
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

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Auth istifadəçisini yaradırıq
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim(), role: "worker" },
        },
      });

      if (authError) {
        setError(authError.message.includes("already registered") 
          ? "Bu email artıq qeydiyyatdan keçib." 
          : authError.message);
        return;
      }

      const user = authData.user;
      if (!user) throw new Error("İstifadəçi yaradıla bilmədi.");

      const cleanPhone = phone.trim().startsWith("+994") ? phone.trim() : `+994${phone.trim()}`;

      // 2. ÖNCƏ: Profiles cədvəlini yaradırıq (Foreign Key xətasının qarşısını almaq üçün)
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: fullName.trim(),
          phone: cleanPhone,
          role: "worker",
          is_verified: false
        });

      if (profileError) {
        setError(`Profil xətası: ${profileError.message}`);
        return;
      }

      // 3. SONRA: Worker Profiles cədvəlinə detalları yazırıq
      const { error: workerError } = await supabase
        .from("worker_profiles")
        .insert({
          user_id: user.id,
          category_id: categoryIds[0],
          bio: bio.trim() || null,
          experience_years: experienceToYears(experience),
          price_min: Number(priceMin),
          price_max: Number(priceMax),
          available_days: availableDays,
          verified: false,
          is_active: false
          // Qeyd: Əgər bazada 'available_districts' sütunu varsa bura əlavə edə bilərsən
        });

      if (workerError) {
        setError(`Usta məlumatı xətası: ${workerError.message}`);
        return;
      }

      setStep("success");
    } catch (err: any) {
      setError("Gözlənilməz xəta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const firstNamePart = fullName.split(" ")[0] || "Usta";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1F3C] via-[#162F6A] to-[#1E1B6E] flex items-center justify-center px-5 py-12">

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

        <Link
          href="/"
          className="font-serif text-2xl font-bold text-white tracking-tight flex items-center justify-center mb-8"
        >
          Pronto<span className="text-[var(--primary)]">.</span>az
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[var(--primary-bg)] rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="font-serif text-[24px] font-bold text-[var(--navy)] mb-3">
                Təbriklər, {firstNamePart}!
              </h2>
              <p className="text-[15px] text-[var(--gray-400)] leading-relaxed mb-6">
                Müraciətiniz qəbul edildi. Admin yoxlamasından sonra (24-48 saat) hesabınız aktivləşəcək.
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-[var(--primary)] text-white text-[16px] font-bold hover:bg-[var(--primary-light)] transition-colors"
              >
                Giriş səhifəsinə get
              </Link>
            </div>
          )}

          {step !== "success" && (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider mb-6 bg-[var(--primary-bg)] text-[var(--primary)]">
                ⚒️ Usta qeydiyyatı · {step}/3
              </div>

              <h1 className="font-serif text-[28px] font-bold text-[var(--navy)] mb-2">
                {step === 1 && "Hesab məlumatları"}
                {step === 2 && "Peşə məlumatları"}
                {step === 3 && "Əlçatanlıq"}
              </h1>

              <ProgressBar step={step as number} />

              {step === 1 && (
                <div className="space-y-5">
                  <Section>
                    <label className={labelClass}>Ad Soyad</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Məsələn: Rauf Əliyev"
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
                        className="flex-1 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-4 text-[16px] text-[var(--navy)] bg-white outline-none focus:border-[var(--primary)] transition-all"
                      />
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rauf@mail.com"
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
                      className={inputClass}
                    />
                  </Section>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <Section>
                    <div className="flex items-center justify-between mb-4">
                      <label className={labelClass}>Kateqoriya seçin</label>
                      <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] px-2 py-1 rounded-full">
                        {categoryIds.length}/4
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left border-[1.5px] transition-all ${
                            categoryIds.includes(cat.id) 
                            ? "border-[var(--primary)] bg-[var(--primary-bg)]" 
                            : "border-[var(--gray-200)] bg-white"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span className="text-[12px] font-semibold">{cat.name_az}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>Təcrübə</label>
                    <div className="flex flex-wrap gap-2">
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setExperience(opt)}
                          className={`px-3 py-2 rounded-full text-[13px] border-[1.5px] transition-all ${
                            experience === opt 
                            ? "border-[var(--primary)] bg-[var(--primary-bg)] text-[var(--primary)]" 
                            : "border-[var(--gray-200)] bg-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>Qiymət aralığı (₼)</label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-1/2 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)]"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-1/2 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </Section>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <Section>
                    <label className={labelClass}>İş rayonları (Bakı)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {BAKU_DISTRICTS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDistrict(d)}
                          className={`py-2 rounded-lg text-[12px] border-[1.5px] transition-all ${
                            districts.includes(d) 
                            ? "border-[var(--primary)] bg-[var(--primary-bg)]" 
                            : "border-[var(--gray-200)] bg-white"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section>
                    <label className={labelClass}>İş günləri</label>
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_DAYS.map((day) => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`w-10 h-10 rounded-lg text-[12px] font-bold border-[1.5px] transition-all ${
                            availableDays.includes(day.key) 
                            ? "border-[var(--primary)] bg-[var(--primary-bg)] text-[var(--primary)]" 
                            : "border-[var(--gray-200)] bg-white"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                {step !== 1 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-4 rounded-2xl border-[1.5px] border-[var(--gray-200)] font-bold text-[var(--navy)]"
                  >
                    Geri
                  </button>
                )}
                <button
                  onClick={step === 3 ? handleSubmit : handleNext}
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl bg-[var(--primary)] text-white font-bold shadow-lg hover:bg-[var(--primary-light)] disabled:opacity-50"
                >
                  {loading ? "Gözləyin..." : step === 3 ? "Tamamla" : "Növbəti →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function experienceToYears(exp: string): number {
  const map: Record<string, number> = {
    "1 ildən az": 0,
    "1–3 il": 2,
    "3–5 il": 4,
    "5–10 il": 7,
    "10+ il": 12
  };
  return map[exp] || 0;
}