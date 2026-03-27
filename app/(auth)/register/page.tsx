"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role: "customer",
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Bu email artıq qeydiyyatdan keçib. Giriş edin.");
        } else {
          setError("Xəta baş verdi. Yenidən cəhd edin.");
        }
        return;
      }

      if (data.user) {
        setStep("verify");
      }
    } catch {
      setError("Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Card */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
        {step === "verify" ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-[var(--primary-bg)] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="font-serif text-[22px] font-bold text-[var(--navy)] mb-2">
              Emailinizi yoxlayın
            </h2>
            <p className="text-[13px] text-[var(--gray-400)] leading-relaxed mb-6">
              <span className="font-semibold text-[var(--navy)]">{email}</span>{" "}
              ünvanına təsdiq linki göndərdik. Linki klikləyib hesabınızı
              aktivləşdirin.
            </p>
            <Link
              href="/login"
              className="flex items-center justify-center w-full py-3.5 rounded-2xl bg-[var(--primary)] text-white text-[14px] font-bold hover:bg-[var(--primary-light)] transition-colors"
            >
              Giriş səhifəsinə get
            </Link>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5 bg-[var(--green-bg)] text-[var(--green)]">
              👤 Müştəri qeydiyyatı
            </div>

            <h1 className="font-serif text-[26px] font-bold text-[var(--navy)] mb-1">
              Hesab yaradın
            </h1>
            <p className="text-[14px] text-[var(--gray-400)] mb-7">
              Ən yaxşı ustaları tapın
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[var(--gray-600)] uppercase tracking-wider mb-1.5">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Əli Həsənov"
                  required
                  className="w-full border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3 text-[14px] text-[var(--navy)] bg-[var(--gray-50)] outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--gray-600)] uppercase tracking-wider mb-1.5">
                  Telefon
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-3 bg-[var(--gray-50)] border-[1.5px] border-[var(--gray-200)] rounded-xl text-[14px] font-medium text-[var(--navy)] shrink-0">
                    🇦🇿 +994
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="50 123 45 67"
                    required
                    className="flex-1 border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3 text-[14px] text-[var(--navy)] bg-[var(--gray-50)] outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--gray-600)] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  required
                  className="w-full border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3 text-[14px] text-[var(--navy)] bg-[var(--gray-50)] outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--gray-600)] uppercase tracking-wider mb-1.5">
                  Şifrə
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 simvol"
                  required
                  minLength={6}
                  className="w-full border-[1.5px] border-[var(--gray-200)] rounded-xl px-4 py-3 text-[14px] text-[var(--navy)] bg-[var(--gray-50)] outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <p className="text-[12px] font-medium text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-bold text-[15px] py-3.5 rounded-2xl transition-all duration-200 mt-2 ${
                  loading
                    ? "bg-[var(--gray-200)] text-[var(--gray-400)] cursor-not-allowed"
                    : "bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(27,79,216,0.3)] hover:bg-[var(--primary-light)] active:scale-[0.99]"
                }`}
              >
                {loading ? "Qeydiyyat edilir..." : "Hesab yarat"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-[var(--gray-200)]" />
              <p className="text-[11px] font-bold text-[var(--gray-400)] uppercase tracking-wider">
                artıq hesabınız var?
              </p>
              <div className="h-px flex-1 bg-[var(--gray-200)]" />
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center w-full py-3 rounded-2xl border-[1.5px] border-[var(--gray-200)] text-[14px] font-semibold text-[var(--navy)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
            >
              Daxil ol
            </Link>
          </>
        )}
      </div>

      {/* Usta qeydiyyatı — aşağıda, tam görünür düymə kimi */}
      {step === "form" && (
        <Link
          href="/worker/register"
          className="flex items-center justify-center gap-2 mt-4 w-full py-3.5 rounded-2xl border-[1.5px] border-white/25 bg-white/10 text-white text-[14px] font-semibold hover:bg-white/18 hover:border-white/40 transition-all"
        >
          <span>🔧</span>
          Usta kimi qeydiyyatdan keç
          <span className="text-white/60 text-[12px]">→</span>
        </Link>
      )}
    </>
  );
}

export default function RegisterPage() {
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

      <div className="relative w-full max-w-[420px]">
        <Link
          href="/"
          className="font-serif text-2xl font-bold text-white tracking-tight flex items-center justify-center mb-8"
        >
          Pronto<span className="text-[var(--primary)]">.</span>az
        </Link>

        <Suspense fallback={<div className="bg-white p-8 rounded-3xl text-center">Yüklənir...</div>}>
          <RegisterForm />
        </Suspense>

        <p className="text-center mt-3">
          <Link href="/" className="text-[13px] text-white/30 hover:text-white/50 transition-colors">
            ← Ana səhifəyə qayıt
          </Link>
        </p>
      </div>
    </div>
  );
}
