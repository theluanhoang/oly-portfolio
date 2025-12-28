import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import prisma from '@/lib/prisma';
import { changePasswordSchema } from '@/lib/validations/passwordSchema';
import { checkRateLimit, recordFailedLogin, recordSuccessfulLogin } from '@/lib/rateLimit';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to change your password.' },
        { status: 401 }
      );
    }

    const rateLimitCheck = checkRateLimit(req);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: rateLimitCheck.message || 'Too many attempts. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter 
        },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    let validatedData;
    try {
      validatedData = changePasswordSchema.parse(body);
    } catch (error) {
      recordFailedLogin(req);
      
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        const errors = error.issues.map((issue) => {
          const field = issue.path.join('.');
          const message = issue.message;
          
          if (!fieldErrors[field]) {
            fieldErrors[field] = message;
          }
          
          return { field, message };
        });
        
        const firstError = errors[0];
        return NextResponse.json(
          { 
            error: firstError.message,
            field: firstError.field,
            fieldErrors,
            details: errors.length > 1 ? errors : undefined
          },
          { status: 400 }
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Invalid request data';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validatedData;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, username: true },
    });

    if (!user) {
      recordFailedLogin(req);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      recordFailedLogin(req);
      return NextResponse.json(
        { error: 'Current password is incorrect', field: 'currentPassword' },
        { status: 401 }
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      recordFailedLogin(req);
      return NextResponse.json(
        { 
          error: 'New password must be different from your current password',
          field: 'newPassword'
        },
        { status: 400 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    recordSuccessfulLogin(req);

    return NextResponse.json(
      { 
        message: 'Password changed successfully',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[CHANGE_PASSWORD] Error:', error);
    recordFailedLogin(req);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while changing password. Please try again later.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

