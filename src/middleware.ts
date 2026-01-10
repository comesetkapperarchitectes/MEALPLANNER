import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for API and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply intl middleware first to handle locale routing
  const intlResponse = intlMiddleware(request);

  // Get the resolved pathname after intl processing
  const pathnameWithoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';

  // Create Supabase client for auth check
  const response = intlResponse || NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Use getUser() to validate the session with the server
  const { data: { user }, error } = await supabase.auth.getUser();
  const isAuthenticated = !error && user !== null;

  // Get the locale from the pathname (or default)
  const localeMatch = pathname.match(/^\/(fr|en)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/planning', '/recettes', '/courses', '/stock', '/parametres'];
  const isProtectedPath = protectedPaths.some(path =>
    pathnameWithoutLocale.startsWith(path)
  );

  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  // Auth routes - redirect to planning if already authenticated
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some(path =>
    pathnameWithoutLocale.startsWith(path)
  );

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/planning`, request.url));
  }

  // Root path (with locale) - redirect based on auth status
  if (pathnameWithoutLocale === '/' || pathnameWithoutLocale === '') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(`/${locale}/planning`, request.url));
    } else {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
