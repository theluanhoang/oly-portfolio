'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Search, Save, ChevronRight, ChevronDown, Edit2, X, Upload, Download, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  namespace: string | null;
  createdAt: string;
  updatedAt: string;
}

const LOCALES = ['vi', 'en'] as const;
const SEARCH_DEBOUNCE_MS = 300;
const LOCALE_FLAGS: Record<string, string> = {
  vi: '🇻🇳',
  en: '🇬🇧',
};

function getLocaleFlag(locale: string): string {
  return LOCALE_FLAGS[locale.toLowerCase()] || locale.toUpperCase();
}

function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function AdminTranslationsPage() {
  const t = useTranslations('Admin.translations');
  const router = useRouter();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<string>('all');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const namespaces = useMemo(() => {
    const nsSet = new Set<string>();
    for (const t of translations) {
      if (t.namespace) nsSet.add(t.namespace);
    }
    return Array.from(nsSet).sort();
  }, [translations]);

  const loadTranslations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedLocale !== 'all') params.set('locale', selectedLocale);
      if (selectedNamespace !== 'all') params.set('namespace', selectedNamespace);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/translations?${params.toString()}`);
      if (!res.ok) throw new Error(t('error.fetchFailed'));
      
      const data = await res.json() as { translations?: Translation[] };
      setTranslations(data.translations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [selectedLocale, selectedNamespace, searchQuery, t]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (selectedLocale !== 'all') {
        params.set('locale', selectedLocale);
      }

      const res = await fetch(`/api/admin/translations/export?${params.toString()}`);
      if (!res.ok) throw new Error(t('error.exportFailed'));

      const blob = await res.blob();
      const filename = selectedLocale === 'all' ? 'translations.zip' : `${selectedLocale}.json`;
      downloadFile(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [selectedLocale, t]);

  const handleSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const res = await fetch('/api/admin/translations/sync', {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t('error.syncFailed'));
      }

      await loadTranslations();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  }, [loadTranslations, t, router]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/translations/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t('error.importFailed'));
      }

      await loadTranslations();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.importFailed'));
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [loadTranslations, t, router]);

  const handleEdit = useCallback((translation: Translation) => {
    setEditingId(translation.id);
    setEditingValue(translation.value);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const handleSave = useCallback(async (id: string) => {
    const previousValue = translations.find(t => t.id === id)?.value;
    
    setTranslations(prev => prev.map(t => 
      t.id === id ? { ...t, value: editingValue } : t
    ));
    setEditingId(null);
    setEditingValue('');
    
    try {
      setIsSaving(true);
      setError(null);
      
      const res = await fetch(`/api/admin/translations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editingValue }),
      });
      
      if (!res.ok) {
        setTranslations(prev => prev.map(t => 
          t.id === id && previousValue ? { ...t, value: previousValue } : t
        ));
        throw new Error(t('error.updateFailed'));
      }
      
      const data = await res.json() as { translation: Translation };
      setTranslations(prev => prev.map(t => 
        t.id === id ? data.translation : t
      ));
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  }, [editingValue, translations, t, router]);

  const toggleNamespace = useCallback((namespace: string) => {
    setExpandedNamespaces(prev => {
      const next = new Set(prev);
      if (next.has(namespace)) {
        next.delete(namespace);
      } else {
        next.add(namespace);
      }
      return next;
    });
  }, []);

  const groupedTranslations = useMemo(() => {
    const groups: Record<string, Translation[]> = {};
    for (const translation of translations) {
      const ns = translation.namespace || t('otherNamespace');
      if (!groups[ns]) groups[ns] = [];
      groups[ns].push(translation);
    }
    return groups;
  }, [translations, t]);

  // Auto-expand all namespaces when there's a search query and results
  useEffect(() => {
    if (searchQuery.trim() && translations.length > 0) {
      const namespacesToExpand = new Set<string>();
      for (const translation of translations) {
        const ns = translation.namespace || t('otherNamespace');
        namespacesToExpand.add(ns);
      }
      setExpandedNamespaces(namespacesToExpand);
    } else if (!searchQuery.trim()) {
      // When search is cleared, collapse all namespaces
      setExpandedNamespaces(new Set());
    }
  }, [searchQuery, translations, t]);

  return (
    <div className="bg-background text-foreground">
      <div className="space-y-4 sm:space-y-5 md:space-y-6 mt-4 sm:mt-6 md:mt-8 lg:mt-12 xl:mt-16 mb-4 sm:mb-6 md:mb-8 lg:mb-12 xl:mb-16">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-2xl font-semibold tracking-[1px] sm:tracking-[2px] uppercase text-[#333]">
              {t('title')}
            </h1>
            <p className="text-xs sm:text-sm md:text-sm text-[#666] mt-1">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <div className="flex items-center gap-2 bg-white border border-[#e0e0e0] rounded-full px-2 sm:px-3 md:px-3 py-1 shadow-sm focus-within:ring-1 focus-within:ring-[#333] flex-1 sm:flex-initial md:flex-initial min-w-0 sm:min-w-[140px] md:min-w-[180px]">
              <Search size={14} className="text-[#999] shrink-0" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs px-1 py-1 outline-none bg-transparent w-full"
              />
            </div>

            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
              className="px-2 sm:px-3 md:px-3 py-1.5 text-xs border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] uppercase tracking-[1px] focus:outline-none focus:ring-1 focus:ring-[#333]"
            >
              <option value="all">{t('allLocales')}</option>
              {LOCALES.map(locale => (
                <option key={locale} value={locale}>
                  {getLocaleFlag(locale)} {locale.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="px-2 sm:px-3 md:px-3 py-1.5 text-xs border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] uppercase tracking-[1px] focus:outline-none focus:ring-1 focus:ring-[#333]"
            >
              <option value="all">{t('allNamespaces')}</option>
              {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:gap-2 md:gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1 sm:gap-1 md:gap-2"
              aria-label={isSyncing ? t('syncing') : t('syncFromJson')}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isSyncing ? t('syncing') : t('syncFromJson')}</span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file-input"
              disabled={isImporting}
            />
            <label htmlFor="import-file-input" className="cursor-pointer" aria-label={isImporting ? t('importing') : t('importJson')}>
              <div className="flex items-center gap-1 sm:gap-1 md:gap-2 px-6 py-2 text-xs border-2 border-[#333] bg-white text-[#333] hover:bg-[#f5f5f5] transition-colors uppercase tracking-[2px] font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <Download size={16} className={isImporting ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">{isImporting ? t('importing') : t('importJson')}</span>
              </div>
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1 sm:gap-1 md:gap-2"
              aria-label={isExporting ? t('exporting') : t('exportJson')}
            >
              <Upload size={16} className={isExporting ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">{isExporting ? t('exporting') : t('exportJson')}</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#e0e0e0] p-8 text-center min-h-[calc(100vh-300px)] sm:min-h-[calc(100vh-280px)] md:min-h-[calc(100vh-250px)] flex items-center justify-center">
            <div className="text-[#666] text-sm">{t('loading')}</div>
          </div>
        ) : translations.length === 0 ? (
          <div className="bg-white border border-[#e0e0e0] p-8 text-center min-h-[calc(100vh-300px)] sm:min-h-[calc(100vh-280px)] md:min-h-[calc(100vh-250px)] flex flex-col items-center justify-center">
            <div className="text-[#666] text-sm mb-4">{t('noTranslations')}</div>
            <div className="flex gap-2 justify-center">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file-input-empty"
                disabled={isImporting}
              />
              <label htmlFor="import-file-input-empty" className="cursor-pointer" aria-label={t('importJson')}>
                <div className="flex items-center gap-1 px-6 py-2 text-xs border-2 border-[#333] bg-[#333] text-white hover:bg-black transition-colors uppercase tracking-[2px] font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  <Download size={16} />
                  <span>{t('importJson')}</span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#e0e0e0] min-h-[calc(100vh-300px)] sm:min-h-[calc(100vh-280px)] md:min-h-[calc(100vh-250px)] max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-250px)] overflow-y-auto">
            <div className="divide-y divide-[#e0e0e0]">
              {Object.entries(groupedTranslations).map(([namespace, items]) => (
                <div key={namespace}>
                  <button
                    onClick={() => toggleNamespace(namespace)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-[#f5f5f5] transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      {expandedNamespaces.has(namespace) ? (
                        <ChevronDown size={18} className="text-[#666] shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-[#666] shrink-0" />
                      )}
                      <span className="font-semibold text-[#333] text-sm sm:text-base uppercase tracking-[1px]">
                        {namespace}
                      </span>
                      <span className="text-xs sm:text-sm text-[#666]">({items.length})</span>
                    </div>
                  </button>

                  {expandedNamespaces.has(namespace) && (
                    <div className="px-4 sm:px-6 pb-4">
                      <div className="space-y-2 sm:space-y-3 pt-2">
                        {items.map((translation) => (
                          <div
                            key={translation.id}
                            className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-[#e0e0e0] hover:bg-[#f5f5f5] transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-mono text-[#333] break-all">
                                  {translation.key}
                                </span>
                                <span className="text-base sm:text-lg flex items-center">
                                  {getLocaleFlag(translation.locale)}
                                </span>
                              </div>
                              {editingId === translation.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#e0e0e0] focus:outline-none focus:ring-1 focus:ring-[#333] bg-white"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => handleSave(translation.id)}
                                      disabled={isSaving}
                                      className="flex items-center gap-1"
                                    >
                                      <Save size={14} />
                                      <span>{isSaving ? t('saving') : t('save')}</span>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                      className="flex items-center gap-1"
                                    >
                                      <X size={14} />
                                      <span>{t('cancel')}</span>
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs sm:text-sm text-[#666] whitespace-pre-wrap wrap-break-word">
                                  {translation.value}
                                </div>
                              )}
                            </div>
                            {editingId !== translation.id && (
                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <button
                                  onClick={() => handleEdit(translation)}
                                  className="p-1.5 sm:p-2 text-[#333] hover:bg-[#f5f5f5] transition-colors"
                                  title={t('edit')}
                                  aria-label={t('edit')}
                                >
                                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
