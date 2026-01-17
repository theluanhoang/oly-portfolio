import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders } from '@/lib/securityHeaders';
import { checkApiRateLimit } from '@/lib/rateLimit';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/api')) {
    if (pathname === '/api/health') {
      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }

    const method = request.method.toUpperCase();
    const isGet = method === 'GET';
    const isAuth = pathname.startsWith('/api/auth') && 
                   !pathname.includes('/session') && 
                   !pathname.includes('/providers') &&
                   !pathname.includes('/csrf') &&
                   method === 'POST';
    const rateLimitResult = checkApiRateLimit(request);
    
    let maxLimit: string;
    if (isAuth) {
      maxLimit = '30';
    } else if (isGet) {
      maxLimit = '500';
    } else {
      maxLimit = '200';
    }
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: rateLimitResult.message || 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
            'X-RateLimit-Limit': maxLimit,
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.retryAfter
              ? new Date(Date.now() + rateLimitResult.retryAfter * 1000).toISOString()
              : new Date().toISOString(),
          },
        }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', maxLimit);
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingAttempts.toString());
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
      loginUrl.searchParams.set('callbackUrl', pathnameAfterLocale || '/');
      const redirectResponse = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(redirectResponse);
    }
  }

  const response = intlMiddleware(request);
  
  const contentLanguage = locale || routing.defaultLocale;
  response.headers.set('Content-Language', contentLanguage);
  
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|_vercel|.*\\..*).*)',
    '/',
  ],
};



