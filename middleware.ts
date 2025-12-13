import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders } from '@/lib/securityHeaders';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle API routes (no locale prefix)
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(en|vi)/);
  const locale = localeMatch ? localeMatch[1] : null;
  const pathnameAfterLocale = locale ? pathname.replace(`/${locale}`, '') : pathname;
  
  // Check if this is an admin route (before locale processing)
  if (pathnameAfterLocale.startsWith('/admin') && !pathnameAfterLocale.startsWith('/admin/login')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const currentLocale = locale || routing.defaultLocale;
      const loginUrl = new URL(`/${currentLocale}/admin/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectResponse);
    }
  }

  // Handle locale-based routing (includes admin routes)
  const response = intlMiddleware(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Also match the root path
    '/',
  ],
};



