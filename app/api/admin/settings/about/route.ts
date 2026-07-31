import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { invalidateCache } from '@/i18n/request';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const translations = await prisma.translation.findMany({
      where: {
        key: {
          in: ['AboutPage.shaneImage', 'AboutPage.eduardoImage'],
        },
      },
    });

    const shaneImage = translations.find(t => t.key === 'AboutPage.shaneImage')?.value || '/assets/creator-1.jpg';
    const eduardoImage = translations.find(t => t.key === 'AboutPage.eduardoImage')?.value || '/assets/creator-2.jpg';

    return NextResponse.json({ shaneImage, eduardoImage });
  } catch (error) {
    console.error('Error fetching about settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { shaneImage, eduardoImage } = body;

    if (!shaneImage?.trim() || !eduardoImage?.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ ảnh cho cả hai thành viên (Shane và Eduardo)' },
        { status: 400 }
      );
    }

    const locales = ['vi', 'en'];

    await prisma.$transaction(
      locales.flatMap(locale => [
        prisma.translation.upsert({
          where: {
            key_locale_namespace: {
              key: 'AboutPage.shaneImage',
              locale,
              namespace: 'AboutPage',
            },
          },
          update: { value: shaneImage },
          create: { key: 'AboutPage.shaneImage', locale, value: shaneImage, namespace: 'AboutPage' },
        }),
        prisma.translation.upsert({
          where: {
            key_locale_namespace: {
              key: 'AboutPage.eduardoImage',
              locale,
              namespace: 'AboutPage',
            },
          },
          update: { value: eduardoImage },
          create: { key: 'AboutPage.eduardoImage', locale, value: eduardoImage, namespace: 'AboutPage' },
        }),
      ])
    );

    // Invalidate next-intl cache
    invalidateCache('vi');
    invalidateCache('en');
    invalidateCache();

    // Revalidate app pages
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      shaneImage,
      eduardoImage,
    });
  } catch (error) {
    console.error('Error saving about settings:', error);
    return NextResponse.json(
      { error: 'Failed to save about settings' },
      { status: 500 }
    );
  }
}
