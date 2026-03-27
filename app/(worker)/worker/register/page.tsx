import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WorkerRegisterClient from "./WorkerRegisterClient";

export default async function WorkerRegisterPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

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

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name_az, icon")
    .is("parent_id", null)
    .order("name_az");

  return <WorkerRegisterClient categories={categories ?? []} />;
}