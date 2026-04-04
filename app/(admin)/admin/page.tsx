import { createClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  // Stat cards üçün data
  const [
    { count: pendingWorkers },
    { count: activeWorkers },
    { count: todayOrders },
    { count: activeCustomers },
  ] = await Promise.all([
    supabase.from("worker_profiles").select("*", { count: "exact", head: true }).eq("verified", false),
    supabase.from("worker_profiles").select("*", { count: "exact", head: true }).eq("verified", true).eq("is_active", true),
    supabase.from("job_requests").select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  // Gözləyən ustalar — tam məlumat
  const { data: pendingWorkerList } = await supabase
    .from("worker_profiles")
    .select(`
      user_id, experience_range, price_min, price_max,
      available_districts, category_id,
      categories!worker_profiles_category_id_fkey(name_az, icon),
      profiles(full_name, phone, created_at)
    `)
    .eq("verified", false)
    .order("created_at", { ascending: false });

  // Aktiv ustalar
  const { data: activeWorkerList } = await supabase
    .from("worker_profiles")
    .select(`
      user_id, rating, review_count, is_active, category_id,
      available_districts,
      categories!worker_profiles_category_id_fkey(name_az, icon),
      profiles(full_name, phone, created_at)
    `)
    .eq("verified", true)
    .order("rating", { ascending: false });

  // Müştərilər
  const { data: customerList } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at, is_verified")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  // Sifarişlər
  const { data: orderList } = await supabase
    .from("job_requests")
    .select(`
      id, status, address, created_at,
      categories!job_requests_category_id_fkey(name_az, icon),
      profiles(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // Son fəaliyyət
  const { data: recentActivity } = await supabase
    .from("job_requests")
    .select(`
      id, status, created_at,
      categories!job_requests_category_id_fkey(name_az)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  // Bu həftə sifarişlər (son 7 gün, günlük saylar)
  const { data: weekOrders } = await supabase
    .from("job_requests")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return (
    <AdminClient
      stats={{
        pendingWorkers: pendingWorkers ?? 0,
        activeWorkers: activeWorkers ?? 0,
        todayOrders: todayOrders ?? 0,
        activeCustomers: activeCustomers ?? 0,
      }}
      pendingWorkerList={pendingWorkerList ?? []}
      activeWorkerList={activeWorkerList ?? []}
      customerList={customerList ?? []}
      orderList={orderList ?? []}
      recentActivity={recentActivity ?? []}
      weekOrders={weekOrders ?? []}
    />
  );
}
