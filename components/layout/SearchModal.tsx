'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { X, Search as SearchIcon } from 'lucide-react';

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  type?: string;
  location: string;
  heroImage: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('Navigation');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchProjects = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const response = await fetch(`/api/projects?q=${encodeURIComponent(searchQuery.trim().toLowerCase())}&locale=${locale}&pageSize=10`);
        if (!response.ok) throw new Error('Failed to search');
        const data = await response.json();
        setResults(data.items || []);
      } catch (error) {
        console.error('Error searching projects:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchProjects, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, locale]);

  const handleProjectClick = (slug: string) => {
    router.push(`/projects/${slug}`);
    onClose();
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-[#e0e0e0]">
          <SearchIcon size={20} className="text-[#666]" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search')}
            className="flex-1 outline-none text-sm"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-[#666]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-[#666] text-sm">
              Đang tìm kiếm...
            </div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <div className="p-2">
                {results.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectClick(project.slug)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                  >
                    {project.heroImage && (
                      <img
                        src={project.heroImage}
                        alt={project.title}
                        className="w-16 h-16 object-cover rounded border border-[#e0e0e0]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-black truncate">
                        {project.title}
                      </div>
                      <div className="text-xs text-[#666] mt-1">
                        {project.category} {project.type ? `• ${project.type}` : ''} • {project.location}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#666] text-sm">
                Không tìm thấy kết quả nào
              </div>
            )
          ) : (
            <div className="p-8 text-center text-[#666] text-sm">
              Nhập từ khóa để tìm kiếm dự án
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
