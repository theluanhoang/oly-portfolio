'use client';

interface LocaleTabsProps {
  locales: string[];
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
  translations: Record<string, { label: string }>;
  variant?: 'default' | 'inline';
}

export function LocaleTabs({ locales, currentLocale, onLocaleChange, translations, variant = 'default' }: LocaleTabsProps) {
  if (variant === 'inline') {
    return (
      <div className="flex gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => onLocaleChange(locale)}
            className={`px-4 py-2 text-sm font-medium tracking-[1px] uppercase transition-colors ${
              currentLocale === locale
                ? 'border-b-2 border-[#333] text-[#333]'
                : 'text-[#666] hover:text-[#333]'
            }`}
          >
            {translations[locale]?.label || locale.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="border-b border-[#e0e0e0] mb-6">
      <div className="flex gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => onLocaleChange(locale)}
            className={`px-4 py-2 text-sm font-medium tracking-[1px] uppercase transition-colors ${
              currentLocale === locale
                ? 'border-b-2 border-[#333] text-[#333]'
                : 'text-[#666] hover:text-[#333]'
            }`}
          >
            {translations[locale]?.label || locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

