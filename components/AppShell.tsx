"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppTopBar from "@/components/AppTopBar";
import BottomNav from "@/components/BottomNav";

// AppTopBar göstərilməyən route-lar (öz header-i olan səhifələr)
const TOPBAR_EXCLUDED = [
  "/login",
  "/register",
  "/worker/register",
  "/worker/pending",
  "/admin",
  "/notifications",
  "/profile",
  "/dashboard/history",
  "/workers",
  "/request",
];

// BottomNav göstərilməyən route-lar
const BOTTOMNAV_EXCLUDED = [
  "/login",
  "/register",
  "/worker/register",
  "/worker/pending",
  "/admin",
  "/request",
];

function isTopBarExcluded(pathname: string): boolean {
  if (pathname === "/") return true;
  return TOPBAR_EXCLUDED.some((p) => pathname.startsWith(p));
}

function isBottomNavExcluded(pathname: string): boolean {
  if (pathname === "/") return true;
  return BOTTOMNAV_EXCLUDED.some((p) => pathname.startsWith(p));
}

// Tab adını müəyyən et
function resolvePageTitle(pathname: string, searchParams: URLSearchParams): string {
  const tab = searchParams.get("tab");
  if (pathname === "/dashboard") {
    if (tab === "orders") return "Sifarişlərim";
    return "home"; // logo göstəriləcək
  }
  if (pathname === "/chats") return "Mesajlar";
  return "home";
}

interface UserInfo {
  role: "customer" | "worker";
  fullName: string;
  email: string;
  initials: string;
  unreadCount: number;
  activeBadge: number;
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;
      if (!authUser) { setChecked(true); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authUser.id)
        .single();

      if (!profile || profile.role === "admin") { setChecked(true); return; }

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
      else load();
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname]);

  const showTopBar    = checked && user && !isTopBarExcluded(pathname);
  const showBottomNav = checked && user && !isBottomNavExcluded(pathname);
  const pageTitle     = resolvePageTitle(pathname, searchParams);

  return (
    <>
      {showTopBar && (
        <AppTopBar
          userRole={user.role}
          userName={user.fullName}
          userEmail={user.email}
          initials={user.initials}
          unreadCount={user.unreadCount}
          pageTitle={pageTitle}
        />
      )}

      {children}

      {showBottomNav && (
        <BottomNav
          variant={user.role === "worker" ? "worker" : "customer"}
          activeBadge={user.activeBadge}
        />
      )}
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}