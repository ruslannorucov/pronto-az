import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkerDashboardClient from "./WorkerDashboardClient";

export default async function WorkerDashboardPage() {
  // Bütün o uzun cookie və server tənzimləmələrini tək bir sətrlə əvəz etdik
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/worker/panel");
  }

  // Fetch worker profile + category name
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "worker") {
    redirect("/dashboard");
  }

  const { data: workerProfile } = await supabase
    .from("worker_profiles")
    .select("rating, review_count, category_id, is_active, verified")
    .eq("user_id", user.id)
    .single();

  return (
    <WorkerDashboardClient
      userId={user.id}
      fullName={profile.full_name ?? "Usta"}
      rating={workerProfile?.rating ?? 0}
      reviewCount={workerProfile?.review_count ?? 0}
      categoryId={workerProfile?.category_id ?? null}
      isActive={workerProfile?.is_active ?? false}
      isVerified={workerProfile?.verified ?? false}
    />
  );
}