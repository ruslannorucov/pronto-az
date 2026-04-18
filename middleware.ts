import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/orders",  
  "/worker/dashboard",
  "/worker/profile",
  "/worker/offers",
  "/request/new",
];

const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Qorunan səhifəyə giriş cəhdi — auth yoxdursa login-ə yönləndir
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth səhifəsinə giriş — artıq login edilibsə yönləndir
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && user) {
    // Əvvəlcə metadata-dan oxu — sürətli, RLS-dən asılı deyil
    const metaRole = user.user_metadata?.role as string | undefined;

    // Metadata-da admin/worker varsa — birbaşa yönləndir
    if (metaRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (metaRole === "worker") {
      return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    }

    // Fallback: profiles cədvəlindən oxu (admin user üçün auth.uid()=id şərti ödənir)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (profile?.role === "worker") {
      return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Worker səhifələrinə yalnız worker/admin girə bilər
  // İstisnalar: /worker/register, /worker/pending — hər kəs girə bilər
  // Variant B: /dashboard və /request/new worker üçün də açıqdır
  if (
    pathname.startsWith("/worker") &&
    !pathname.startsWith("/worker/register") &&
    !pathname.startsWith("/worker/pending") &&
    user
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "worker" && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Variant B: /dashboard və /request/new-ə worker də girə bilər
  // Customer layout worker-i bloklamır — bunu aradan qaldırırıq
  // Yəni: customer route-larına role yoxlaması YOXdur — login olması kifayətdir

  // Admin route yoxlaması AdminLayout-da həyata keçirilir
  // Middleware-də yoxlama Codespace cookie problemi səbəbindən buraxılır

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};