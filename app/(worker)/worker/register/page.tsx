import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkerRegisterClient from "./WorkerRegisterClient";

export default async function WorkerRegisterPage() {
  // Bütün o uzun cookie mürəkkəbliyini tək bir sətirlə həll edirik!
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "worker") {
      redirect("/worker/panel");
    } else {
      redirect("/dashboard");
    }
  }

  // Təklif olunan kateqoriyaları çəkirik
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_az, icon")
    .is("parent_id", null)
    .order("name_az");

  return <WorkerRegisterClient categories={categories ?? []} />;
}