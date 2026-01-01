import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink, readFile } from 'fs/promises';
import archiver from 'archiver';

function buildNestedStructure(translations: Array<{ key: string; locale: string; value: string }>) {
  const messages: Record<string, Record<string, unknown>> = {};

  for (const translation of translations) {
    const keys = translation.key.split('.');
    const { locale } = translation;

    if (!messages[locale]) {
      messages[locale] = {};
    }

    let current = messages[locale];
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = translation.value;
  }

  return messages;
}

function createZipArchive(messages: Record<string, Record<string, unknown>>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempDir = tmpdir();
    const zipPath = join(tempDir, `translations-${Date.now()}-${Math.random().toString(36).substring(7)}.zip`);
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    archive.pipe(output);

    for (const [locale, data] of Object.entries(messages)) {
      archive.append(JSON.stringify(data, null, 2), { name: `${locale}.json` });
    }

    archive.finalize();

    output.on('close', async () => {
      try {
        const zipBuffer = await readFile(zipPath);
        await unlink(zipPath);
        resolve(zipBuffer);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');

    const where: { locale?: string } = {};
    if (locale && locale !== 'all') {
      where.locale = locale;
    }

    const translations = await prisma.translation.findMany({
      where,
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
    });

    const messages = buildNestedStructure(translations);

    if (locale && locale !== 'all' && messages[locale]) {
      return NextResponse.json(messages[locale], {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${locale}.json"`,
        },
      });
    }

    const zipBuffer = await createZipArchive(messages);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="translations.zip"',
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Export] Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to export translations' },
      { status: 500 }
    );
  }
}
