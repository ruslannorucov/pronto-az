"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

// ─── Status steps ──────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: "submitted", label: "Qeydiyyat göndərildi",  icon: "✓", state: "done"    },
  { key: "review",    label: "Admin yoxlaması",        icon: "⏳", state: "active"  },
  { key: "approved",  label: "Hesab aktivləşdirildi",  icon: "🎉", state: "pending" },
];

// ─── Inner component (uses useSearchParams) ────────────────────────────────────

function PendingContent() {
  const params = useSearchParams();

  const name       = params.get("name")       ?? "";
  const phone      = params.get("phone")      ?? "";
  const category   = params.get("category")   ?? "";
  const catIcon    = params.get("catIcon")    ?? "";
  const experience = params.get("experience") ?? "";
  const priceMin   = params.get("priceMin")   ?? "";
  const priceMax   = params.get("priceMax")   ?? "";
  const districts  = params.get("districts")  ?? "";

  function formatPrice() {
    if (priceMin && priceMax) return `${priceMin}–${priceMax} ₼/saat`;
    if (priceMin)             return `${priceMin} ₼/saatdan`;
    if (priceMax)             return `Maks ${priceMax} ₼/saat`;
    return "Göstərilmədi";
  }

  const detailRows = [
    { label: "Telefon",    value: phone      ? `+994 ${phone}`              : "—" },
    { label: "Kateqoriya", value: category   ? `${catIcon} ${category}`     : "—" },
    { label: "Təcrübə",    value: experience ? experience                   : "—" },
    { label: "Qiymət",     value: formatPrice()                                   },
    { label: "Ərazilər",   value: districts  ? districts.replace(/,/g, ", ") : "—" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px",
      background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
      position: "relative", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
      }} />

      <div style={{
        position: "relative", width: "100%", maxWidth: 440,
        background: "#fff", borderRadius: 24, padding: "36px 32px 32px",
        boxShadow: "0 24px 64px rgba(13,31,60,0.35)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#0D1F3C", letterSpacing: "-0.3px" }}>
          Pronto<span style={{ color: "#1B4FD8" }}>.</span>az
        </div>

        {/* Success icon */}
        <div style={{ textAlign: "center", margin: "24px 0 4px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
            border: "2px solid #6EE7B7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto",
          }}>🎉</div>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#0D1F3C", textAlign: "center", margin: "14px 0 6px" }}>
          Qeydiyyat tamamlandı!
        </h1>
        <p style={{ fontSize: 13, color: "#94A3C0", textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
          Məlumatlarınız admin tərəfindən növbəti{" "}
          <strong style={{ color: "#0D1F3C" }}>24–48 saat</strong> ərzində yoxlanılacaq.
          Təsdiq sonrası WhatsApp və email bildirişi alacaqsınız.
        </p>

        {/* Status steps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3C0", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" as const }}>
            Qeydiyyat statusu
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {STATUS_STEPS.map((s, i) => (
              <div key={s.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    background:
                      s.state === "done"   ? "linear-gradient(135deg, #1B4FD8, #2563EB)" :
                      s.state === "active" ? "#FEF3C7" : "#F1F5FE",
                    border: s.state === "active" ? "1.5px solid #FCD34D" : "none",
                    color:
                      s.state === "done"   ? "#fff" :
                      s.state === "active" ? "#92400E" : "#94A3C0",
                  }}>{s.icon}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: s.state === "done" ? "#0D1F3C" : s.state === "active" ? "#92400E" : "#94A3C0",
                    }}>{s.label}</div>
                    {s.state === "active" && (
                      <div style={{ fontSize: 11, color: "#94A3C0", marginTop: 1 }}>Orta müddət: 24–48 saat</div>
                    )}
                  </div>

                  {s.state === "done" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#10B981", background: "#D1FAE5", padding: "2px 8px", borderRadius: 999 }}>Tamamlandı</span>
                  )}
                  {s.state === "active" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "2px 8px", borderRadius: 999 }}>Gözlənilir</span>
                  )}
                </div>

                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ width: 2, height: 18, background: s.state === "done" ? "#1B4FD8" : "#E4EAFB", margin: "4px 0 4px 17px" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Profile summary */}
        <div style={{ background: "#F8FAFF", border: "1.5px solid #E4EAFB", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3C0", letterSpacing: "0.08em", marginBottom: 14, textTransform: "uppercase" as const }}>
            Qeydiyyat xülasəsi
          </div>

          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0,
              fontFamily: "'Playfair Display', serif",
            }}>
              {name.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1F3C", fontFamily: "'Playfair Display', serif" }}>
                {name || "—"}
              </div>
              <div style={{ fontSize: 12, color: "#94A3C0", marginTop: 2 }}>
                {category ? `${catIcon} ${category}` : "—"}
              </div>
            </div>
          </div>

          {/* Detail rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {detailRows.map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#94A3C0", flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0D1F3C", textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info box */}
        <div style={{ background: "#EFF4FF", border: "1px solid #BFCFFE", borderRadius: 12, padding: "12px 14px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💬</span>
          <div style={{ fontSize: 12, color: "#1E3A5F", lineHeight: 1.6 }}>
            Sualınız varsa <strong>+994 50 000 00 00</strong> nömrəsinə WhatsApp üzərindən yazın.
          </div>
        </div>

        {/* CTA */}
        <Link href="/" style={{
          display: "block", width: "100%", padding: 14, borderRadius: 14,
          background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
          color: "#fff", fontSize: 14, fontWeight: 600,
          textAlign: "center", textDecoration: "none",
          boxShadow: "0 4px 16px rgba(27,79,216,0.28)",
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: "border-box" as const,
        }}>
          Ana səhifəyə qayıt
        </Link>

      </div>
    </div>
  );
}

// ─── Page export (Suspense required for useSearchParams) ───────────────────────

export default function WorkerPendingPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0D1F3C 0%, #162F6A 55%, #1E1B6E 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Yüklənir...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
