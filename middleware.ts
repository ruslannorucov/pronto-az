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
    const metaRole = user.user_metadata?.role as string | undefined;

    if (metaRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (metaRole === "worker") {
      return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    }

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

  return response;
}

export const config = {
  matcher: [
    /*
     * /workers/[id] — public profil səhifəsi, middleware-dən kənar
     * Aşağıdakı pattern /workers/ ilə başlayan bütün route-ları,
     * həmçinin static faylları exclude edir
     */
    "/((?!_next/static|_next/image|favicon.ico|workers|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};