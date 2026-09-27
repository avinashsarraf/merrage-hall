import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "merragehall.app").toLowerCase();
const SESSION_COOKIE = "mh_session";

/** Paths that always belong to the core app (never rewritten to venue pages). */
const APP_PREFIXES = ["/dashboard", "/login", "/register", "/halls", "/pricing", "/api", "/bookings"];

function isAppPath(pathname: string) {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isRootHost(host: string) {
  return (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".e2b.app") // sandbox preview host
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) guard the dashboard behind a session cookie
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  if (isAppPath(pathname)) return NextResponse.next();

  // 2) venue subdomains → venue page  (rajwada.merragehall.app → /halls/rajwada)
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();

  if (!isRootHost(host)) {
    if (host.endsWith(`.${ROOT_DOMAIN}`)) {
      const slug = host.slice(0, host.length - ROOT_DOMAIN.length - 1);
      if (slug && slug !== "www" && slug !== "www2") {
        return NextResponse.rewrite(new URL(`/halls/${slug}`, req.url));
      }
    } else if (host.endsWith(".localhost")) {
      const slug = host.slice(0, -".localhost".length);
      if (slug) return NextResponse.rewrite(new URL(`/halls/${slug}`, req.url));
    } else if (host.includes(".")) {
      // 3) custom domain → resolved against the venues table
      return NextResponse.rewrite(new URL(`/halls/by-host?host=${encodeURIComponent(host)}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)"],
};
