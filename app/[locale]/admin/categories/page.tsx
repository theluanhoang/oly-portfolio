'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Header } from '@/components/layout';

interface Category {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  translations: { locale: string; name: string }[];
  createdAt: string;
  updatedAt: string;
  subCategories?: SubCategory[];
}

interface SubCategory {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
}

interface CategoriesResponse {
  items: Category[];
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const t = useTranslations('Admin.categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/categories?includeSubCategories=true', {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = (await res.json()) as CategoriesResponse;
      setCategories(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      await loadCategories();
      setCategoryToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleFormSuccess = () => {
    loadCategories();
    handleFormClose();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header isFixed={true} />
      <div className="max-w-6xl mx-auto py-12 px-8 md:px-4 mt-20">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-normal tracking-[3px] uppercase text-[#333] md:text-2xl">
              {t('title')}
            </h1>
            <Button onClick={handleAddClick}>
              <Plus size={18} className="mr-2" />
              {t('add')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-none border-2 bg-red-50 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#666]">{t('loading')}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#666]">{t('empty')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-none border border-[#e0e0e0]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e0e0e0]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[1px] text-[#555]">
                      {t('table.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[1px] text-[#555]">
                      {t('table.slug')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[1px] text-[#555]">
                      {t('table.displayOrder')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[1px] text-[#555]">
                      {t('table.subCategories')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[1px] text-[#555]">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-[#e0e0e0] hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-[#333]">
                        {category.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#666]">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#666]">
                        {category.displayOrder}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#666]">
                        {((category as Category & { subCategories?: SubCategory[] }).subCategories?.length || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/categories/${category.id}/subcategories`)}
                            className="p-2 text-[#666] hover:text-[#333] transition-colors"
                            title={t('table.viewSubCategories')}
                          >
                            <ArrowUpDown size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClick(category)}
                            className="p-2 text-[#666] hover:text-[#333] transition-colors"
                            title={t('table.edit')}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(category)}
                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            title={t('table.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 md:p-4">
            <div className="bg-white border border-[#e0e0e0] w-full max-w-md shadow-lg">
              <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-b border-[#e0e0e0]">
                <h2 className="text-sm sm:text-base md:text-base font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase text-[#333]">
                  {t('delete.title')}
                </h2>
              </div>
              <div className="px-4 sm:px-6 md:px-6 py-4 sm:py-5 md:py-5">
                <p className="text-sm text-[#666]">
                  {t('delete.message', { name: categoryToDelete.name })}
                </p>
              </div>
              <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-t border-[#e0e0e0] flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  {t('delete.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? t('delete.deleting') : t('delete.confirm')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isFormOpen && (
          <CategoryForm
            category={editingCategory}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
}

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CategoryForm({ category, onClose, onSuccess }: CategoryFormProps) {
  const t = useTranslations('Admin.categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: category?.slug || '',
    displayOrder: category?.displayOrder || 0,
    translations: {
      vi: { name: category?.translations.find(t => t.locale === 'vi')?.name || '' },
      en: { name: category?.translations.find(t => t.locale === 'en')?.name || '' },
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = category
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';
      const method = category ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save category');
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 md:p-4">
      <div className="bg-white border border-[#e0e0e0] w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-b border-[#e0e0e0] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-sm sm:text-base md:text-base font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase text-[#333]">
            {category ? t('edit.title') : t('add')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#666] hover:text-[#333] transition-colors p-1"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 md:px-6 py-4 sm:py-5 md:py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-none border-2 bg-red-50 border-red-500 text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
              {t('form.slug')} *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
              required
              disabled={!!category}
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
              {t('form.displayOrder')}
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
              {t('form.nameVi')} *
            </label>
            <input
              type="text"
              value={formData.translations.vi.name}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, vi: { name: e.target.value } }
              })}
              className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
              {t('form.nameEn')} *
            </label>
            <input
              type="text"
              value={formData.translations.en.name}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, en: { name: e.target.value } }
              })}
              className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-[#e0e0e0]">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              {t('form.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('form.saving') : t('form.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

