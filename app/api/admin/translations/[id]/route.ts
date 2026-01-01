import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invalidateCache } from '@/i18n/request';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const translation = await prisma.translation.findUnique({
      where: { id },
    });

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Error fetching translation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    );
  }
}

// PATCH - Cập nhật một translation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { key, locale, value, namespace } = body;

    const translation = await prisma.translation.update({
      where: { id },
      data: {
        ...(key !== undefined && { key }),
        ...(locale !== undefined && { locale }),
        ...(value !== undefined && { value: String(value) }),
        ...(namespace !== undefined && { namespace: namespace || null }),
      },
    });

    // Invalidate cache for the locale and all locales to be safe
    invalidateCache(translation.locale);
    invalidateCache(); // Invalidate all locales to ensure consistency
    
    // Revalidate all pages that might use translations
    revalidatePath('/', 'layout');

    return NextResponse.json({ translation });
  } catch (error: unknown) {
    console.error('Error updating translation:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa một translation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Get the translation first to know which locale to invalidate
    const translation = await prisma.translation.findUnique({
      where: { id },
      select: { locale: true },
    });

    await prisma.translation.delete({
      where: { id },
    });

    // Invalidate cache for the locale if translation existed
    if (translation) {
      invalidateCache(translation.locale);
      invalidateCache(); // Invalidate all locales to ensure consistency
      // Revalidate all pages that might use translations
      revalidatePath('/', 'layout');
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting translation:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete translation' },
      { status: 500 }
    );
  }
}

