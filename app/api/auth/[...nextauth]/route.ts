import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, recordFailedLogin, recordSuccessfulLogin } from '@/lib/rateLimit';
import NextAuthHandler from '@/lib/auth';

const baseAuthHandler = NextAuthHandler;

async function GET(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }): Promise<Response> {
  return baseAuthHandler(req, context);
}

async function POST(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }): Promise<Response> {
  const url = req.nextUrl;
  
  if (url.pathname.includes('/callback/credentials')) {
    const rateLimitCheck = checkRateLimit(req);
    
    if (!rateLimitCheck.allowed) {
      const locale = req.headers.get('x-locale') || 'en';
      const errorUrl = new URL(`/${locale}/admin/login`, req.url);
      errorUrl.searchParams.set('error', 'CredentialsSignin');
      errorUrl.searchParams.set('error_description', encodeURIComponent(rateLimitCheck.message || 'Rate limit exceeded'));
      return NextResponse.redirect(errorUrl);
    }
  }

  try {
    const response = await baseAuthHandler(req, context);
    
    if (response instanceof Response && url.pathname.includes('/callback/credentials')) {
      const location = response.headers.get('location') || '';
      
      if (location.includes('error') || location.includes('signin')) {
        recordFailedLogin(req);
      } else if (location && !location.includes('signin') && !location.includes('error')) {
        recordSuccessfulLogin(req);
      }
    }
    
    return response;
  } catch (error) {
    if (url.pathname.includes('/callback/credentials')) {
      recordFailedLogin(req);
    }
    throw error;
  }
}

export { GET, POST };

