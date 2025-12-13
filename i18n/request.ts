import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  let messages;
  switch (locale) {
    case 'vi':
      messages = (await import('@/messages/vi.json')).default;
      break;
    case 'en':
    default:
      messages = (await import('@/messages/en.json')).default;
      break;
  }

  return {
    locale,
    messages
  };
});

