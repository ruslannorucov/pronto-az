"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkerProfile {
  user_id: string;
  bio: string | null;
  experience_years: number | null;
  experience_range: string | null;
  price_min: number | null;
  price_max: number | null;
  available_districts: string[] | null;
  rating: number | null;
  review_count: number | null;
  verified: boolean;
  is_active: boolean;
  category_ids: string[] | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  city: string | null;
  role: string;
}

interface Category {
  id: string;
  name_az: string;
  icon: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarGradient(userId: string): string {
  const gradients = [
    "linear-gradient(135deg, #1B4FD8, #2563EB)",
    "linear-gradient(135deg, #059669, #10B981)",
    "linear-gradient(135deg, #7C3AED, #8B5CF6)",
    "linear-gradient(135deg, #D97706, #F59E0B)",
    "linear-gradient(135deg, #DC2626, #EF4444)",
    "linear-gradient(135deg, #0369A1, #0EA5E9)",
  ];
  const idx = userId.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

function renderStars(rating: number | null): React.ReactNode {
  const r = rating ?? 0;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i <= Math.round(r) ? "#F59E0B" : "#E4EAFB"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function experienceLabel(range: string | null): string {
  switch (range) {
    case "lt1":   return "1 ildən az";
    case "1-4":   return "1–4 il";
    case "5-9":   return "5–9 il";
    case "10plus":return "10+ il";
    default:      return range ?? "—";
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: "linear-gradient(90deg,#E4EAFB 25%,#F1F5FE 50%,#E4EAFB 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkerPublicProfilePage() {
  const params  = useParams();
  const router  = useRouter();
  const workerId = params?.id as string;

  const [worker,     setWorker]     = useState<WorkerProfile | null>(null);
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  useEffect(() => {
    if (!workerId) return;
    void fetchData();
  }, [workerId]);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. worker_profiles
      const { data: wp, error: wpErr } = await supabase
        .from("worker_profiles")
        .select(
          "user_id,bio,experience_years,experience_range,price_min,price_max,available_districts,rating,review_count,verified,is_active,category_ids"
        )
        .eq("user_id", workerId)
        .single();

      if (wpErr || !wp) { setNotFound(true); setLoading(false); return; }
      setWorker(wp);

      // 2. profiles
      const { data: pr } = await supabase
        .from("profiles")
        .select("id,full_name,city,role")
        .eq("id", workerId)
        .single();
      setProfile(pr ?? null);

      // 3. categories
      const catIds = wp.category_ids ?? [];
      if (catIds.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id,name_az,icon")
          .in("id", catIds);
        setCategories(cats ?? []);
      }
    } catch (e) {
      console.error(e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  // ── Not Found ───────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontSize: 56 }}>🔍</div>
        <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--navy)", marginTop: 16, textAlign: "center" }}>
          Usta tapılmadı
        </p>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginTop: 8, textAlign: "center" }}>
          Bu profil mövcud deyil və ya silinib.
        </p>
        <button
          onClick={() => router.back()}
          style={{ marginTop: 24, padding: "12px 28px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Geri qayıt
        </button>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 100 }}>
          {/* header skeleton */}
          <div style={{ background: "linear-gradient(135deg,#0D1F3C,#1B3A7A,#1B4FD8)", padding: "20px 20px 28px", borderRadius: "0 0 28px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <Skeleton w={36} h={36} r={12} />
              <Skeleton w={120} h={16} />
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Skeleton w={72} h={72} r={20} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton w="60%" h={20} />
                <Skeleton w="40%" h={14} />
                <Skeleton w="50%" h={14} />
              </div>
            </div>
          </div>
          {/* cards skeleton */}
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton w="100%" h={80} r={16} />
            <Skeleton w="100%" h={120} r={16} />
            <Skeleton w="100%" h={100} r={16} />
          </div>
        </div>
      </>
    );
  }

  const name = profile?.full_name ?? "Usta";
  const initials = getInitials(name);
  const avatarGrad = getAvatarGradient(workerId);
  const rating = worker?.rating ?? 0;
  const reviewCount = worker?.review_count ?? 0;
  const priceMin = worker?.price_min;
  const priceMax = worker?.price_max;
  const districts = worker?.available_districts ?? [];

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .wp-card{background:#fff;border-radius:18px;border:1px solid var(--border);padding:18px;animation:fadeUp 0.35s ease both;}
        .wp-pill{display:inline-flex;align-items:center;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:600;background:var(--primary-bg);color:var(--primary);border:1px solid var(--primary-mid);}
        .wp-stat{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;}
        .wp-stat-val{font-family:var(--font-playfair);font-size:22px;font-weight:800;color:var(--navy);}
        .wp-stat-lbl{font-size:10px;color:var(--text-3);font-weight:500;text-align:center;}
        .wp-cta-btn{width:100%;padding:16px;background:linear-gradient(135deg,#1B4FD8,#2563EB);color:#fff;border:none;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(27,79,216,0.35);letter-spacing:0.01em;transition:opacity 0.2s;}
        .wp-cta-btn:active{opacity:0.88;}
        .wp-back-btn{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.18);border-radius:12px;padding:7px 14px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:20px;}
        .wp-badge-verified{display:inline-flex;align-items:center;gap:4px;background:var(--green-bg);color:#065F46;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;}
        .wp-badge-inactive{display:inline-flex;align-items:center;gap:4px;background:#FEF3C7;color:#92400E;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 110 }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(135deg,#0D1F3C 0%,#1B3A7A 60%,#1B4FD8 100%)",
          padding: "20px 20px 28px",
          borderRadius: "0 0 28px 28px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(27,79,216,0.07) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

          {/* back button */}
          <button className="wp-back-btn" onClick={() => router.back()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Geri
          </button>

          {/* avatar + info */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}>
            <div style={{
              width: 76, height: 76, borderRadius: 22, flexShrink: 0,
              background: avatarGrad,
              border: "2.5px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 800, color: "#fff",
              fontFamily: "var(--font-playfair)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            }}>
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.2 }}>
                {name}
              </p>
              {profile?.city && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: "4px 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {profile.city}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {worker?.verified && worker?.is_active ? (
                  <span className="wp-badge-verified">✓ Təsdiqlənmiş</span>
                ) : (
                  <span className="wp-badge-inactive">⏳ Gözlənilir</span>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {renderStars(rating)}
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                    {rating > 0 ? rating.toFixed(1) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: "16px 16px 0", maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Stat kartları */}
          <div className="wp-card" style={{ animationDelay: "0.05s" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="wp-stat">
                <span className="wp-stat-val">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                <span className="wp-stat-lbl">Reytinq</span>
              </div>
              <div style={{ width: 1, background: "var(--border)" }} />
              <div className="wp-stat">
                <span className="wp-stat-val">{reviewCount}</span>
                <span className="wp-stat-lbl">Rəy</span>
              </div>
              <div style={{ width: 1, background: "var(--border)" }} />
              <div className="wp-stat">
                <span className="wp-stat-val">{experienceLabel(worker?.experience_range ?? null)}</span>
                <span className="wp-stat-lbl">Təcrübə</span>
              </div>
            </div>
          </div>

          {/* Kateqoriya & Qiymət */}
          <div className="wp-card" style={{ animationDelay: "0.1s" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
              Peşə & Xidmət
            </p>
            {categories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {categories.map((c) => (
                  <span key={c.id} className="wp-pill">
                    {c.icon && <span style={{ marginRight: 4 }}>{c.icon}</span>}
                    {c.name_az}
                  </span>
                ))}
              </div>
            )}
            {(priceMin != null || priceMax != null) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary-bg)", borderRadius: 12, padding: "10px 14px", marginTop: categories.length > 0 ? 0 : 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>
                  {priceMin != null && priceMax != null
                    ? `₼${priceMin} – ₼${priceMax}`
                    : priceMin != null
                    ? `₼${priceMin}-dən`
                    : `₼${priceMax}-ə qədər`}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 2 }}>/ saat</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {worker?.bio && (
            <div className="wp-card" style={{ animationDelay: "0.15s" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                Haqqında
              </p>
              <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.65, margin: 0 }}>
                {worker.bio}
              </p>
            </div>
          )}

          {/* Ərazilər */}
          {districts.length > 0 && (
            <div className="wp-card" style={{ animationDelay: "0.2s" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                Xidmət göstərdiyi ərazilər
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {districts.map((d) => (
                  <span key={d} style={{
                    padding: "5px 12px", borderRadius: 999,
                    background: "var(--gray-100)", color: "var(--text-2)",
                    fontSize: 12, fontWeight: 600,
                    border: "1px solid var(--gray-200)",
                  }}>
                    📍 {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews placeholder */}
          <div className="wp-card" style={{ animationDelay: "0.25s" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
              Rəylər
            </p>
            {reviewCount > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--gray-100)", borderRadius: 12 }}>
                {renderStars(rating)}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{rating.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>({reviewCount} rəy)</span>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 28 }}>💬</div>
                <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>Hələ rəy yoxdur</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── STICKY CTA ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        boxShadow: "0 -4px 20px rgba(13,31,60,0.08)",
        zIndex: 40,
        maxWidth: 560,
        margin: "0 auto",
      }}>
        {worker?.verified && worker?.is_active ? (
          <button
            className="wp-cta-btn"
            onClick={() => router.push(`/request/new?worker_id=${workerId}`)}
          >
            Bu ustaya sifariş ver
          </button>
        ) : (
          <button
            className="wp-cta-btn"
            style={{ background: "var(--gray-200)", color: "var(--text-3)", boxShadow: "none", cursor: "not-allowed" }}
            disabled
          >
            Usta hazırda aktiv deyil
          </button>
        )}
      </div>
    </>
  );
}