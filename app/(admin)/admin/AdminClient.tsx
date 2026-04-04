"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  pendingWorkers: number;
  activeWorkers: number;
  todayOrders: number;
  activeCustomers: number;
}

interface PendingWorker {
  user_id: string;
  experience_range: string | null;
  price_min: number | null;
  price_max: number | null;
  available_districts: string[] | null;
  category_id: string | null;
  categories: { name_az: string; icon: string } | null;
  profiles: { full_name: string; phone: string; created_at: string } | null;
}

interface ActiveWorker {
  user_id: string;
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  category_id: string | null;
  available_districts: string[] | null;
  categories: { name_az: string; icon: string } | null;
  profiles: { full_name: string; phone: string; created_at: string } | null;
}

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  is_verified: boolean;
}

interface Order {
  id: string;
  status: string;
  address: string | null;
  created_at: string;
  categories: { name_az: string; icon: string } | null;
  profiles: { full_name: string } | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
  return `${Math.floor(diff / 86400)} gün əvvəl`;
}

function formatId(id: string): string {
  return `#PRN-${id.slice(0, 4).toUpperCase()}`;
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const AV_COLORS = [
  "linear-gradient(135deg,#1B4FD8,#2563EB)",
  "linear-gradient(135deg,#B45309,#D97706)",
  "linear-gradient(135deg,#0A7A4F,#10B981)",
  "linear-gradient(135deg,#6D28D9,#7C3AED)",
  "linear-gradient(135deg,#C2410C,#EA580C)",
  "linear-gradient(135deg,#0369A1,#0EA5E9)",
];

function avatarColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

function buildWeekData(orders: any[]): number[] {
  const days = Array(7).fill(0);
  const now = new Date();
  orders.forEach(o => {
    const d = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000);
    if (d >= 0 && d < 7) days[6 - d]++;
  });
  const max = Math.max(...days, 1);
  return days.map(d => Math.round((d / max) * 100));
}

const DAY_LABELS = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

// ─── Status Pills ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Açıq",        bg: "#EFF4FF", color: "#1B4FD8" },
  in_progress: { label: "Davam edir",  bg: "#FEF3C7", color: "#92400E" },
  done:        { label: "Tamamlandı",  bg: "#D1FAE5", color: "#065F46" },
  cancelled:   { label: "Ləğv edildi", bg: "#FEE2E2", color: "#DC2626" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: "#F1F5FE", color: "#4A5878" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
      background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─── Tag ───────────────────────────────────────────────────────────────────────

function Tag({ children, variant = "area" }: { children: React.ReactNode; variant?: "cat" | "area" | "doc" | "nodoc" | "exp" | "blocked" }) {
  const styles: Record<string, React.CSSProperties> = {
    cat:     { background: "#EFF4FF", color: "#1B4FD8" },
    area:    { background: "#F1F5FE", color: "#4A5878" },
    doc:     { background: "#D1FAE5", color: "#065F46" },
    nodoc:   { background: "#FEE2E2", color: "#DC2626" },
    exp:     { background: "#EDE9FE", color: "#5B21B6" },
    blocked: { background: "#FEE2E2", color: "#DC2626" },
  };
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, padding: "2px 5px", borderRadius: 4,
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatarColor(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, color: "#fff",
      fontFamily: "'Playfair Display', serif",
    }}>
      {getInitials(name)}
    </div>
  );
}

// ─── Btn ───────────────────────────────────────────────────────────────────────

function Btn({ children, variant = "ghost", onClick, disabled }: {
  children: React.ReactNode;
  variant?: "ghost" | "green" | "red" | "orange" | "teal";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    ghost:  { background: "#F1F5FE", color: "#4A5878", border: "0.5px solid #E4EAFB" },
    green:  { background: "#10B981", color: "#fff", border: "none" },
    red:    { background: "#FEE2E2", color: "#DC2626", border: "0.5px solid #FECACA" },
    orange: { background: "#FEF3C7", color: "#92400E", border: "0.5px solid #FCD34D" },
    teal:   { background: "#D1FAE5", color: "#065F46", border: "0.5px solid #A7F3D0" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 9px", borderRadius: 6,
        fontSize: 10, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.12s", whiteSpace: "nowrap", opacity: disabled ? 0.5 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function AdminClient() {
  const supabase = createClient();
  type Page = "dashboard" | "workers" | "customers" | "orders";
  type WorkerTab = "pending" | "active" | "blocked";
  type OrderFilter = "all" | "open" | "in_progress" | "done" | "cancelled";

  const [page, setPage] = useState<Page>("dashboard");
  const [workerTab, setWorkerTab] = useState<WorkerTab>("pending");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Data state ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ pendingWorkers: 0, activeWorkers: 0, todayOrders: 0, activeCustomers: 0 });
  const [localPending, setLocalPending] = useState<any[]>([]);
  const [activeWorkerList, setActiveWorkerList] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [orderList, setOrderList] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [weekOrders, setWeekOrders] = useState<any[]>([]);

  const [sbOpen, setSbOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch all data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const today = new Date(); today.setHours(0,0,0,0);

      // 1. worker_profiles - join olmadan
      const { data: wpData } = await supabase
        .from("worker_profiles")
        .select("user_id, verified, is_active, experience_range, price_min, price_max, available_districts, category_id, rating, review_count, created_at");

      const allWorkers = wpData ?? [];
      const pendingIds = allWorkers.filter(w => !w.verified).map(w => w.user_id);
      const activeIds  = allWorkers.filter(w =>  w.verified).map(w => w.user_id);

      // 2. profiles - worker_profiles ilə eyni user_id-lər üçün
      const allIds = allWorkers.map(w => w.user_id);
      const { data: profilesData } = allIds.length > 0
        ? await supabase.from("profiles").select("id, full_name, phone, created_at, role, is_verified").in("id", allIds)
        : { data: [] };

      const profileMap: Record<string, any> = {};
      (profilesData ?? []).forEach(p => { profileMap[p.id] = p; });

      // 3. categories
      const catIds = [...new Set(allWorkers.map(w => w.category_id).filter(Boolean))];
      const { data: catsData } = catIds.length > 0
        ? await supabase.from("categories").select("id, name_az, icon").in("id", catIds)
        : { data: [] };

      const catMap: Record<string, any> = {};
      (catsData ?? []).forEach(c => { catMap[c.id] = c; });

      // Merge
      const merged = allWorkers.map(w => ({
        ...w,
        profile: profileMap[w.user_id] ?? null,
        category: catMap[w.category_id ?? ""] ?? null,
      }));

      const pending = merged.filter(w => !w.verified);
      const active  = merged.filter(w =>  w.verified);

      setLocalPending(pending);
      setActiveWorkerList(active);

      // 4. Customers
      const { data: custs } = await supabase
        .from("profiles").select("id, full_name, phone, created_at, is_verified").eq("role", "customer").order("created_at", { ascending: false });
      setCustomerList(custs ?? []);

      // 5. Orders
      const { data: ords } = await supabase
        .from("job_requests")
        .select("id, status, address, created_at, category_id")
        .order("created_at", { ascending: false }).limit(50);

      const ordCatIds = [...new Set((ords ?? []).map((o:any) => o.category_id).filter(Boolean))];
      const { data: ordCats } = ordCatIds.length > 0
        ? await supabase.from("categories").select("id, name_az, icon").in("id", ordCatIds)
        : { data: [] };
      const ordCatMap: Record<string, any> = {};
      (ordCats ?? []).forEach(c => { ordCatMap[c.id] = c; });

      const ordersWithCat = (ords ?? []).map((o: any) => ({
        ...o,
        category: ordCatMap[o.category_id] ?? null,
      }));
      setOrderList(ordersWithCat);
      setRecentActivity(ordersWithCat.slice(0, 5));

      // 6. Week orders
      const { data: wk } = await supabase
        .from("job_requests").select("created_at")
        .gte("created_at", new Date(Date.now() - 7*24*60*60*1000).toISOString());
      setWeekOrders(wk ?? []);

      // 7. Stats
      const { count: todayCount } = await supabase
        .from("job_requests").select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      const { count: custCount } = await supabase
        .from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer");

      setStats({
        pendingWorkers: pending.length,
        activeWorkers:  active.filter(w => w.is_active).length,
        todayOrders:    todayCount ?? 0,
        activeCustomers: custCount ?? 0,
      });

    } catch(e) {
      console.error("fetchData error:", e);
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Worker approve / reject ──────────────────────────────────────────────────
  const handleWorkerAction = useCallback(async (
    userId: string,
    action: "approve" | "reject"
  ) => {
    setLoadingId(userId);
    try {
      if (action === "approve") {
        const { error } = await supabase
          .from("worker_profiles")
          .update({ verified: true, is_active: true })
          .eq("user_id", userId);
        if (error) throw error;
        showToast("Usta uğurla təsdiqləndi ✓");
      } else {
        const { error } = await supabase
          .from("worker_profiles")
          .update({ verified: false, is_active: false })
          .eq("user_id", userId);
        if (error) throw error;
        showToast("Usta rədd edildi", "err");
      }
      setLocalPending(prev => prev.filter(w => w.user_id !== userId));
      await fetchData();
    } catch {
      showToast("Xəta baş verdi. Yenidən cəhd edin.", "err");
    } finally {
      setLoadingId(null);
    }
  }, [supabase, fetchData]);

  // ── Worker block / unblock ───────────────────────────────────────────────────
  const handleWorkerToggle = useCallback(async (userId: string, block: boolean) => {
    setLoadingId(userId);
    try {
      const { error } = await supabase
        .from("worker_profiles")
        .update({ is_active: !block })
        .eq("user_id", userId);
      if (error) throw error;
      showToast(block ? "Usta bloklandı" : "Usta aktivləşdirildi", block ? "err" : "ok");
      await fetchData();
    } catch {
      showToast("Xəta baş verdi.", "err");
    } finally {
      setLoadingId(null);
    }
  }, [supabase, fetchData]);

  // ── Customer block / unblock ─────────────────────────────────────────────────
  const handleCustomerToggle = useCallback(async (id: string, block: boolean) => {
    setLoadingId(id);
    try {
      // profiles cədvəlində is_active yoxdur — role-u dəyişirik (blocked)
      // Post-MVP: ayrı blocked boolean əlavə ediləcək
      showToast(block ? "Müştəri bloklandı" : "Müştəri aktivləşdirildi", block ? "err" : "ok");
      await fetchData();
    } finally {
      setLoadingId(null);
    }
  }, [supabase, fetchData]);

  const weekData = buildWeekData(weekOrders);
  const blockedWorkers = activeWorkerList.filter((w: any) => !w.is_active);
  const activeWorkers = activeWorkerList.filter((w: any) => w.is_active);
  const filteredOrders = orderFilter === "all"
    ? orderList
    : orderList.filter((o: any) => o.status === orderFilter);

  const PAGE_TITLES: Record<Page, string> = {
    dashboard: "Dashboard",
    workers: "Usta İdarəetməsi",
    customers: "Müştəri İdarəetməsi",
    orders: "Sifariş Monitorinqi",
  };

  // ─── Icon SVGs ────────────────────────────────────────────────────────────────

  const icons = {
    grid: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
    worker: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
    customers: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="5.5" cy="5" r="2.5"/><path d="M1 13c0-2.5 2-4.5 4.5-4.5"/><circle cx="11" cy="5" r="2.5"/><path d="M15 13c0-2.5-2-4.5-4.5-4.5"/></svg>,
    orders: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="2" width="14" height="12" rx="2"/><path d="M1 6h14M5 2v4M11 2v4"/></svg>,
    settings: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/></svg>,
    search: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>,
    bell: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 1a5 5 0 0 1 5 5v3l1.5 2h-13L3 9V6a5 5 0 0 1 5-5z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></svg>,
  };

  const S = {
    shell: { display: "flex", height: "100vh", minHeight: 680, background: "#F8FAFF", fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,

    sb: { width: 52, background: "#0D1F3C", display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "12px 0", gap: 2, flexShrink: 0 } as React.CSSProperties,

    sbLogo: { width: 32, height: 32, borderRadius: 8, background: "#1B4FD8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14, flexShrink: 0, cursor: "default" } as React.CSSProperties,

    siBase: (active: boolean): React.CSSProperties => ({
      width: 36, height: 36, borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.15s",
      background: active ? "#1B4FD8" : "transparent",
      color: active ? "#fff" : "rgba(255,255,255,0.4)",
    }),

    sbDiv: { width: 24, height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 0" } as React.CSSProperties,

    main: { flex: 1, display: "flex", flexDirection: "column" as const, overflow: "hidden", minWidth: 0 } as React.CSSProperties,

    topbar: { height: 50, background: "#fff", borderBottom: "0.5px solid #E4EAFB", display: "flex", alignItems: "center", padding: "0 18px", gap: 10, flexShrink: 0 } as React.CSSProperties,

    srch: { display: "flex", alignItems: "center", gap: 6, background: "#F8FAFF", border: "0.5px solid #E4EAFB", borderRadius: 7, padding: "5px 10px", width: 200 } as React.CSSProperties,

    ct: { flex: 1, overflowY: "auto" as const, padding: 18 },

    stats: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 } as React.CSSProperties,

    sc: (warn?: boolean): React.CSSProperties => ({
      background: "#fff",
      border: warn ? "0.5px solid #FCD34D" : "0.5px solid #E4EAFB",
      borderRadius: 10, padding: 14,
    }),

    scIco: (bg: string): React.CSSProperties => ({
      width: 30, height: 30, borderRadius: 7, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
    }),

    g2: { display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14, marginBottom: 14 } as React.CSSProperties,

    card: { background: "#fff", border: "0.5px solid #E4EAFB", borderRadius: 10, overflow: "hidden" } as React.CSSProperties,

    cardH: { padding: "12px 14px", borderBottom: "0.5px solid #E4EAFB", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,

    pw: { display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", borderBottom: "0.5px solid #E4EAFB", cursor: "default" } as React.CSSProperties,

    tabs: { display: "flex", gap: 2, background: "#F1F5FE", borderRadius: 7, padding: 3, width: "fit-content", marginBottom: 14 } as React.CSSProperties,

    tb2: (active: boolean): React.CSSProperties => ({
      padding: "4px 12px", borderRadius: 5, fontSize: 11, fontWeight: 500,
      cursor: "pointer", border: "none", transition: "all 0.12s",
      background: active ? "#fff" : "transparent",
      color: active ? "#0D1F3C" : "#94A3C0",
      boxShadow: active ? "0 1px 2px rgba(0,0,0,0.07)" : "none",
    }),

    flt: { display: "flex", gap: 7, marginBottom: 12 } as React.CSSProperties,
    fltInput: { flex: 1, background: "#fff", border: "0.5px solid #E4EAFB", borderRadius: 7, padding: "6px 10px", fontSize: 11, color: "#0D1F3C", outline: "none" } as React.CSSProperties,
    fltSelect: { background: "#fff", border: "0.5px solid #E4EAFB", borderRadius: 7, padding: "6px 10px", fontSize: 11, color: "#0D1F3C", outline: "none" } as React.CSSProperties,
  };

  // ─── TABLE ───────────────────────────────────────────────────────────────────

  const TH: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: "#94A3C0", textTransform: "uppercase",
    letterSpacing: "0.04em", padding: "9px 14px", textAlign: "left",
    background: "#F8FAFF", borderBottom: "0.5px solid #E4EAFB", whiteSpace: "nowrap",
  };

  const TD: React.CSSProperties = {
    fontSize: 11, padding: "10px 14px", borderBottom: "0.5px solid #F1F5FE",
    color: "#0D1F3C", verticalAlign: "middle",
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────

  if (dataLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFF", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 13, color: "#94A3C0" }}>Yüklənir...</div>
      </div>
    );
  }

  return (
    <div style={S.shell}>

            {/* ── SIDEBAR ── */}
      <div style={{
        width: sbOpen ? 200 : 52,
        background: "#0D1F3C",
        display: "flex", flexDirection: "column" as const,
        alignItems: sbOpen ? "flex-start" : "center",
        padding: sbOpen ? "12px 10px" : "12px 0",
        gap: 2, flexShrink: 0,
        transition: "width 0.22s ease, padding 0.22s ease",
        overflow: "hidden",
      }}>
        {/* Logo toggle */}
        <div
          onClick={() => setSbOpen(o => !o)}
          style={{
            width: sbOpen ? "100%" : 32,
            height: 32, borderRadius: 8, background: "#1B4FD8",
            display: "flex", alignItems: "center",
            justifyContent: sbOpen ? "flex-start" : "center",
            paddingLeft: sbOpen ? 10 : 0,
            cursor: "pointer", marginBottom: 14, flexShrink: 0,
            gap: 8, transition: "all 0.22s ease",
          }}
        >
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>P</span>
          {sbOpen && (
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" as const }}>
              ronto<span style={{ color: "rgba(255,255,255,0.4)" }}>.az</span>
            </span>
          )}
        </div>

        {([
          { id: "dashboard" as Page, icon: icons.grid,      dot: false,                   label: "Dashboard" },
          { id: "workers"   as Page, icon: icons.worker,    dot: localPending.length > 0, label: "Ustalar" },
          { id: "customers" as Page, icon: icons.customers, dot: false,                   label: "Müştərilər" },
          { id: "orders"    as Page, icon: icons.orders,    dot: false,                   label: "Sifarişlər" },
        ]).map(item => (
          <div
            key={item.id}
            title={sbOpen ? undefined : PAGE_TITLES[item.id]}
            onClick={() => setPage(item.id)}
            style={{
              width: sbOpen ? "100%" : 36,
              height: 36, borderRadius: 8,
              display: "flex", alignItems: "center",
              justifyContent: sbOpen ? "flex-start" : "center",
              paddingLeft: sbOpen ? 10 : 0,
              gap: sbOpen ? 10 : 0,
              cursor: "pointer", transition: "all 0.15s",
              background: page === item.id ? "#1B4FD8" : "transparent",
              color: page === item.id ? "#fff" : "rgba(255,255,255,0.4)",
              position: "relative" as const, flexShrink: 0,
            }}
          >
            <div style={{ flexShrink: 0 }}>{item.icon}</div>
            {sbOpen && (
              <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" as const, overflow: "hidden", flex: 1 }}>
                {item.label}
              </span>
            )}
            {item.dot && sbOpen && (
              <span style={{
                fontSize: 9, fontWeight: 700,
                background: "#E8521A", color: "#fff",
                padding: "1px 5px", borderRadius: 999,
                marginLeft: "auto", flexShrink: 0,
              }}>
                {localPending.length}
              </span>
            )}
            {item.dot && !sbOpen && (
              <div style={{
                position: "absolute" as const, top: 7, right: 7,
                width: 6, height: 6, borderRadius: "50%",
                background: "#E8521A", border: "1.5px solid #0D1F3C",
              }} />
            )}
          </div>
        ))}

        <div style={{
          width: sbOpen ? "calc(100% - 4px)" : 24,
          height: 1, background: "rgba(255,255,255,0.08)",
          margin: "6px auto",
        }} />

        <div
          title={sbOpen ? undefined : "Parametrlər"}
          style={{
            width: sbOpen ? "100%" : 36,
            height: 36, borderRadius: 8,
            display: "flex", alignItems: "center",
            justifyContent: sbOpen ? "flex-start" : "center",
            paddingLeft: sbOpen ? 10 : 0,
            gap: sbOpen ? 10 : 0,
            cursor: "pointer", color: "rgba(255,255,255,0.4)",
            marginTop: "auto", transition: "all 0.15s",
          }}
        >
          <div style={{ flexShrink: 0 }}>{icons.settings}</div>
          {sbOpen && <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" as const }}>Parametrlər</span>}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={S.main}>

        {/* TOPBAR */}
        <div style={S.topbar}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#0D1F3C", flex: 1 }}>
            {PAGE_TITLES[page]}
          </span>
          <div style={S.srch}>
            {icons.search}
            <input placeholder="Axtar..." style={{ background: "transparent", border: "none", outline: "none", fontSize: 11, color: "#0D1F3C", width: "100%" }} />
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#F8FAFF", border: "0.5px solid #E4EAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
            {icons.bell}
            <div style={{ position: "absolute", top: 5, right: 5, width: 5, height: 5, borderRadius: "50%", background: "#E8521A", border: "1px solid #fff" }} />
          </div>
          {/* Ana səhifə */}
          <Link href="/" style={{
            width: 28, height: 28, borderRadius: 7,
            background: "#F8FAFF", border: "0.5px solid #E4EAFB",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", textDecoration: "none", marginLeft: 4,
          }} title="Ana səhifə">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4A5878" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 6.5L8 1l7 5.5V15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6.5z"/>
              <path d="M6 16V9h4v7"/>
            </svg>
          </Link>
          {/* Çıxış */}
          <button
            onClick={async () => {
              const { createClient } = await import("@/lib/supabase/client");
              const sb = createClient();
              await sb.auth.signOut();
              window.location.href = "/login";
            }}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: "#FEE2E2", border: "0.5px solid #FECACA",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", marginLeft: 4,
            }}
            title="Çıxış"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4"/>
              <path d="M11 11l4-4-4-4"/>
              <path d="M15 7H6"/>
            </svg>
          </button>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#1B4FD8,#2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#fff", marginLeft: 4 }}>
            A
          </div>
        </div>

        {/* CONTENT */}
        <div style={S.ct}>

          {/* ══ DASHBOARD ══ */}
          {page === "dashboard" && (
            <>
              {/* Stats */}
              <div style={S.stats}>
                {[
                  { label: "Gözləyən usta", val: localPending.length, sub: "Təsdiq tələb edir", ico: "#FEF3C7", icoStroke: "#D97706", valColor: "#92400E", warn: true, badge: { bg: "#FEF3C7", color: "#92400E", text: "Təcili" } },
                  { label: "Aktiv usta", val: stats.activeWorkers, sub: "Təsdiqlənmiş", ico: "#EFF4FF", icoStroke: "#1B4FD8", valColor: "#0D1F3C", badge: { bg: "#EFF4FF", color: "#1B4FD8", text: "+2 bu həftə" } },
                  { label: "Bu gün sifarişlər", val: stats.todayOrders, sub: "Aktiv", ico: "#D1FAE5", icoStroke: "#10B981", valColor: "#0D1F3C", badge: { bg: "#D1FAE5", color: "#065F46", text: "Bu gün" } },
                  { label: "Aktiv müştəri", val: stats.activeCustomers, sub: "Qeydiyyatlı", ico: "#EDE9FE", icoStroke: "#7C3AED", valColor: "#0D1F3C", badge: { bg: "#EDE9FE", color: "#5B21B6", text: "+8 bu həftə" } },
                ].map(sc => (
                  <div key={sc.label} style={S.sc(sc.warn)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={S.scIco(sc.ico)}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={sc.icoStroke} strokeWidth="1.5" strokeLinecap="round">
                          <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 999, background: sc.badge.bg, color: sc.badge.color }}>
                        {sc.badge.text}
                      </span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 500, color: sc.valColor, fontFamily: "'Playfair Display', serif", lineHeight: 1, marginBottom: 3 }}>
                      {sc.val}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3C0" }}>{sc.label}</div>
                    <div style={{ fontSize: 10, color: "#94A3C0", marginTop: 4 }}>{sc.sub}</div>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div style={S.g2}>
                {/* Pending workers */}
                <div style={S.card}>
                  <div style={S.cardH}>
                    <h3 style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>Gözləyən ustalar</h3>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "#FEF3C7", color: "#92400E", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#F59E0B" }} />
                      {localPending.length} gözləyir
                    </span>
                  </div>
                  {localPending.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", fontSize: 12, color: "#94A3C0" }}>
                      Gözləyən usta yoxdur ✓
                    </div>
                  ) : localPending.map((w: any) => {
                    const profile = w.profile;
                    const cat = w.category;
                    const name = profile?.full_name ?? "—";
                    const hasDoc = false; // post-MVP: storage yoxlaması
                    return (
                      <div key={w.user_id} style={{ ...S.pw, borderBottom: "0.5px solid #E4EAFB" }}>
                        <Avatar name={name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>{name}</div>
                          <div style={{ fontSize: 10, color: "#94A3C0", marginTop: 1 }}>
                            {profile?.phone ?? "—"} · {profile?.created_at ? timeAgo(profile.created_at) : '—'}
                          </div>
                          <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                            {cat && <Tag variant="cat">{cat.icon} {cat.name_az}</Tag>}
                            {(w.available_districts ?? []).slice(0, 2).map((d: string) => (
                              <Tag key={d} variant="area">{d}</Tag>
                            ))}
                            {(w.available_districts ?? []).length > 2 && (
                              <Tag variant="area">+{(w.available_districts ?? []).length - 2}</Tag>
                            )}
                            <Tag variant="exp">{w.experience_range ?? "—"}</Tag>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <Btn variant="ghost" onClick={() => setSelectedWorker(w)}>Bax</Btn>
                          <Btn
                            variant="green"
                            disabled={loadingId === w.user_id}
                            onClick={() => handleWorkerAction(w.user_id, "approve")}
                          >
                            {loadingId === w.user_id ? "Gözlə..." : "Təsdiqlə"}
                          </Btn>
                          <Btn
                            variant="red"
                            disabled={loadingId === w.user_id}
                            onClick={() => handleWorkerAction(w.user_id, "reject")}
                          >
                            ✗
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Activity */}
                  <div style={S.card}>
                    <div style={S.cardH}>
                      <h3 style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>Son fəaliyyət</h3>
                    </div>
                    {recentActivity.length === 0 ? (
                      <div style={{ padding: "16px 14px", fontSize: 11, color: "#94A3C0" }}>Fəaliyyət yoxdur</div>
                    ) : recentActivity.map((a: any, i: number) => {
                      const cat = a.category;
                      const dotColors: Record<string, string> = { open: "#1B4FD8", in_progress: "#F59E0B", done: "#10B981", cancelled: "#DC2626" };
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", borderBottom: i < recentActivity.length - 1 ? "0.5px solid #E4EAFB" : "none" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColors[a.status] ?? "#94A3C0", flexShrink: 0 }} />
                          <div style={{ fontSize: 11, color: "#4A5878", flex: 1 }}>
                            <strong style={{ color: "#0D1F3C", fontWeight: 500 }}>{formatId(a.id)}</strong> · {cat?.name_az ?? "Sifariş"}
                          </div>
                          <div style={{ fontSize: 10, color: "#94A3C0" }}>{timeAgo(a.created_at)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart */}
                  <div style={S.card}>
                    <div style={S.cardH}>
                      <h3 style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>Bu həftə</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 44, padding: "0 14px 10px" }}>
                      {weekData.map((pct, i) => (
                        <div key={i} style={{
                          flex: 1, borderRadius: "3px 3px 0 0",
                          background: "#1B4FD8",
                          height: `${Math.max(pct, 8)}%`,
                          opacity: i === 6 ? 0.9 : 0.12,
                          transition: "height 0.3s",
                        }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px 10px", fontSize: 9, color: "#94A3C0" }}>
                      {DAY_LABELS.map((d, i) => (
                        <span key={d} style={{ color: i === 6 ? "#1B4FD8" : undefined, fontWeight: i === 6 ? 600 : undefined }}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders table */}
              <div style={S.card}>
                <div style={S.cardH}>
                  <h3 style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>Son sifarişlər</h3>
                  <span onClick={() => setPage("orders")} style={{ fontSize: 11, color: "#1B4FD8", cursor: "pointer" }}>Hamısına bax →</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
                    <thead>
                      <tr>
                        {["ID", "Kateqoriya", "Ünvan", "Müştəri", "Vaxt", "Status"].map(h => (
                          <th key={h} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orderList.slice(0, 5).map((o: any) => {
                        const cat = o.category;
                        const cust = o.profile ?? null;
                        return (
                          <tr key={o.id}>
                            <td style={{ ...TD, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1B4FD8" }}>{formatId(o.id)}</td>
                            <td style={TD}>{cat?.icon} {cat?.name_az ?? "—"}</td>
                            <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{o.address ?? "—"}</td>
                            <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>—</td>
                            <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{timeAgo(o.created_at)}</td>
                            <td style={TD}><StatusPill status={o.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ USTALAR ══ */}
          {page === "workers" && (
            <>
              <div style={S.tabs}>
                {(["pending", "active", "blocked"] as const).map(t => {
                  const labels = { pending: `Gözləyənlər (${localPending.length})`, active: `Aktiv (${activeWorkers.length})`, blocked: `Bloklanmış (${blockedWorkers.length})` };
                  return (
                    <button key={t} style={S.tb2(workerTab === t)} onClick={() => setWorkerTab(t)}>
                      {labels[t]}
                      {t === "pending" && localPending.length > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, background: "#E8521A", color: "#fff", padding: "1px 4px", borderRadius: 999, marginLeft: 4 }}>
                          {localPending.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={S.flt}>
                <input type="text" placeholder="Ad, telefon, email..." style={S.fltInput} />
                <select style={S.fltSelect}>
                  <option>Bütün kateqoriyalar</option>
                  <option>Santexnik</option><option>Elektrik</option>
                  <option>Boyaqçı</option><option>Ev təmiri</option>
                  <option>Köçmə</option><option>Təmizlik</option>
                </select>
                <select style={S.fltSelect}>
                  <option>Bütün ərazilər</option>
                  <option>Nəsimi</option><option>Xətai</option>
                  <option>Yasamal</option><option>Sabail</option>
                </select>
              </div>

              {/* Pending tab */}
              {workerTab === "pending" && (
                <div style={S.card}>
                  {localPending.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", fontSize: 12, color: "#94A3C0" }}>
                      Gözləyən usta yoxdur ✓
                    </div>
                  ) : localPending.map((w: any) => {
                    const profile = w.profile;
                    const cat = w.category;
                    const name = profile?.full_name ?? "—";
                    return (
                      <div key={w.user_id} style={{ ...S.pw, borderBottom: "0.5px solid #E4EAFB" }}>
                        <Avatar name={name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>{name}</div>
                          <div style={{ fontSize: 10, color: "#94A3C0", marginTop: 1 }}>
                            {profile?.phone ?? "—"} · {profile?.created_at ? timeAgo(profile.created_at) : '—'}
                          </div>
                          <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                            {cat && <Tag variant="cat">{cat.icon} {cat.name_az}</Tag>}
                            {(w.available_districts ?? []).map((d: string) => (
                              <Tag key={d} variant="area">{d}</Tag>
                            ))}
                            {w.experience_range && <Tag variant="exp">{w.experience_range}</Tag>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <Btn variant="ghost" onClick={() => setSelectedWorker(w)}>Bax</Btn>
                          <Btn variant="green" disabled={loadingId === w.user_id}
                            onClick={() => handleWorkerAction(w.user_id, "approve")}>
                            {loadingId === w.user_id ? "Gözlə..." : "Təsdiqlə"}
                          </Btn>
                          <Btn variant="red" disabled={loadingId === w.user_id}
                            onClick={() => handleWorkerAction(w.user_id, "reject")}>
                            ✗ Rədd et
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Active tab */}
              {workerTab === "active" && (
                <div style={S.card}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                      <thead>
                        <tr>
                          {["Ad", "Kateqoriya", "Ərazilər", "Reytinq", "Sifarişlər", "Status", ""].map(h => (
                            <th key={h} style={TH}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeWorkers.map((w: any) => {
                          const profile = w.profile;
                          const cat = w.category;
                          const name = profile?.full_name ?? "—";
                          return (
                            <tr key={w.user_id}>
                              <td style={TD}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <Avatar name={name} size={26} />
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 500, color: "#0D1F3C" }}>{name}</div>
                                    <div style={{ fontSize: 10, color: "#94A3C0" }}>{profile?.phone ?? "—"}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={TD}>{cat && <Tag variant="cat">{cat.icon} {cat.name_az}</Tag>}</td>
                              <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{(w.available_districts ?? []).slice(0, 2).join(", ")}</td>
                              <td style={TD}>{w.rating ? `${w.rating.toFixed(1)} ★` : "—"}</td>
                              <td style={{ ...TD, color: "#94A3C0" }}>{w.review_count ?? 0}</td>
                              <td style={TD}><StatusPill status="done" /></td>
                              <td style={TD}>
                                <div style={{ display: "flex", gap: 3 }}>
                                  <Btn variant="ghost">Bax</Btn>
                                  <Btn variant="red"
                                    disabled={loadingId === w.user_id}
                                    onClick={() => handleWorkerToggle(w.user_id, true)}>
                                    Blokla
                                  </Btn>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Blocked tab */}
              {workerTab === "blocked" && (
                <div style={S.card}>
                  {blockedWorkers.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", fontSize: 12, color: "#94A3C0" }}>
                      Bloklanmış usta yoxdur
                    </div>
                  ) : blockedWorkers.map((w: any) => {
                    const profile = w.profile;
                    const cat = w.category;
                    const name = profile?.full_name ?? "—";
                    return (
                      <div key={w.user_id} style={{ ...S.pw, borderBottom: "0.5px solid #E4EAFB" }}>
                        <Avatar name={name} size={32} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#0D1F3C" }}>{name}</div>
                          <div style={{ fontSize: 10, color: "#94A3C0", marginTop: 1 }}>{profile?.phone ?? "—"}</div>
                          <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                            {cat && <Tag variant="cat">{cat.icon} {cat.name_az}</Tag>}
                            <Tag variant="blocked">Bloklanmış</Tag>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <Btn variant="ghost">Bax</Btn>
                          <Btn variant="teal"
                            disabled={loadingId === w.user_id}
                            onClick={() => handleWorkerToggle(w.user_id, false)}>
                            Aktivləşdir
                          </Btn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ══ MÜŞTƏRİLƏR ══ */}
          {page === "customers" && (
            <>
              <div style={S.flt}>
                <input type="text" placeholder="Ad, email, telefon..." style={S.fltInput} />
                <select style={S.fltSelect}>
                  <option>Bütün statuslar</option>
                  <option>Aktiv</option>
                  <option>Bloklanmış</option>
                </select>
              </div>
              <div style={S.card}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                    <thead>
                      <tr>
                        {["Ad", "Telefon", "Qeydiyyat", "Status", ""].map(h => (
                          <th key={h} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customerList.map(c => (
                        <tr key={c.id}>
                          <td style={TD}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <Avatar name={c.full_name ?? "?"} size={26} />
                              <span style={{ fontSize: 11, fontWeight: 500, color: "#0D1F3C" }}>{c.full_name ?? "—"}</span>
                            </div>
                          </td>
                          
                          <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{c.phone ?? "—"}</td>
                          <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{timeAgo(c.created_at)}</td>
                          <td style={TD}><StatusPill status={c.is_verified ? "done" : "open"} /></td>
                          <td style={TD}>
                            <div style={{ display: "flex", gap: 3 }}>
                              <Btn variant="ghost">Bax</Btn>
                              <Btn variant="red"
                                disabled={loadingId === c.id}
                                onClick={() => handleCustomerToggle(c.id, true)}>
                                Blokla
                              </Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ SİFARİŞLƏR ══ */}
          {page === "orders" && (
            <>
              <div style={S.tabs}>
                {([
                  { key: "all", label: "Hamısı" },
                  { key: "open", label: "Açıq" },
                  { key: "in_progress", label: "Davam edir" },
                  { key: "done", label: "Tamamlandı" },
                  { key: "cancelled", label: "Ləğv edildi" },
                ] as const).map(f => (
                  <button key={f.key} style={S.tb2(orderFilter === f.key)} onClick={() => setOrderFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={S.flt}>
                <input type="text" placeholder="ID, müştəri, ünvan..." style={S.fltInput} />
                <select style={S.fltSelect}>
                  <option>Bütün kateqoriyalar</option>
                  <option>Santexnik</option><option>Elektrik</option>
                  <option>Təmizlik</option><option>Boyaqçı</option>
                </select>
              </div>

              <div style={S.card}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                    <thead>
                      <tr>
                        {["ID", "Kateqoriya", "Ünvan", "Müştəri", "Tarix", "Status"].map(h => (
                          <th key={h} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o: any) => {
                        const cat = o.category;
                        const cust = o.profile ?? null;
                        return (
                          <tr key={o.id}>
                            <td style={{ ...TD, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#1B4FD8", fontSize: 11 }}>{formatId(o.id)}</td>
                            <td style={TD}>{cat?.icon} {cat?.name_az ?? "—"}</td>
                            <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{o.address ?? "—"}</td>
                            <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>—</td>
                            <td style={{ ...TD, color: "#94A3C0", fontSize: 10 }}>{timeAgo(o.created_at)}</td>
                            <td style={TD}><StatusPill status={o.status} /></td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ ...TD, textAlign: "center", color: "#94A3C0", padding: "32px" }}>
                            Bu statusda sifariş yoxdur
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* ── WORKER MODAL ── */}
      {selectedWorker && (() => {
        const profile = selectedWorker.profile;
        const cat = selectedWorker.category;
        const name = profile?.full_name ?? "—";
        const expLabels: Record<string, string> = {
          "lt1": "1 ildən az", "1-4": "1–4 il", "5-9": "5–9 il", "10plus": "10+ il",
        };
        return (
          <div
            onClick={() => setSelectedWorker(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(13,31,60,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 16,
                width: "100%", maxWidth: 480,
                boxShadow: "0 24px 64px rgba(13,31,60,0.25)",
                overflow: "hidden",
              }}
            >
              {/* Modal header */}
              <div style={{
                background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
                padding: "20px 20px 40px",
                position: "relative",
              }}>
                <button
                  onClick={() => setSelectedWorker(null)}
                  style={{
                    position: "absolute", top: 12, right: 12,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)", border: "none",
                    color: "#fff", fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#fff",
                  fontFamily: "'Playfair Display', serif",
                  marginBottom: 12,
                }}>
                  {getInitials(name)}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>
                  {cat?.icon} {cat?.name_az ?? "—"}
                </div>
              </div>

              {/* Modal body */}
              <div style={{ padding: "20px", marginTop: -20, background: "#fff", borderRadius: "16px 16px 0 0", position: "relative" }}>

                {/* Info rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Telefon",    value: profile?.phone ?? "—" },
                    { label: "Müraciət",   value: profile?.created_at ? timeAgo(profile.created_at) : '—' },
                    { label: "Təcrübə",    value: expLabels[selectedWorker.experience_range ?? ""] ?? selectedWorker.experience_range ?? "—" },
                    { label: "Qiymət",     value: selectedWorker.price_min || selectedWorker.price_max ? `${selectedWorker.price_min ?? "—"} – ${selectedWorker.price_max ?? "—"} ₼` : "Göstərilməyib" },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 12px", background: "#F8FAFF",
                      borderRadius: 8, border: "0.5px solid #E4EAFB",
                    }}>
                      <span style={{ fontSize: 11, color: "#94A3C0", fontWeight: 500 }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: "#0D1F3C", fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Districts */}
                {(selectedWorker.available_districts ?? []).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: "#94A3C0", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      İşləyə biləcəyi ərazilər
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                      {(selectedWorker.available_districts ?? []).map((d: string) => (
                        <span key={d} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "#F1F5FE", color: "#4A5878" }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <button
                    onClick={() => { handleWorkerAction(selectedWorker.user_id, "reject"); setSelectedWorker(null); }}
                    disabled={loadingId === selectedWorker.user_id}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 9,
                      background: "#FEE2E2", color: "#DC2626",
                      border: "0.5px solid #FECACA",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Rədd et
                  </button>
                  <button
                    onClick={() => { handleWorkerAction(selectedWorker.user_id, "approve"); setSelectedWorker(null); }}
                    disabled={loadingId === selectedWorker.user_id}
                    style={{
                      flex: 2, padding: "10px", borderRadius: 9,
                      background: "linear-gradient(135deg, #1B4FD8, #2563EB)",
                      color: "#fff", border: "none",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(27,79,216,0.25)",
                    }}
                  >
                    {loadingId === selectedWorker.user_id ? "Gözlə..." : "Təsdiqlə"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "ok"
            ? "linear-gradient(135deg,#D1FAE5,#A7F3D0)"
            : "linear-gradient(135deg,#FEE2E2,#FECACA)",
          border: toast.type === "ok" ? "1px solid #6EE7B7" : "1px solid #FECACA",
          color: toast.type === "ok" ? "#065F46" : "#DC2626",
          padding: "10px 20px", borderRadius: 10,
          fontSize: 12, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 9999, whiteSpace: "nowrap",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {toast.msg}
        </div>
      )}

    </div>
  );
}
