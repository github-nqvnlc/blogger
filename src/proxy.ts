import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildLocalePath,
  DEFAULT_LOCALE,
  extractLocaleFromPathname,
  LOCALE_COOKIE_KEY,
  normalizeLocale,
  stripLocaleFromPathname,
} from "@/i18n";

const PUBLIC_PATHS = ["/login", "/register"];
const FRAPPE_URL =
  process.env.FRAPPE_URL ?? process.env.NEXT_PUBLIC_FRAPPE_URL ?? "";

async function fetchUserLocale(request: NextRequest): Promise<string | null> {
  const sid = request.cookies.get("sid")?.value;
  if (!sid || sid === "Guest" || !FRAPPE_URL) return null;

  try {
    const userRes = await fetch(
      `${FRAPPE_URL}/api/method/frappe.auth.get_logged_user`,
      {
        headers: { cookie: `sid=${sid}` },
        cache: "no-store",
      },
    );
    if (!userRes.ok) return null;

    const userData = (await userRes.json()) as { message?: string };
    const user = userData.message;
    if (!user) return null;

    const profileRes = await fetch(
      `${FRAPPE_URL}/api/resource/User/${encodeURIComponent(user)}?fields=${encodeURIComponent(
        JSON.stringify(["language"]),
      )}`,
      {
        headers: { cookie: `sid=${sid}` },
        cache: "no-store",
      },
    );
    if (!profileRes.ok) return null;

    const profileData = (await profileRes.json()) as {
      data?: { language?: string };
    };
    return profileData.data?.language ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const urlLocale = extractLocaleFromPathname(pathname);
  const barePath = stripLocaleFromPathname(pathname);
  const cookieLocale = normalizeLocale(
    request.cookies.get(LOCALE_COOKIE_KEY)?.value,
  );

  if (pathname === "/") {
    const profileLocale = normalizeLocale(await fetchUserLocale(request));
    const locale = profileLocale || cookieLocale || DEFAULT_LOCALE;
    const response = NextResponse.redirect(new URL(`/${locale}`, request.url));
    response.cookies.set(LOCALE_COOKIE_KEY, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (!urlLocale) {
    const locale = cookieLocale || DEFAULT_LOCALE;
    return NextResponse.redirect(
      new URL(buildLocalePath(locale, pathname), request.url),
    );
  }

  const isPublic = PUBLIC_PATHS.some((p) => barePath.startsWith(p));
  const sid = request.cookies.get("sid")?.value;
  const isLoggedIn = !!sid && sid !== "Guest";

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(
      new URL(buildLocalePath(urlLocale, "/login"), request.url),
    );
  }

  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(
      new URL(buildLocalePath(urlLocale, "/"), request.url),
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", urlLocale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(LOCALE_COOKIE_KEY, urlLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
