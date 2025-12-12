import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';
import { checkRateLimit, recordFailedLogin, recordSuccessfulLogin } from '@/lib/rateLimit';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in environment variables');
}

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables');
}

const baseAuthHandler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{ id: string; name: string; email: string; role: string } | null> {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (
          credentials?.username === adminUsername &&
          credentials?.password === adminPassword
        ) {
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@oly-studio.com',
            role: 'admin',
          };
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.role = (user as User & { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (token && session.user) {
        (session.user as Session['user'] & { id?: string; role?: string }).id = token.id as string;
        (session.user as Session['user'] & { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  events: {
    async signIn({ user }: { user: User }): Promise<void> {
      if (user) {
        console.log(`[AUTH] Successful login: ${user.email || user.name}`);
      }
    },
    async signOut(): Promise<void> {
      console.log('[AUTH] User signed out');
    },
  },
});

async function GET(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }): Promise<Response> {
  return baseAuthHandler(req, context);
}

async function POST(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }): Promise<Response> {
  const url = req.nextUrl;
  
  if (url.pathname.includes('/callback/credentials')) {
    const rateLimitCheck = checkRateLimit(req);
    
    if (!rateLimitCheck.allowed) {
      const errorUrl = new URL('/admin/login', req.url);
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

