/**
 * @module middleware
 * @description Route protection middleware with stable check
 * @safety RED
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow onboarding page for authenticated users
  if (pathname === "/onboarding") {
    return response;
  }

  // Check if user has a stable
  const { data: stable } = await supabase
    .from("stables")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!stable) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/clients/:path*", "/horses/:path*", "/services/:path*", "/assignments/:path*", "/onboarding"],
};
