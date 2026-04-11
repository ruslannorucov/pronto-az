"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppTopBar from "@/components/AppTopBar";
import BottomNav from "@/components/BottomNav";

const SHELL_EXCLUDED = [
  "/login",
  "/register",
  "/worker/register",
  "/worker/pending",
  "/admin",
];

function isExcluded(pathname: string): boolean {
  if (pathname === "/") return true;
  return SHELL_EXCLUDED.some((p) => pathname.startsWith(p));
}

interface UserInfo {
  role: "customer" | "worker";
  fullName: string;
  email: string;
  initials: string;
  unreadCount: number;
  activeBadge: number;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setChecked(true); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authUser.id)
        .single();

      // Admin və ya profile yoxdursa shell göstərmə
      if (!profile || profile.role === "admin") { setChecked(true); return; }

      // Yalnız customer və worker üçün davam et
      const validRole = profile.role === "worker" ? "worker" : "customer";

      const parts = (profile.full_name ?? "").trim().split(" ");
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : (parts[0] ?? "?").substring(0, 2).toUpperCase();

      const { count: unreadCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .is("read_at", null);

      let activeBadge = 0;
      if (validRole === "worker") {
        const { count } = await supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("worker_id", authUser.id)
          .eq("status", "pending");
        activeBadge = count ?? 0;
      }

      setUser({
        role: validRole,
        fullName: profile.full_name ?? "",
        email: authUser.email ?? "",
        initials,
        unreadCount: unreadCount ?? 0,
        activeBadge,
      });
      setChecked(true);
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setUser(null); setChecked(true); }
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname]);

  const showShell = checked && user && !isExcluded(pathname);

  return (
    <>
      {showShell && (
        <AppTopBar
          userRole={user.role}
          userName={user.fullName}
          userEmail={user.email}
          initials={user.initials}
          unreadCount={user.unreadCount}
        />
      )}

      {children}

      {showShell && (
        <Suspense fallback={null}>
          <BottomNav
            variant={user.role === "worker" ? "worker" : "customer"}
            activeBadge={user.activeBadge}
          />
        </Suspense>
      )}
    </>
  );
}
