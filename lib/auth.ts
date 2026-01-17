import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in environment variables');
}

const getAuthUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  return 'https://olystudio.com';
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{ id: string; name: string; email: string; role: string } | null> {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error('[AUTH] Error during authorization:', error);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  url: getAuthUrl(),
  trustHost: true,
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
    strategy: 'jwt' as const,
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
};

export default NextAuth(authOptions);

/**
 * Kiểm tra xem người dùng đã đăng nhập và có role admin hay không
 * @param session - Session từ getServerSession
 * @returns Object chứa thông tin lỗi nếu không phải admin, null nếu là admin
 */
export async function checkAdminAuth(session: Session | null): Promise<{ error: string; status: number } | null> {
  if (!session) {
    return {
      error: 'Unauthorized. Please log in to access this resource.',
      status: 401,
    };
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') {
    return {
      error: 'Forbidden. Admin role required to access this resource.',
      status: 403,
    };
  }

  return null;
}

