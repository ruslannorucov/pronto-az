"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const DISTRICTS = [
  "Nəsimi", "Xətai", "Sabunçu", "Suraxanı", "Binəqədi",
  "Nizami", "Yasamal", "Pirəkəşkül", "Sabail", "Abşeron",
  "Xırdalan", "Novxanı",
];

// Real UUIDs from categories table
const CATEGORIES = [
  { id: "11111111-1111-1111-1111-111111111111", icon: "🔧", name: "Santexnik" },
  { id: "22222222-2222-2222-2222-222222222222", icon: "⚡", name: "Elektrik"  },
  { id: "33333333-3333-3333-3333-333333333333", icon: "🎨", name: "Boyaqçı"   },
  { id: "44444444-4444-4444-4444-444444444444", icon: "🏠", name: "Ev təmiri" },
  { id: "55555555-5555-5555-5555-555555555555", icon: "📦", name: "Köçmə"     },
  { id: "66666666-6666-6666-6666-666666666666", icon: "🧹", name: "Təmizlik"  },
];

const EXPERIENCE_OPTIONS = [
  { value: "lt1",    label: "<1",  sub: "ildən az", years: 0  },
  { value: "1-4",    label: "1–4", sub: "il",       years: 2  },
  { value: "5-9",    label: "5–9", sub: "il",       years: 7  },
  { value: "10plus", label: "10+", sub: "il",       years: 10 },
];

// ─── Shared styles ─────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
    position: "relative" as const,
    overflow: "hidden",
    fontFamily: "'DM Sans', sans-serif",
  } as React.CSSProperties,

  grid: {
    position: "absolute" as const,
    inset: 0,
    pointerEvents: "none" as const,
    backgroundImage:
      "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
    WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
  } as React.CSSProperties,

  card: {
    position: "relative" as const,
    width: "100%",
    maxWidth: 440,
    background: "#ffffff",
    borderRadius: 24,
    padding: "36px 32px 28px",
    boxShadow: "0 24px 64px rgba(13,31,60,0.35)",
  } as React.CSSProperties,

  logo: {
    textAlign: "center" as const,
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#0D1F3C",
    letterSpacing: "-0.3px",
  } as React.CSSProperties,

  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#0D1F3C",
    textAlign: "center" as const,
    margin: "18px 0 4px",
  } as React.CSSProperties,

  sub: {
    fontSize: 13,
    color: "#94A3C0",
    textAlign: "center" as const,
    margin: "0 0 20px",
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#4A5878",
    marginBottom: 6,
    letterSpacing: "0.02em",
    fontFamily: "'DM Sans', sans-serif",
  } as React.CSSProperties,

  input: {
    width: "100%",
    border: "1.5px solid #E4EAFB",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: 13,
    color: "#0D1F3C",
    background: "#F8FAFF",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,

  cta: (active: boolean): React.CSSProperties => ({
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: active ? "pointer" : "not-allowed",
    background: active ? "linear-gradient(135deg, #1B4FD8, #2563EB)" : "#E4EAFB",
    color: active ? "#fff" : "#94A3C0",
    boxShadow: active ? "0 4px 16px rgba(27,79,216,0.28)" : "none",
  }),

  backBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: 14,
    marginTop: 8,
    border: "1.5px solid #E4EAFB",
    background: "transparent",
    fontSize: 13,
    fontWeight: 600,
    color: "#94A3C0",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  } as React.CSSProperties,
};

const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = "#1B4FD8"; e.target.style.background = "#fff"; };
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = "#E4EAFB"; e.target.style.background = "#F8FAFF"; };
const wrapIn   = (e: React.FocusEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = "#1B4FD8"; e.currentTarget.style.background = "#fff"; };
const wrapOut  = (e: React.FocusEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = "#E4EAFB"; e.currentTarget.style.background = "#F8FAFF"; };

// ─── Step bar ──────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
      {[1, 2, 3].map((n, i) => (
        <div key={n} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700,
            background: n < current ? "#1B4FD8" : n === current ? "#EFF4FF" : "#F1F5FE",
            border: n === current ? "1.5px solid #1B4FD8" : "none",
            color: n < current ? "#fff" : n === current ? "#1B4FD8" : "#94A3C0",
          }}>
            {n < current ? "✓" : n}
          </div>
          {i < 2 && <div style={{ height: 1.5, width: 32, background: n < current ? "#1B4FD8" : "#E4EAFB" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Upload zone ───────────────────────────────────────────────────────────────

function UploadZone({ file, setter, label, inputId }: {
  file: File | null;
  setter: (f: File) => void;
  label: string;
  inputId: string;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={S.label}>
        {label}{" "}
        <span style={{ fontSize: 10, fontWeight: 400, color: "#94A3C0" }}>(ixtiyari)</span>
      </label>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) setter(f); }}
        onClick={() => document.getElementById(inputId)?.click()}
        style={{
          border: file ? "1.5px solid #10B981" : `2px dashed ${dragging ? "#1B4FD8" : "#BFCFFE"}`,
          borderRadius: 14, padding: "16px 14px", cursor: "pointer", transition: "all 0.15s",
          background: file ? "#F0FDF4" : dragging ? "#EFF4FF" : "#F8FAFF",
        }}
      >
        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🪪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#065F46" }}>{file.name}</div>
              <div style={{ fontSize: 10, color: "#10B981" }}>{(file.size / 1024 / 1024).toFixed(1)} MB · Yükləndi</div>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>✓</div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0D1F3C", marginBottom: 2 }}>Şəkil yükləyin</div>
            <div style={{ fontSize: 10, color: "#94A3C0" }}>
              Sürükləyin və ya <span style={{ color: "#1B4FD8", fontWeight: 600 }}>seçin</span> · JPG, PNG · Maks 5 MB
            </div>
          </div>
        )}
      </div>
      <input id={inputId} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) setter(f); }} />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function WorkerRegisterPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [dropOpen,  setDropOpen]  = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Step 2
  const [categoryId,  setCategoryId]  = useState("");
  const [experience,  setExperience]  = useState("");
  const [priceMin,    setPriceMin]    = useState("");
  const [priceMax,    setPriceMax]    = useState("");
  const [bio,         setBio]         = useState("");

  // Step 3
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack,  setIdBack]  = useState<File | null>(null);
  const [agreed,  setAgreed]  = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Validation ────────────────────────────────────────────────────────────

  const step1Valid = !!(
    firstName.trim() && lastName.trim() && phone.trim() &&
    email.trim() && password.length >= 6 && districts.length > 0
  );
  const step2Valid = !!(categoryId && experience);
  const step3Valid = agreed;

  // ─── District helpers ──────────────────────────────────────────────────────

  function toggleDistrict(d: string) {
    setDistricts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }
  function removeDistrict(e: React.MouseEvent, d: string) {
    e.stopPropagation();
    setDistricts(prev => prev.filter(x => x !== d));
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      // 1. Auth signup — trigger avtomatik profiles-a insert edir
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            phone,
            role: "worker",
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("İstifadəçi yaradılmadı.");

      const uid = data.user.id;

      // experience_range → experience_years mapping
      const expOption = EXPERIENCE_OPTIONS.find(o => o.value === experience);

      // 2. worker_profiles insert
      const { error: wpError } = await supabase
        .from("worker_profiles")
        .insert({
          user_id:              uid,
          category_id:          categoryId,
          category_ids:         [categoryId],
          available_districts:  districts,
          experience_range:     experience,
          experience_years:     expOption?.years ?? 0,
          price_min:            priceMin ? Number(priceMin) : null,
          price_max:            priceMax ? Number(priceMax) : null,
          bio:                  bio.trim() || null,
          verified:             false,
          is_active:            false,
          rating:               0,
          review_count:         0,
        });
      if (wpError) throw wpError;

      // 3. ID doc upload — xəta olsa da redirect-i bloklamır
      try {
        if (idFront) {
          const ext = idFront.name.split(".").pop();
          await supabase.storage.from("worker-docs").upload(`${uid}/id_front.${ext}`, idFront);
        }
        if (idBack) {
          const ext = idBack.name.split(".").pop();
          await supabase.storage.from("worker-docs").upload(`${uid}/id_back.${ext}`, idBack);
        }
      } catch {
        // Storage xətası qeydiyyatı dayandırmır
      }

      // 4. Redirect — məlumatları URL params ilə ötür
      const cat = CATEGORIES.find(c => c.id === categoryId);
      const expLabel = EXPERIENCE_OPTIONS.find(o => o.value === experience);
      const params = new URLSearchParams({
        name:       `${firstName} ${lastName}`.trim(),
        phone:      phone,
        category:   cat?.name ?? "",
        catIcon:    cat?.icon ?? "",
        experience: expLabel ? `${expLabel.label} ${expLabel.sub}` : "",
        priceMin:   priceMin,
        priceMax:   priceMax,
        districts:  districts.join(","),
      });
      router.push(`/worker/pending?${params.toString()}`);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <div style={S.grid} />
      <div style={S.card}>

        <div style={S.logo}>Pronto<span style={{ color: "#1B4FD8" }}>.</span>az</div>
        <StepBar current={step} />

        {/* ══ STEP 1 ══ */}
        {step === 1 && (
          <>
            <h1 style={S.h1}>Hesab yaradın</h1>
            <p style={S.sub}>Sifariş almağa başlamaq üçün qeydiyyatdan keçin</p>

            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#EFF4FF", color: "#1B4FD8", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, width: "fit-content", margin: "0 auto 20px", border: "1px solid #BFCFFE" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1B4FD8", opacity: 0.7, display: "inline-block" }} />
              Usta qeydiyyatı
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Ad / Soyad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={S.label}>Ad</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Rəşad" style={S.input} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label style={S.label}>Soyad</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Hüseynov" style={S.input} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label style={S.label}>Telefon nömrəsi</label>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E4EAFB", borderRadius: 12, background: "#F8FAFF", overflow: "hidden" }}
                  onFocusCapture={wrapIn} onBlurCapture={wrapOut}>
                  <span style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#0D1F3C", borderRight: "1.5px solid #E4EAFB", whiteSpace: "nowrap", userSelect: "none", fontFamily: "'DM Sans', sans-serif" }}>+994</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="50 123 45 67"
                    style={{ flex: 1, padding: "11px 12px", fontSize: 13, color: "#0D1F3C", background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={S.label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@mail.com" style={S.input} onFocus={focusIn} onBlur={focusOut} />
              </div>

              {/* Ərazilər */}
              <div>
                <label style={S.label}>İşləyə biləcəyiniz ərazilər</label>
                <div style={{ position: "relative" }} ref={dropRef}>
                  <div onClick={() => setDropOpen(p => !p)} style={{
                    width: "100%", minHeight: 44, border: `1.5px solid ${dropOpen ? "#1B4FD8" : "#E4EAFB"}`,
                    borderRadius: dropOpen ? "12px 12px 0 0" : 12, padding: "9px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    background: dropOpen ? "#fff" : "#F8FAFF", boxSizing: "border-box",
                  }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                      {districts.length === 0
                        ? <span style={{ fontSize: 13, color: "#94A3C0" }}>Ərazi seçin...</span>
                        : districts.map(d => (
                          <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#EFF4FF", color: "#1B4FD8", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: "1px solid #BFCFFE" }}>
                            {d}
                            <span onClick={e => removeDistrict(e, d)} style={{ cursor: "pointer", opacity: 0.6, fontSize: 9, lineHeight: 1 }}>✕</span>
                          </span>
                        ))
                      }
                    </div>
                    <span style={{ color: "#94A3C0", fontSize: 11, flexShrink: 0, transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
                  </div>
                  {dropOpen && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #1B4FD8", borderTop: "none", borderRadius: "0 0 12px 12px", zIndex: 20, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(13,31,60,0.12)" }}>
                      {DISTRICTS.map(d => {
                        const sel = districts.includes(d);
                        return (
                          <div key={d} onClick={() => toggleDistrict(d)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", fontSize: 12, cursor: "pointer", borderBottom: "1px solid #F1F5FE", background: sel ? "#EFF4FF" : "#fff", color: sel ? "#1B4FD8" : "#0D1F3C", fontWeight: sel ? 600 : 400, fontFamily: "'DM Sans', sans-serif" }}>
                            <span style={{ width: 15, height: 15, minWidth: 15, borderRadius: 4, border: `1.5px solid ${sel ? "#1B4FD8" : "#E4EAFB"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, background: sel ? "#1B4FD8" : "transparent", color: "#fff" }}>{sel ? "✓" : ""}</span>
                            {d}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Şifrə */}
              <div>
                <label style={S.label}>Şifrə</label>
                <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E4EAFB", borderRadius: 12, background: "#F8FAFF", overflow: "hidden" }}
                  onFocusCapture={wrapIn} onBlurCapture={wrapOut}>
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 simvol"
                    style={{ flex: 1, padding: "11px 14px", fontSize: 13, color: "#0D1F3C", background: "transparent", border: "none", outline: "none", fontFamily: "'DM Sans', sans-serif" }} />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    style={{ padding: "0 14px", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#94A3C0" }}>
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", margin: 0 }}>{error}</p>}

              <button onClick={() => { setError(""); setStep(2); }} disabled={!step1Valid} style={S.cta(step1Valid)}>
                Növbəti addım →
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#94A3C0", textAlign: "center", marginTop: 16 }}>
              Artıq hesabınız var?{" "}
              <Link href="/login" style={{ color: "#1B4FD8", fontWeight: 500, textDecoration: "none" }}>Daxil olun</Link>
            </p>
          </>
        )}

        {/* ══ STEP 2 ══ */}
        {step === 2 && (
          <>
            <h1 style={S.h1}>Peşənizi seçin</h1>
            <p style={S.sub}>Hansı sahədə xidmət göstərirsiniz?</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Kateqoriya */}
              <div>
                <label style={S.label}>Kateqoriya</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <div key={c.id} onClick={() => setCategoryId(c.id)} style={{
                      border: `1.5px solid ${categoryId === c.id ? "#1B4FD8" : "#E4EAFB"}`,
                      borderRadius: 12, padding: "10px 6px", textAlign: "center", cursor: "pointer",
                      background: categoryId === c.id ? "#EFF4FF" : "#F8FAFF",
                      boxShadow: categoryId === c.id ? "0 2px 8px rgba(27,79,216,0.12)" : "none",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>{c.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: categoryId === c.id ? "#1B4FD8" : "#0D1F3C" }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Təcrübə */}
              <div>
                <label style={S.label}>Təcrübə</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => setExperience(opt.value)} style={{
                      border: `1.5px solid ${experience === opt.value ? "#1B4FD8" : "#E4EAFB"}`,
                      borderRadius: 12, padding: "10px 4px", textAlign: "center", cursor: "pointer",
                      background: experience === opt.value ? "#EFF4FF" : "#F8FAFF",
                      boxShadow: experience === opt.value ? "0 2px 8px rgba(27,79,216,0.12)" : "none",
                      transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700, display: "block", fontFamily: "'Playfair Display', serif", lineHeight: 1.2, color: experience === opt.value ? "#1B4FD8" : "#0D1F3C" }}>{opt.label}</span>
                      <span style={{ fontSize: 9, display: "block", marginTop: 3, color: experience === opt.value ? "#BFCFFE" : "#94A3C0" }}>{opt.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qiymət */}
              <div>
                <label style={S.label}>Qiymət aralığı <span style={{ fontSize: 10, fontWeight: 400, color: "#94A3C0" }}>(₼/saat, ixtiyari)</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { lbl: "Minimum", val: priceMin, set: setPriceMin },
                    { lbl: "Maksimum", val: priceMax, set: setPriceMax },
                  ].map(({ lbl, val, set }) => (
                    <div key={lbl}>
                      <div style={{ fontSize: 10, color: "#94A3C0", marginBottom: 4 }}>{lbl}</div>
                      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E4EAFB", borderRadius: 12, background: "#F8FAFF", overflow: "hidden" }}
                        onFocusCapture={wrapIn} onBlurCapture={wrapOut}>
                        <input type="number" value={val} onChange={e => set(e.target.value)} placeholder="0"
                          style={{ flex: 1, padding: "10px 12px", border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 700, color: "#0D1F3C", fontFamily: "'Playfair Display', serif", width: 60 }} />
                        <span style={{ padding: "0 12px", fontSize: 14, fontWeight: 700, color: "#94A3C0", borderLeft: "1.5px solid #E4EAFB", fontFamily: "'DM Sans', sans-serif" }}>₼</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label style={S.label}>Özünüz haqqında <span style={{ fontSize: 10, fontWeight: 400, color: "#94A3C0" }}>(ixtiyari)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                  placeholder="10 il təcrübəm var, keyfiyyətli iş zəmanəti..."
                  style={{ ...S.input, resize: "none" }} onFocus={focusIn} onBlur={focusOut} />
              </div>

              {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", margin: 0 }}>{error}</p>}

              <button onClick={() => { setError(""); setStep(3); }} disabled={!step2Valid} style={S.cta(step2Valid)}>
                Növbəti addım →
              </button>
              <button onClick={() => setStep(1)} style={S.backBtn}>← Geri</button>
            </div>
          </>
        )}

        {/* ══ STEP 3 ══ */}
        {step === 3 && (
          <>
            <h1 style={S.h1}>Şəxsiyyəti təsdiqləyin</h1>
            <p style={S.sub}>Sənəd yükləmə ixtiyaridir — sonra da edə bilərsiniz</p>

            <UploadZone file={idFront} setter={setIdFront} label="Şəxsiyyət vəsiqəsi — ön üz"   inputId="id-front" />
            <UploadZone file={idBack}  setter={setIdBack}  label="Şəxsiyyət vəsiqəsi — arxa üz" inputId="id-back"  />

            {/* Info */}
            <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "12px 14px", margin: "4px 0 20px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⏳</span>
              <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.6 }}>
                <strong style={{ display: "block", fontWeight: 700, marginBottom: 2 }}>Sənəd yoxlaması 24–48 saat çəkir</strong>
                Təsdiq sonrası WhatsApp və email bildirişi alacaqsınız. Sənədsiz hesabla da daxil ola bilərsiniz.
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[
                { text: "Əsas məlumatlar daxil edildi", done: true  },
                { text: "Peşə və ərazilər seçildi",     done: true  },
                { text: "Sənəd yükləmə — ixtiyari",     done: false },
              ].map(({ text, done }, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: done ? "#4A5878" : "#94A3C0" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, background: done ? "#D1FAE5" : "#F1F5FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: done ? "#10B981" : "#94A3C0" }}>
                    {done ? "✓" : i + 1}
                  </div>
                  {text}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#E4EAFB", margin: "4px 0 18px" }} />

            {/* Şərtlər */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
              <button type="button" onClick={() => setAgreed(a => !a)} style={{
                width: 18, height: 18, minWidth: 18, borderRadius: 4,
                border: `1.5px solid ${agreed ? "#1B4FD8" : "#E4EAFB"}`,
                background: agreed ? "#1B4FD8" : "#F8FAFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#fff", marginTop: 1, cursor: "pointer", flexShrink: 0,
              }}>
                {agreed ? "✓" : ""}
              </button>
              <p style={{ fontSize: 12, color: "#4A5878", lineHeight: 1.6, margin: 0 }}>
                <Link href="/terms" style={{ color: "#1B4FD8", fontWeight: 600, textDecoration: "none" }}>İstifadəçi şərtlərini</Link>
                {" "}və{" "}
                <Link href="/privacy" style={{ color: "#1B4FD8", fontWeight: 600, textDecoration: "none" }}>Gizlilik siyasətini</Link>
                {" "}qəbul edirəm
              </p>
            </div>

            {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", margin: "0 0 10px" }}>{error}</p>}

            {/* Primary CTA */}
            <button onClick={handleSubmit} disabled={!step3Valid || loading} style={S.cta(step3Valid && !loading)}>
              {loading ? "Göndərilir..." : "Göndər və təsdiq gözlə →"}
            </button>

            {/* Skip docs link */}
            <button onClick={handleSubmit} disabled={!step3Valid || loading} style={{
              width: "100%", background: "none", border: "none",
              cursor: step3Valid && !loading ? "pointer" : "not-allowed",
              fontSize: 12, color: "#94A3C0", marginTop: 10,
              fontFamily: "'DM Sans', sans-serif",
              opacity: step3Valid ? 1 : 0.4,
            }}>
              Sənədsiz davam et →{" "}
              <span style={{ color: "#1B4FD8", fontWeight: 600 }}>sonra yükləyə bilərəm</span>
            </button>

            <button onClick={() => setStep(2)} style={{ ...S.backBtn, marginTop: 10 }}>← Geri</button>
          </>
        )}

      </div>
    </div>
  );
}
