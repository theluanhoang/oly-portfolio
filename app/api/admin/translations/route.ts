import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const namespace = searchParams.get('namespace');
    const search = searchParams.get('search')?.trim() || '';

    const where: {
      locale?: string;
      namespace?: string;
      OR?: Array<{ key?: { contains: string; mode: 'insensitive' }; value?: { contains: string; mode: 'insensitive' } }>;
    } = {};
    if (locale) where.locale = locale;
    if (namespace) where.namespace = namespace;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }

    const translations = await prisma.translation.findMany({
      where,
      orderBy: [
        { namespace: 'asc' },
        { key: 'asc' },
      ],
    });

    return NextResponse.json({ translations });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
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
    const { key, locale, value, namespace } = body;

    if (!key || !locale || value === undefined) {
      return NextResponse.json(
        { error: 'Key, locale, and value are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.translation.findUnique({
      where: {
        key_locale_namespace: {
          key,
          locale,
          namespace: namespace || null,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Translation already exists' },
        { status: 409 }
      );
    }

    const translation = await prisma.translation.create({
      data: {
        key,
        locale,
        value: String(value),
        namespace: namespace || null,
      },
    });

    return NextResponse.json({ translation }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating translation:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Translation already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create translation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { translations } = body;

    if (!Array.isArray(translations)) {
      return NextResponse.json(
        { error: 'Translations array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      translations.map(async (t: { id?: string; key: string; locale: string; value: string | number; namespace?: string | null }) => {
        const { id, key, locale, value, namespace } = t;
        
        if (id) {
          return prisma.translation.update({
            where: { id },
            data: {
              key,
              locale,
              value: String(value),
              namespace: namespace || null,
            },
          });
        } else {
          return prisma.translation.upsert({
            where: {
              key_locale_namespace: {
                key,
                locale,
                // @ts-expect-error - Prisma generated type for nullable compound key field
                namespace: namespace ?? null,
              },
            },
            update: {
              value: String(value),
            },
            create: {
              key,
              locale,
              value: String(value),
              namespace: namespace || null,
            },
          });
        }
      })
    );

    return NextResponse.json({ translations: results });
  } catch (error: unknown) {
    console.error('Error updating translations:', error);
    return NextResponse.json(
      { error: 'Failed to update translations' },
      { status: 500 }
    );
  }
}
