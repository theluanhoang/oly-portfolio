import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invalidateCache } from '@/i18n/request';
import { revalidatePath } from 'next/cache';

interface FlattenedTranslation {
  key: string;
  value: string;
  namespace?: string;
  locale: string;
}

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
  namespace?: string,
  currentLocale?: string,
  isMultiLocale = false
): FlattenedTranslation[] {
  const items: FlattenedTranslation[] = [];

  for (const [k, v] of Object.entries(obj)) {
    if (isMultiLocale && (k === 'vi' || k === 'en') && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      items.push(...flattenMessages(v as Record<string, unknown>, '', undefined, k, false));
      continue;
    }

    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      items.push(...flattenMessages(
        v as Record<string, unknown>,
        fullKey,
        namespace || k,
        currentLocale,
        false
      ));
    } else {
      items.push({
        key: fullKey,
        value: String(v),
        namespace: namespace || (prefix ? prefix.split('.')[0] : k),
        locale: currentLocale || '',
      });
    }
  }

  return items;
}

function detectMultiLocale(messages: Record<string, unknown>): boolean {
  const keys = Object.keys(messages);
  return keys.length > 0 && 
    keys.every(key => typeof messages[key] === 'object' && messages[key] !== null && !Array.isArray(messages[key])) &&
    (keys.includes('vi') || keys.includes('en'));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    let messages: Record<string, unknown>;

    try {
      messages = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const defaultLocale = fileName.replace('.json', '');
    const isMultiLocale = detectMultiLocale(messages);

    const flatMessages = flattenMessages(messages, '', undefined, defaultLocale, isMultiLocale);

    if (flatMessages.length === 0) {
      return NextResponse.json({ error: 'No translations found in file' }, { status: 400 });
    }

    const localesToImport = new Set(flatMessages.map(m => m.locale).filter(Boolean));

    if (localesToImport.size === 0) {
      return NextResponse.json({ error: 'No valid locales found' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.translation.deleteMany({
        where: { locale: { in: Array.from(localesToImport) } },
      });

      await tx.translation.createMany({
        data: flatMessages.map(({ key, value, namespace, locale }) => ({
          key,
          locale,
          value,
          namespace: namespace || null,
        })),
        skipDuplicates: true,
      });
    });

    for (const locale of localesToImport) {
      invalidateCache(locale);
    }
    invalidateCache(); // Invalidate all locales to ensure consistency
    
    // Revalidate all pages that might use translations
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      imported: flatMessages.length,
      message: `Imported ${flatMessages.length} translations`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Import] Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to import translations' },
      { status: 500 }
    );
  }
}
