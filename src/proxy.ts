import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const PUBLIC = ["/", "/sign-in", "/sign-up", "/pricing", "/api/auth/sign-in", "/api/auth/sign-up", "/api/icons", "/api/webhooks", "/api/paystack/verify", "/manifest.json", "/sw.js", "/offline.html"];
const ADMIN_ONLY = ["/dashboard"];
const EMPLOYEE_ONLY = ["/employee"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const isEmployee = session.role === "employee";

  // Employees can't access admin dashboard
  if (isEmployee && ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/employee", req.url));
  }

  // Admins/owners get redirected away from employee pages
  if (!isEmployee && EMPLOYEE_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
