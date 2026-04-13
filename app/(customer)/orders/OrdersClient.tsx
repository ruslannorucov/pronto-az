"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name_az: string;
  icon: string;
};

type ActiveOrderBanner = {
  id: string;
  categoryName: string;
  categoryIcon: string;
  offerCount: number;
  status: string;
};

const HOW_IT_WORKS = [
  { step: "1", icon: "📋", title: "Sifariş yarat", desc: "Kateqoriya seç, problemi təsvir et, ünvan əlavə et" },
  { step: "2", icon: "📨", title: "Təkliflər gəlir", desc: "Yaxınlıqdakı ustalar 15–45 dəq ərzində təklif göndərir" },
  { step: "3", icon: "✅", title: "Ustanı seç", desc: "Qiymət, reytinq və rəylərə görə ən yaxşısını seç" },
];

export default function DashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeBanner, setActiveBanner] = useState<ActiveOrderBanner | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role, is_verified")
        .eq("id", user.id)
        .single();

      if (prof?.role === "admin") { router.push("/admin"); return; }
      setProfile(prof);

      // Kateqoriyalar
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name_az, icon")
        .is("parent_id", null)
        .order("name_az");
      setCategories(cats ?? []);

      // Aktiv sifariş banner — yalnız ən vacib birini göstər
      const { data: activeOrders } = await supabase
        .from("job_requests")
        .select("id, status, category_id")
        .eq("customer_id", user.id)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (activeOrders && activeOrders.length > 0) {
        const catIds = [...new Set(activeOrders.map((o: any) => o.category_id).filter(Boolean))];
        const { data: catsData } = catIds.length > 0
          ? await supabase.from("categories").select("id, name_az, icon").in("id", catIds)
          : { data: [] };
        const catMap: Record<string, any> = {};
        (catsData ?? []).forEach((c: any) => { catMap[c.id] = c; });

        // İn-progress birincil, sonra offer-li, sonra open
        const inProgress = activeOrders.find((o: any) => o.status === "in_progress");
        const mostImportant = inProgress ?? activeOrders[0];

        const { count: offerCount } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("job_id", mostImportant.id)
          .eq("status", "pending");

        const cat = catMap[mostImportant.category_id];
        setActiveBanner({
          id: mostImportant.id,
          categoryName: cat?.name_az ?? "Sifariş",
          categoryIcon: cat?.icon ?? "🔧",
          offerCount: offerCount ?? 0,
          status: mostImportant.status,
        });
      }

      setLoading(false);
    };
    load();
  }, []);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Salam";

  const today = new Date().toLocaleDateString("az-AZ", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-24 bg-[var(--gray-100)] rounded-2xl animate-pulse" />
        <div className="h-36 bg-[var(--gray-100)] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-[var(--gray-100)] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse-out {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .cat-card { transition: all 0.18s ease; }
        .cat-card:active { transform: scale(0.94); }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 sm:px-5 pb-8">

        {/* ── Salam banner ── */}
        <div
          className="rounded-2xl px-5 py-5 mb-4 mt-4"
          style={{ background: "linear-gradient(135deg, #0D1F3C 0%, #1B4FD8 100%)" }}
        >
          <p className="text-[11px] text-white/50 mb-1">{today}</p>
          <h1 className="font-serif text-[22px] font-bold text-white mb-3">
            Salam, {firstName}! 👋
          </h1>
          <Link
            href="/request/new"
            className="inline-flex items-center gap-2 bg-white text-[var(--primary)] text-[13px] font-bold px-5 py-2.5 rounded-xl hover:bg-[var(--primary-bg)] transition-colors"
          >
            + Yeni Sifariş ver
          </Link>
        </div>

        {/* ── Aktiv sifariş banner (varsa) ── */}
        {activeBanner && (
          <Link
            href={activeBanner.offerCount > 0 ? `/request/${activeBanner.id}` : "/orders"}
            className="block mb-4"
          >
            <div
              className="rounded-2xl px-4 py-3.5 flex items-center justify-between"
              style={{
                background: activeBanner.status === "in_progress"
                  ? "linear-gradient(135deg, #D1FAE5, #A7F3D0)"
                  : activeBanner.offerCount > 0
                  ? "linear-gradient(135deg, #EFF4FF, #DBEAFE)"
                  : "#F8FAFF",
                border: activeBanner.status === "in_progress"
                  ? "1px solid #6EE7B7"
                  : activeBanner.offerCount > 0
                  ? "1px solid #BFCFFE"
                  : "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {activeBanner.status === "in_progress" && (
                    <div className="absolute inset-0 rounded-full border border-[rgba(16,185,129,0.4)]"
                      style={{ animation: "pulse-out 2s ease-out infinite" }} />
                  )}
                  <span className="text-lg">{activeBanner.categoryIcon}</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[var(--navy)]">
                    {activeBanner.status === "in_progress"
                      ? `${activeBanner.categoryName} · Usta yolda`
                      : activeBanner.offerCount > 0
                      ? `${activeBanner.offerCount} yeni təklif gəldi!`
                      : `${activeBanner.categoryName} · Usta axtarılır`}
                  </p>
                  <p className="text-[10px] text-[var(--gray-400)] mt-0.5">
                    {activeBanner.status === "in_progress"
                      ? "Sifarişi izlə →"
                      : activeBanner.offerCount > 0
                      ? "Müqayisə et və seç →"
                      : "Adətən 15–45 dəq ərzində cavab gəlir"}
                  </p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="#94A3C0" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </Link>
        )}

        {/* ── Kateqoriyalar ── */}
        <div className="mb-5">
          <p className="text-[13px] font-bold text-[var(--navy)] mb-3">Hansı xidmət lazımdır?</p>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat, i) => {
              const gradients = [
                "from-[#1B4FD8] to-[#2563EB]",
                "from-[#B45309] to-[#D97706]",
                "from-[#0A7A4F] to-[#10B981]",
                "from-[#6D28D9] to-[#7C3AED]",
                "from-[#C2410C] to-[#EA580C]",
                "from-[#0369A1] to-[#0EA5E9]",
              ];
              return (
                <Link
                  key={cat.id}
                  href={`/request/new?category=${cat.id}`}
                  className={`cat-card bg-gradient-to-br ${gradients[i % gradients.length]} rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 min-h-[80px]`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[11px] font-bold text-white text-center leading-tight">{cat.name_az}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Worker banner (dual-role) ── */}
        {profile?.role === "worker" && (
          <div className="bg-[var(--primary-bg)] border border-[var(--primary-mid)] rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
            <span>🔧</span>
            <p className="text-[12px] text-[var(--navy)] flex-1">Usta panelinizə keçmək istəyirsiniz?</p>
            <a href="/worker/panel" className="bg-[var(--primary)] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 hover:bg-[var(--primary-light)] transition-colors">
              İş paneli →
            </a>
          </div>
        )}

        {/* ── Necə işləyir ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, #0D1F3C, #162F6A)" }}
        >
          <p className="text-[13px] font-bold text-white mb-4">Necə işləyir?</p>
          <div className="space-y-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-base">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">{item.title}</p>
                  <p className="text-[11px] text-white/55 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}