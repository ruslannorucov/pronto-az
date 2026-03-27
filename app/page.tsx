import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";

const heroChips = [
  "🚿 Santexnik",
  "⚡ Elektrik",
  "🧹 Təmizlik",
  "🎨 Boyaqçı",
  "📦 Daşınma",
  "❄️ Kondisioner",
];

const heroStats = [
  { value: "2,400+", label: "Usta" },
  { value: "18,500+", label: "Sifariş" },
  { value: "4.8 ⭐", label: "Reytinq" },
  { value: "45 dəq", label: "Orta cavab" },
];

const bannerGradients = [
  "from-[#1B4FD8] to-[#2563EB]",
  "from-[#B45309] to-[#D97706]",
  "from-[#0A7A4F] to-[#10B981]",
  "from-[#6D28D9] to-[#7C3AED]",
  "from-[#C2410C] to-[#EA580C]",
  "from-[#0369A1] to-[#0EA5E9]",
];

export default async function Home() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select(`id, name_az, icon, worker_profiles (count)`)
    .is("parent_id", null)
    .order("name_az");

  const { data: workers } = await supabase
    .from("worker_profiles")
    .select(`
      id,
      rating,
      review_count,
      verified,
      user_id,
      profiles ( id, full_name, avatar_url ),
      categories ( name_az, icon )
    `)
    .eq("is_active", true)
    .eq("verified", true)
    .order("rating", { ascending: false })
    .limit(3);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D1F3C] via-[#162F6A] to-[#1E1B6E] px-4 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20 xl:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(27,79,216,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.07) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)",
            }}
          />
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(ellipse_60%_80%_at_70%_50%,rgba(27,79,216,0.25),transparent_70%)]" />
          <div className="absolute -bottom-20 left-1/4 h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(30,27,110,0.4),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl flex flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[rgba(147,180,255,0.25)] bg-[rgba(27,79,216,0.18)] px-3.5 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#93B4FF]">
              ⚡ Bakıda №1 Ev Xidmətləri Platforması
            </span>
          </div>

          <h1 className="font-serif mx-auto max-w-[620px] text-[34px] sm:text-[44px] lg:text-[52px] font-extrabold leading-[1.15] text-white mb-4">
            Evdə problem?{" "}
            <br />
            <em className="not-italic bg-gradient-to-r from-[#93B4FF] to-[#60A5FA] bg-clip-text text-transparent">
              Pronto
            </em>{" "}
            həll edir.
          </h1>

          <p className="mx-auto max-w-[480px] text-[15px] sm:text-[17px] leading-relaxed text-white/65 mb-8 sm:mb-10">
            Peşəkar ustalar sizə 3 rəqabətli təklif gətirsin. Qiymət
            müqayisə edin, ən yaxşısını seçin.
          </p>

          <div className="flex mx-auto max-w-[660px] w-full items-center rounded-[24px] bg-white p-1.5 shadow-[0_16px_48px_rgba(13,31,60,0.22)]">
            <div className="flex items-center gap-2 border-r-[1.5px] border-[var(--border)] px-3 sm:px-5 py-2 shrink-0">
              <span className="text-lg">📍</span>
              <div>
                <select className="bg-transparent text-sm font-semibold text-[var(--navy)] outline-none cursor-pointer appearance-none w-full">
                  <option>Bakı</option>
                  <option>Sumqayıt</option>
                  <option>Gəncə</option>
                </select>
                <p className="text-[11px] text-[var(--text-3)]">Şəhər</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Santexnik, elektrik, təmizlik..."
              className="flex-1 min-w-0 bg-transparent px-3 sm:px-5 text-[13px] sm:text-[15px] text-[var(--navy)] placeholder:text-[var(--text-3)] outline-none"
            />
            <button className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-[14px] sm:rounded-[16px] bg-[var(--primary)] text-white text-xl transition-colors hover:bg-[var(--primary-light)]">
              🔍
            </button>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 justify-center">
            {heroChips.map((chip) => (
              <button
                key={chip}
                className="rounded-full border border-white/15 bg-white/10 px-3 sm:px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-white/80 transition-colors hover:bg-white/18 hover:text-white"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 flex flex-wrap justify-center border-t border-white/8 pt-7 sm:pt-9 w-full max-w-2xl">
            {heroStats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex-1 text-center min-w-[70px] px-2 sm:px-6 lg:px-8 ${
                  i < heroStats.length - 1 ? "border-r border-white/8" : ""
                }`}
              >
                <p className="font-serif text-[20px] sm:text-[26px] lg:text-[30px] font-bold text-white leading-none mb-1 sm:mb-1.5">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-[12px] font-medium text-white/45">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KATEQORİYALAR ── */}
      {categories && categories.length > 0 && (
        <section className="bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-7 sm:mb-9">
              <div>
                <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest mb-2">
                  XİDMƏTLƏR
                </p>
                <h2 className="font-serif text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[var(--navy)]">
                  Xidmət Kateqoriyaları
                </h2>
                <p className="text-sm text-[var(--text-3)] mt-1">
                  Hər növ problemə həll
                </p>
              </div>
              <a
                href="/categories"
                className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1 transition-all hover:gap-2 shrink-0 ml-4"
              >
                Hamısını gör →
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat, index) => {
                const workerCount =
                  (cat.worker_profiles as unknown as { count: number }[])?.[0]
                    ?.count ?? 0;
                const isFeatured = index === 0;

                return isFeatured ? (
                  <div
                    key={cat.id}
                    className={`col-span-2 flex items-center gap-4 sm:gap-5 bg-gradient-to-br ${bannerGradients[0]} rounded-2xl p-5 sm:p-7 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(27,79,216,0.35)]`}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 flex items-center justify-center text-[32px] sm:text-[40px] shrink-0">
                      {cat.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[15px] sm:text-[17px] mb-1">
                        {cat.name_az}
                      </p>
                      <p className="text-white/65 text-[12px] sm:text-[13px]">
                        {workerCount > 0
                          ? `${workerCount} usta hazır`
                          : "Ustalar gəlir"}
                      </p>
                      <span className="mt-2 inline-block text-xs font-bold text-white/90 bg-white/15 px-2.5 py-1 rounded-full">
                        🔥 Populyar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    key={cat.id}
                    className="relative bg-[var(--gray-50)] rounded-2xl px-4 py-5 sm:py-6 text-center border-[1.5px] border-[var(--gray-200)] cursor-pointer transition-all duration-250 hover:border-[var(--primary)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(27,79,216,0.13)] hover:bg-white group"
                  >
                    <span className="text-[24px] sm:text-[28px] mb-2 sm:mb-2.5 block">
                      {cat.icon}
                    </span>
                    <p className="text-[12px] sm:text-[13px] font-semibold text-[var(--navy)] group-hover:text-[var(--primary)] transition-colors mb-1">
                      {cat.name_az}
                    </p>
                    <p className="text-[11px] sm:text-[12px] text-[var(--gray-400)]">
                      {workerCount > 0 ? `${workerCount} usta` : "Tezliklə"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── NECƏ İŞLƏYİR ── */}
      <section
        id="how-it-works"
        className="relative overflow-hidden bg-gradient-to-br from-[#0D1F3C] to-[#162F6A] px-4 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-20"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(27,79,216,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(27,79,216,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#93B4FF] mb-3">
              PROSES
            </p>
            <h2 className="font-serif text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-white mb-2">
              Necə işləyir?
            </h2>
            <p className="text-[14px] sm:text-[15px] text-white/50">
              4 addımda probleminizi həll edin
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                num: "01",
                icon: "📝",
                title: "Sifariş yarat",
                desc: "Probleminizi təsvir edin, şəkil əlavə edin, ünvan və vaxt seçin",
              },
              {
                num: "02",
                icon: "🔔",
                title: "Ustalar görür",
                desc: "Uyğun ustalar bildiriş alır və sifarişinizə qiymət təklifi verir",
              },
              {
                num: "03",
                icon: "⚖️",
                title: "3 təklifi müqayisə et",
                desc: "Qiymət, reytinq və rəylər əsasında ən uyğun ustanı seçirsiniz",
              },
              {
                num: "04",
                icon: "✅",
                title: "İş tamamlanır",
                desc: "Usta gəlir, işi edir. Siz ödəyirsiniz və rəy yazırsınız",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="relative bg-white/5 border border-white/8 rounded-2xl p-6 sm:p-7 hover:bg-white/8 transition-all duration-300"
              >
                {i < 3 && (
                  <div className="hidden lg:block absolute top-10 -right-3 w-6 h-[1.5px] bg-white/10 z-10" />
                )}
                <p className="font-serif text-[44px] sm:text-[52px] font-bold leading-none text-[rgba(27,79,216,0.3)] mb-4">
                  {step.num}
                </p>
                <span className="text-[26px] sm:text-[28px] mb-3 block">
                  {step.icon}
                </span>
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-[12px] sm:text-[13px] text-white/50 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 text-center">
            <a
              href="/request/new"
              className="inline-flex items-center gap-2 bg-[var(--primary)] text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-[var(--primary-light)] transition-colors"
            >
              İndi sifariş ver →
            </a>
          </div>
        </div>
      </section>

      {/* ── USTALAR ── */}
      {workers && workers.length > 0 && (
        <section className="bg-[var(--gray-50)] py-12 sm:py-16 lg:py-20 px-4 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-7 sm:mb-9">
              <div>
                <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest mb-2">
                  USTALAR
                </p>
                <h2 className="font-serif text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-[var(--navy)]">
                  Ən Yaxşı Ustalar
                </h2>
                <p className="text-sm text-[var(--text-3)] mt-1">
                  Təsdiqlənmiş, reytinqli peşəkarlar
                </p>
              </div>
              <a
                href="/workers"
                className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1 transition-all hover:gap-2 shrink-0 ml-4"
              >
                Hamısını gör →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {workers.map((worker, index) => {
                const profile = worker.profiles as {
                  id: string;
                  full_name: string;
                  avatar_url: string | null;
                } | null;
                const category = worker.categories as {
                  name_az: string;
                  icon: string;
                } | null;
                const gradient = bannerGradients[index % bannerGradients.length];

                return (
                  <div
                    key={worker.id}
                    className="bg-white rounded-2xl border-[1.5px] border-[var(--border)] overflow-hidden hover:shadow-[0_8px_32px_rgba(13,31,60,0.12)] hover:-translate-y-1 transition-all duration-250 cursor-pointer"
                  >
                    <div className={`relative h-[80px] bg-gradient-to-br ${gradient}`}>
                      {worker.verified && (
                        <span className="absolute top-2 right-2 bg-[var(--green)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓ Təsdiqlənmiş
                        </span>
                      )}
                      <div className="absolute -bottom-[30px] left-5 w-[60px] h-[60px] rounded-full border-[3px] border-white bg-gradient-to-br from-[#60A5FA] to-[#1B4FD8] flex items-center justify-center text-2xl shadow-md overflow-hidden">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name ?? ""}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{category?.icon ?? "👷"}</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-10 px-5 pb-5">
                      <h3 className="font-serif text-[16px] font-semibold text-[var(--navy)] mb-0.5">
                        {profile?.full_name ?? "Usta"}
                      </h3>
                      <p className="text-[13px] text-[var(--text-3)] mb-3">
                        {category?.name_az ?? ""}
                      </p>
                      <div className="flex items-center gap-1.5 mb-4">
                        <span className="text-[13px]">⭐</span>
                        <span className="text-[13px] font-semibold text-[var(--navy)]">
                          {worker.rating ?? "—"}
                        </span>
                        <span className="text-[12px] text-[var(--text-3)]">
                          · {worker.review_count ?? 0} rəy
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`/workers/${worker.user_id}`}
                          className="flex-1 text-center text-[13px] font-semibold py-2 rounded-full border-[1.5px] border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-bg)] transition-colors"
                        >
                          Profil
                        </a>
                        <a
                          href="/request/new"
                          className="flex-1 text-center text-[13px] font-semibold py-2 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] transition-colors"
                        >
                          Sifariş ver
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
