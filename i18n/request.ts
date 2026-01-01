import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const CACHE_TTL = process.env.NODE_ENV === 'development' ? 0 : 5000;
const messagesCache = new Map<string, Record<string, unknown>>();
const cacheTimestamps = new Map<string, number>();

export function invalidateCache(locale?: string): void {
  if (locale) {
    const cacheKey = `messages_${locale}`;
    messagesCache.delete(cacheKey);
    cacheTimestamps.delete(cacheKey);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[i18n] Cache invalidated for locale: ${locale}`);
    }
  } else {
    messagesCache.clear();
    cacheTimestamps.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('[i18n] All cache invalidated');
    }
  }
}

function unflattenTranslations(
  translations: Array<{ key: string; value: string }>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const { key, value } of translations) {
    const keys = key.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object' || current[k] === null || Array.isArray(current[k])) {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }

  return result;
}

async function loadMessagesFromDatabase(locale: string): Promise<Record<string, unknown>> {
  const cacheKey = `messages_${locale}`;
  const now = Date.now();
  
  if (CACHE_TTL > 0) {
    const cached = messagesCache.get(cacheKey);
    const cacheTime = cacheTimestamps.get(cacheKey);

    if (cached && cacheTime && (now - cacheTime) < CACHE_TTL) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[i18n] Using cached messages for locale: ${locale}`);
      }
      return cached;
    }
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[i18n] Loading fresh messages from database for locale: ${locale}`);
    }
    
    const { prisma } = await import('@/lib/prisma');
    
    const translations = await prisma.translation.findMany({
      where: { locale },
      select: { key: true, value: true },
      orderBy: { key: 'asc' },
    });

    const messages = unflattenTranslations(translations);

    if (CACHE_TTL > 0) {
      messagesCache.set(cacheKey, messages);
      cacheTimestamps.set(cacheKey, now);
    } else {
      messagesCache.delete(cacheKey);
      cacheTimestamps.delete(cacheKey);
    }

    return messages;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[i18n] Failed to load translations for ${locale}:`, error);
    }

    try {
      const fallbackMessages = locale === 'vi' 
        ? (await import('@/messages/vi.json')).default
        : (await import('@/messages/en.json')).default;
      return fallbackMessages;
    } catch {
      return {};
    }
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const messages = await loadMessagesFromDatabase(locale);

  return { locale, messages };
});
