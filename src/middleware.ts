import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = (req.nextauth.token as { role?: string } | null)?.role;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = { matcher: ["/dashboard/:path*"] };
