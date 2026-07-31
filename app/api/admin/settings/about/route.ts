import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { invalidateCache } from '@/i18n/request';
import { revalidatePath } from 'next/cache';
import { unlink } from 'fs/promises';
import { join } from 'path';

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
          in: [
            'AboutPage.shaneImage',
            'AboutPage.eduardoImage',
            'AboutPage.profileLink',
            'AboutPage.seeMoreLink',
          ],
        },
      },
    });

    const shaneImage = translations.find(t => t.key === 'AboutPage.shaneImage')?.value || '/assets/creator-1.jpg';
    const eduardoImage = translations.find(t => t.key === 'AboutPage.eduardoImage')?.value || '/assets/creator-2.jpg';
    
    const profileLink = translations.find(t => t.key === 'AboutPage.profileLink')?.value || '';
    
    const defaultSeeMore = 'https://cdn.prod.website-files.com/62e93d1913e5a06515d73fbf/64fd2a89bdf844b51d9ef50e_Oly%20Profile%203_opt.pdf';
    const seeMoreLink = translations.find(t => t.key === 'AboutPage.seeMoreLink')?.value || defaultSeeMore;

    return NextResponse.json({
      shaneImage,
      eduardoImage,
      profileLink,
      seeMoreLink,
    });
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
    const {
      shaneImage,
      eduardoImage,
      profileLink,
      seeMoreLink,
    } = body;

    if (!shaneImage?.trim() || !eduardoImage?.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ ảnh cho cả hai thành viên (Shane và Eduardo)' },
        { status: 400 }
      );
    }

    // Fetch existing settings to clean up replaced or removed files
    const existingTranslations = await prisma.translation.findMany({
      where: {
        key: {
          in: ['AboutPage.profileLink', 'AboutPage.seeMoreLink'],
        },
      },
    });

    const oldProfileLink = existingTranslations.find(t => t.key === 'AboutPage.profileLink')?.value;
    const oldSeeMoreLink = existingTranslations.find(t => t.key === 'AboutPage.seeMoreLink')?.value;

    if (oldProfileLink && oldProfileLink !== profileLink && oldProfileLink.startsWith('/uploads/')) {
      const safeOldPath = join(process.cwd(), 'public', oldProfileLink.replace(/\.\./g, ''));
      try {
        await unlink(safeOldPath);
        console.log('Cleaned up orphaned profile file:', safeOldPath);
      } catch (err) {
        console.warn('Failed to clean up orphaned profile file:', safeOldPath, err);
      }
    }

    if (oldSeeMoreLink && oldSeeMoreLink !== seeMoreLink && oldSeeMoreLink.startsWith('/uploads/')) {
      const safeOldPath = join(process.cwd(), 'public', oldSeeMoreLink.replace(/\.\./g, ''));
      try {
        await unlink(safeOldPath);
        console.log('Cleaned up orphaned seeMore file:', safeOldPath);
      } catch (err) {
        console.warn('Failed to clean up orphaned seeMore file:', safeOldPath, err);
      }
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
        prisma.translation.upsert({
          where: {
            key_locale_namespace: {
              key: 'AboutPage.profileLink',
              locale,
              namespace: 'AboutPage',
            },
          },
          update: { value: profileLink || '' },
          create: { key: 'AboutPage.profileLink', locale, value: profileLink || '', namespace: 'AboutPage' },
        }),
        prisma.translation.upsert({
          where: {
            key_locale_namespace: {
              key: 'AboutPage.seeMoreLink',
              locale,
              namespace: 'AboutPage',
            },
          },
          update: { value: seeMoreLink || '' },
          create: { key: 'AboutPage.seeMoreLink', locale, value: seeMoreLink || '', namespace: 'AboutPage' },
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
      profileLink,
      seeMoreLink,
    });
  } catch (error) {
    console.error('Error saving about settings:', error);
    return NextResponse.json(
      { error: 'Failed to save about settings' },
      { status: 500 }
    );
  }
}
