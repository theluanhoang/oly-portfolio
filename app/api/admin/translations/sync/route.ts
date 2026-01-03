import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { invalidateCache } from '@/i18n/request';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

interface FlattenedItem {
  key: string;
  value: string;
  namespace?: string;
}

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
  namespace?: string
): FlattenedItem[] {
  const items: FlattenedItem[] = [];

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      items.push(...flattenMessages(v as Record<string, unknown>, fullKey, namespace || k));
    } else {
      items.push({
        key: fullKey,
        value: String(v),
        namespace: namespace || (prefix ? prefix.split('.')[0] : k),
      });
    }
  }

  return items;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const messagesDir = path.join(process.cwd(), 'messages');
    
    if (!fs.existsSync(messagesDir)) {
      return NextResponse.json(
        { error: 'Messages directory not found' },
        { status: 404 }
      );
    }

    const files = fs.readdirSync(messagesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return NextResponse.json(
        { error: 'No JSON files found in messages directory' },
        { status: 400 }
      );
    }

    const allTranslations: Array<{ key: string; locale: string; value: string; namespace: string | null }> = [];

    for (const file of jsonFiles) {
      const locale = file.replace('.json', '');
      const filePath = path.join(messagesDir, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const messages = JSON.parse(content) as Record<string, unknown>;
        const flatMessages = flattenMessages(messages);

        for (const { key, value, namespace } of flatMessages) {
          allTranslations.push({
            key,
            locale,
            value,
            namespace: namespace || null,
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[Sync] Error processing ${file}:`, error);
        }
      }
    }

    if (allTranslations.length === 0) {
      return NextResponse.json(
        { error: 'No translations found in JSON files' },
        { status: 400 }
      );
    }

    const syncedLocales = new Set<string>();

    await prisma.$transaction(async (tx) => {
      for (const { key, locale, value, namespace } of allTranslations) {
        syncedLocales.add(locale);
        await tx.translation.upsert({
          where: {
            key_locale_namespace: {
              key,
              locale,
              // @ts-expect-error - Prisma nullable compound key
              namespace: namespace,
            },
          },
          update: { value },
          create: { key, locale, value, namespace },
        });
      }
    });

    for (const locale of syncedLocales) {
      invalidateCache(locale);
    }
    invalidateCache();
    
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      synced: allTranslations.length,
      message: `Synced ${allTranslations.length} translations`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sync] Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to sync translations' },
      { status: 500 }
    );
  }
}
