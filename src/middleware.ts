import { withAuth } from "next-auth/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { scopeForPath } from "@/lib/authz";

const STAGING_PASSWORD = process.env.STAGING_PASSWORD;
const GATE_COOKIE = "staging_gate";
const UNLOCK_PATH = "/staging-unlock";
const NOINDEX = "noindex, nofollow";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function gatePage(wrongPassword = false): NextResponse {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Ledger Academy — منطقة تطوير</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin:0; min-height:100vh; display:grid; place-items:center; padding:20px;
  font-family: system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif; background:#020617; color:#e2e8f0; }
form { width:min(92vw,380px); background:#0f172a; border:1px solid rgba(255,255,255,.1);
  border-radius:16px; padding:32px; box-shadow:0 20px 50px rgba(0,0,0,.45); }
h1 { margin:0 0 6px; font-size:1.1rem; color:#fbbf24; }
p { margin:0 0 20px; font-size:.85rem; color:#94a3b8; line-height:1.7; }
input { width:100%; padding:11px 13px; border-radius:10px; border:1px solid rgba(255,255,255,.15);
  background:#020617; color:#e2e8f0; font-size:1rem; }
input:focus { outline:none; border-color:#fbbf24; }
button { width:100%; margin-top:12px; padding:11px; border:0; border-radius:10px;
  background:#fbbf24; color:#020617; font-weight:700; font-size:.95rem; cursor:pointer; }
.err { margin-top:12px; color:#fca5a5; font-size:.8rem; }
</style></head><body>
<form method="POST" action="${UNLOCK_PATH}">
<h1>منطقة تطوير خاصة</h1>
<p>هذا الموقع قيد الإعداد ولم يُطلق بعد. أدخل كلمة المرور للمتابعة.</p>
<input type="password" name="password" placeholder="كلمة المرور" autofocus required autocomplete="current-password">
<button type="submit">دخول</button>
${wrongPassword ? '<div class="err">كلمة المرور غير صحيحة.</div>' : ""}
</form></body></html>`;
  return new NextResponse(html, {
    status: wrongPassword ? 401 : 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": NOINDEX,
      "cache-control": "no-store",
    },
  });
}

/**
 * Password gate for the private staging deployment. Inert unless
 * STAGING_PASSWORD is set (same nullable-config pattern as email / Upstash /
 * storage), so local dev and a real production deploy are unaffected. When
 * active it covers the whole site — page routes get a password form, API
 * routes get a 401 — and everything carries an `X-Robots-Tag: noindex` header.
 */
async function stagingGate(req: NextRequest): Promise<NextResponse | null> {
  if (!STAGING_PASSWORD) return null;

  const token = await sha256Hex(STAGING_PASSWORD);
  const { pathname, protocol } = req.nextUrl;

  if (pathname === UNLOCK_PATH) {
    if (req.method !== "POST") return gatePage();
    const form = await req.formData().catch(() => null);
    const supplied = form?.get("password");
    if (typeof supplied === "string" && (await sha256Hex(supplied)) === token) {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.set(GATE_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: protocol === "https:",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }
    return gatePage(true);
  }

  if (req.cookies.get(GATE_COOKIE)?.value === token) return null;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "الموقع قيد التطوير حاليًا." },
      { status: 401, headers: { "x-robots-tag": NOINDEX } },
    );
  }
  return gatePage();
}

const dashboardAuth = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as
      | { role?: string; superAdmin?: boolean; restrictedScopes?: string[] }
      | null;
    const role = token?.role;

    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }

    // Permission-scope backstop for restricted admins. Best-effort: the token
    // can lag a change by up to the 24h refresh — the page + API guards re-read
    // the DB and are authoritative.
    if (pathname.startsWith("/dashboard/admin") && role === "ADMIN" && !token?.superAdmin) {
      const scope = scopeForPath(pathname);
      if (scope && (token?.restrictedScopes ?? []).includes(scope)) {
        return NextResponse.redirect(new URL(`/dashboard/admin?denied=${scope}`, req.url));
      }
    }
  },
  { callbacks: { authorized: ({ token }) => !!token } },
);

const runDashboardAuth = dashboardAuth as unknown as (
  req: NextRequest,
  event: NextFetchEvent,
) => Promise<Response | undefined> | Response | undefined;

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const gated = await stagingGate(req);
  if (gated) return gated;

  // A logged-in student has no use for the marketing home — send them to their
  // dashboard. Admins pass through so they can preview the public site; `?home`
  // is an escape hatch for anyone.
  if (req.nextUrl.pathname === "/" && !req.nextUrl.searchParams.has("home")) {
    const token = await getToken({ req });
    if (token && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/student", req.url));
    }
  }

  let res: Response | undefined;
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    res = (await runDashboardAuth(req, event)) ?? undefined;
  }
  res = res ?? NextResponse.next();

  if (STAGING_PASSWORD) res.headers.set("x-robots-tag", NOINDEX);
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
