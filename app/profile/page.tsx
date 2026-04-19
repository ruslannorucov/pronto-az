"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function getInitials(name: string) {
  return name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  role: string;
  email: string;
};

type WorkerStats = {
  rating: number;
  review_count: number;
  experience_years: number;
  price_min: number | null;
  price_max: number | null;
};

type Stats = { total: number; done: number };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workerStats, setWorkerStats] = useState<WorkerStats | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, phone, city, role")
        .eq("id", user.id)
        .single();

      if (!prof) { setLoading(false); return; }

      const p: Profile = { ...prof, email: user.email ?? "" };
      setProfile(p);
      setEditName(p.full_name ?? "");
      setEditPhone(p.phone ?? "");
      setEditCity(p.city ?? "");

      if (p.role === "worker") {
        const { data: wp } = await supabase
          .from("worker_profiles")
          .select("rating, review_count, experience_years, price_min, price_max")
          .eq("user_id", user.id)
          .single();
        if (wp) setWorkerStats(wp);

        const { count: doneCount } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", user.id)
          .eq("status", "accepted");
        setStats({ total: doneCount ?? 0, done: doneCount ?? 0 });
      } else {
        const { count: totalCount } = await supabase
          .from("job_requests")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", user.id);
        const { count: doneCount } = await supabase
          .from("job_requests")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", user.id)
          .eq("status", "done");
        setStats({ total: totalCount ?? 0, done: doneCount ?? 0 });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!profile || saving) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      full_name: editName.trim(),
      phone: editPhone.trim() || null,
      city: editCity.trim() || null,
    }).eq("id", profile.id);
    setProfile(p => p ? {
      ...p,
      full_name: editName.trim(),
      phone: editPhone.trim() || null,
      city: editCity.trim() || null,
    } : p);
    setSaving(false);
    setEditing(false);
    setSaveMsg("Dəyişikliklər saxlanıldı ✓");
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ height: 220, background: "linear-gradient(135deg,#0B1D3A,#0F2D5C)", borderRadius: "0 0 28px 28px", marginLeft: -16, marginRight: -16 }} className="animate-pulse" />
        <div style={{ height: 80, background: "#F1F5FE", borderRadius: 20, marginTop: 16 }} className="animate-pulse" />
        <div style={{ height: 180, background: "#F1F5FE", borderRadius: 20, marginTop: 12 }} className="animate-pulse" />
      </div>
    );
  }

  if (!profile) return null;

  const isWorker = profile.role === "worker";

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .su { animation: slide-up 0.25s ease forwards; }
        .su-1 { animation-delay: 0.04s; opacity: 0; }
        .su-2 { animation-delay: 0.08s; opacity: 0; }
        .su-3 { animation-delay: 0.12s; opacity: 0; }
        .su-4 { animation-delay: 0.16s; opacity: 0; }

        .edit-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1.5px solid #E4EAFB;
          background: #F8FAFF;
          font-size: 14px;
          color: #0D1F3C;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .edit-input:focus {
          border-color: #1B4FD8;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(27,79,216,0.08);
        }
        .quick-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 12px;
          text-decoration: none;
          border-radius: 14px;
          transition: background 0.15s;
        }
        .quick-link:hover { background: #F8FAFF; }
        .quick-link:active { background: #EFF4FF; transform: scale(0.99); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 32 }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "linear-gradient(150deg, #071428 0%, #0D2554 50%, #1a3a82 100%)",
          marginLeft: -16, marginRight: -16,
          padding: "32px 24px 28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          borderRadius: "0 0 28px 28px",
        }}>
          {/* Subtle dot pattern */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Avatar — sadə, dairəvi, mərkəzdə */}
            <div style={{
              width: 64, height: 64,
              borderRadius: "50%",
              background: isWorker
                ? "linear-gradient(135deg, #059669, #10B981)"
                : "linear-gradient(135deg, #1B4FD8, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: "#fff",
              fontFamily: "'Playfair Display', serif",
              margin: "0 auto 14px",
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}>
              {getInitials(profile.full_name)}
            </div>

            {/* Ad */}
            <h1 style={{
              fontSize: 19, fontWeight: 800, color: "#fff",
              fontFamily: "'Playfair Display', serif",
              margin: "0 0 5px", lineHeight: 1.2,
            }}>
              {profile.full_name}
            </h1>

            {/* Email */}
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 12px" }}>
              {profile.email}
            </p>

            {/* Badgelər */}
            <div style={{ display: "flex", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isWorker ? "#34D399" : "#60A5FA",
                background: isWorker ? "rgba(52,211,153,0.12)" : "rgba(96,165,250,0.12)",
                border: `1px solid ${isWorker ? "rgba(52,211,153,0.22)" : "rgba(96,165,250,0.22)"}`,
                padding: "3px 11px", borderRadius: 999,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: isWorker ? "#34D399" : "#60A5FA",
                  display: "inline-block",
                }} />
                {isWorker ? "Usta" : "Müştəri"}
              </span>

              {profile.city && (
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: "3px 11px", borderRadius: 999,
                }}>
                  📍 {profile.city}
                </span>
              )}
            </div>

            {/* Redaktə düyməsi */}
            <button
              onClick={() => { setEditing(e => !e); setSaveMsg(null); }}
              style={{
                marginTop: 16,
                padding: "8px 18px", borderRadius: 12,
                background: editing ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${editing ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.14)"}`,
                color: editing ? "#FCA5A5" : "rgba(255,255,255,0.75)",
                fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {editing ? (
                <><span style={{ fontSize: 10 }}>✕</span> Ləğv et</>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Redaktə et
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>

          {/* Save mesajı */}
          {saveMsg && (
            <div className="su" style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 12,
              background: "#F0FDF4", border: "1px solid #86EFAC",
              fontSize: 12, fontWeight: 600, color: "#15803D",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>✓</span> {saveMsg}
            </div>
          )}

          {/* ── STATİSTİKA ── */}
          <div className="su su-1" style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: isWorker ? "repeat(3,1fr)" : "repeat(2,1fr)",
            gap: 10,
          }}>
            {isWorker && workerStats ? (
              <>
                <StatCard emoji="⭐" value={workerStats.rating > 0 ? workerStats.rating.toFixed(1) : "—"} label="Reytinq" color="#F59E0B" />
                <StatCard emoji="💬" value={String(workerStats.review_count)} label="Rəy" color="#8B5CF6" />
                <StatCard emoji="✅" value={String(stats.done)} label="İş" color="#10B981" />
              </>
            ) : (
              <>
                <StatCard emoji="📋" value={String(stats.total)} label="Sifariş" color="#1B4FD8" />
                <StatCard emoji="✅" value={String(stats.done)} label="Tamamlanan" color="#10B981" />
              </>
            )}
          </div>

          {/* ── MƏLUMATLAR ── */}
          <div className="su su-2" style={{
            marginTop: 14, background: "#fff",
            border: "1px solid #E4EAFB", borderRadius: 20, overflow: "hidden",
          }}>
            <SectionHeader emoji="👤" title="Şəxsi məlumatlar" />

            {editing ? (
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <EditField label="Ad Soyad" value={editName} onChange={setEditName} placeholder="Adınızı daxil edin" />
                  <EditField label="Telefon" value={editPhone} onChange={setEditPhone} placeholder="+994 50 000 00 00" type="tel" />
                  <EditField label="Şəhər" value={editCity} onChange={setEditCity} placeholder="Bakı" />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  style={{
                    marginTop: 14, width: "100%",
                    padding: "13px", borderRadius: 13,
                    background: saving || !editName.trim()
                      ? "#E4EAFB"
                      : "linear-gradient(135deg,#1B4FD8,#2563EB)",
                    color: saving || !editName.trim() ? "#94A3C0" : "#fff",
                    fontSize: 13, fontWeight: 700,
                    border: "none", cursor: saving || !editName.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: saving || !editName.trim() ? "none" : "0 4px 12px rgba(27,79,216,0.28)",
                  }}
                >
                  {saving ? "Saxlanılır..." : "Saxla"}
                </button>
              </div>
            ) : (
              <>
                <InfoRow emoji="✉️" label="E-poçt" value={profile.email} />
                <InfoRow emoji="📞" label="Telefon" value={profile.phone ?? "—"} />
                <InfoRow emoji="📍" label="Şəhər" value={profile.city ?? "—"} last />
              </>
            )}
          </div>

          {/* ── WORKER — Peşə məlumatları ── */}
          {isWorker && workerStats && (
            <div className="su su-3" style={{
              marginTop: 12, background: "#fff",
              border: "1px solid #E4EAFB", borderRadius: 20, overflow: "hidden",
            }}>
              <SectionHeader emoji="🔧" title="Peşə məlumatları" />
              <InfoRow emoji="🎓" label="Təcrübə" value={`${workerStats.experience_years} il`} />
              <InfoRow
                emoji="💰" label="Qiymət aralığı"
                value={workerStats.price_min && workerStats.price_max
                  ? `${workerStats.price_min}–${workerStats.price_max} ₼`
                  : "—"}
                last
              />
            </div>
          )}

          {/* ── TEZ KEÇİDLƏR ── */}
          <div className="su su-3" style={{
            marginTop: 12, background: "#fff",
            border: "1px solid #E4EAFB", borderRadius: 20, overflow: "hidden",
          }}>
            <SectionHeader emoji="⚡" title="Tez keçidlər" />
            <div style={{ padding: "8px" }}>
              {isWorker ? (
                <>
                  <QuickLink href="/worker/panel" emoji="🔧" label="İş paneli" sublabel="Aktiv işlər və təkliflər" color="#10B981" />
                  <QuickLink href="/chats" emoji="💬" label="Mesajlar" sublabel="Müştərilərlə söhbətlər" color="#1B4FD8" />
                </>
              ) : (
                <>
                  <QuickLink href="/dashboard?tab=orders" emoji="📋" label="Sifarişlərim" sublabel="Aktiv sifarişlərə bax" color="#7C3AED" />
                  <QuickLink href="/chats" emoji="💬" label="Mesajlar" sublabel="Ustalarla söhbətlər" color="#1B4FD8" />
                  <QuickLink href="/request/new" emoji="➕" label="Yeni sifariş" sublabel="Usta tap, iş ver" color="#059669" />
                </>
              )}
            </div>
          </div>

          {/* ── ÇIXIŞ ── */}
          <div className="su su-4">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                marginTop: 12, width: "100%",
                padding: "14px 20px", borderRadius: 16,
                background: "#FEF2F2", border: "1px solid #FECACA",
                color: "#EF4444", fontSize: 14, fontWeight: 700,
                cursor: signingOut ? "not-allowed" : "pointer",
                fontFamily: "inherit", opacity: signingOut ? 0.6 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                transition: "opacity 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {signingOut ? "Çıxılır..." : "Hesabdan çıx"}
            </button>
          </div>

          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  );
}

// ── Kiçik komponentlər ────────────────────────────────────────────────────────

function SectionHeader({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div style={{
      padding: "12px 16px", borderBottom: "1px solid #F1F5FE",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 13 }}>{emoji}</span>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#0D1F3C", margin: 0 }}>{title}</p>
    </div>
  );
}

function StatCard({ emoji, value, label, color }: {
  emoji: string; value: string; label: string; color: string;
}) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #E4EAFB",
      borderRadius: 16, padding: "14px 10px",
      textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
      boxShadow: "0 1px 6px rgba(13,31,60,0.04)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12,
        background: `${color}12`, border: `1px solid ${color}22`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>
        {emoji}
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Playfair Display', serif", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#94A3C0", margin: 0 }}>
        {label}
      </p>
    </div>
  );
}

function InfoRow({ emoji, label, value, last }: {
  emoji: string; label: string; value: string; last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px",
      borderBottom: last ? "none" : "1px solid #F8FAFF",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 11,
        background: "#F8FAFF", border: "1px solid #E4EAFB",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, color: "#94A3C0", margin: 0, fontWeight: 500 }}>{label}</p>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "#0D1F3C",
          margin: "2px 0 0", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3C0", marginBottom: 6, marginTop: 0 }}>
        {label}
      </p>
      <input
        className="edit-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function QuickLink({ href, emoji, label, sublabel, color }: {
  href: string; emoji: string; label: string; sublabel: string; color: string;
}) {
  return (
    <Link href={href} className="quick-link">
      <div style={{
        width: 40, height: 40, borderRadius: 13, flexShrink: 0,
        background: `${color}10`, border: `1px solid ${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0D1F3C", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: "#94A3C0", margin: "2px 0 0" }}>{sublabel}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="#C8D5E8" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </Link>
  );
}