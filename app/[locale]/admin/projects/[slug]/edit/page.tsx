'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import dynamicImport from 'next/dynamic';
import GalleryUpload from '@/components/admin/GalleryUpload';

const TiptapEditor = dynamicImport(
  () => import('@/components/admin/TiptapEditor'),
  {
    loading: DefaultLoading,
    ssr: false,
  }
);
import { LocaleTabs } from '@/components/admin/LocaleTabs';
import FormField from '@/components/forms/FormField';
import { Header, StepIndicator } from '@/components/layout';
import { Button, ConfirmDialog } from '@/components/ui';
import { useGalleryUpload } from '@/hooks/useGalleryUpload';
import { projectSchema, ProjectSchema, ProjectTranslationSchema } from '@/lib/validations/projectSchema';
import type { ProjectTranslation } from '@/types/project';
import { generateSlug } from '@/lib/utils';
import { DefaultLoading } from '@/lib/performance/dynamic-imports';

const LOCALES = ['vi', 'en'];
const LOCALE_LABELS: Record<string, { label: string }> = {
  vi: { label: 'Tiếng Việt' },
  en: { label: 'English' },
};

interface Category {
  id: string;
  slug: string;
  name: string;
  translations?: { locale: string; name: string }[];
  subCategories?: SubCategory[];
}

interface SubCategory {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  translations?: { locale: string; name: string }[];
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const t = useTranslations('Admin.projects');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLocale, setCurrentLocale] = useState('vi');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [translationModal, setTranslationModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    initialName: string;
    itemId?: string;
  } | null>(null);
  const [modalTranslations, setModalTranslations] = useState({ vi: '', en: '' });
  const [categoryInput, setCategoryInput] = useState('');
  const [subCategoryInput, setSubCategoryInput] = useState('');
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [subCategoryPopoverOpen, setSubCategoryPopoverOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubCategory, setIsCreatingSubCategory] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isUpdatingSubCategory, setIsUpdatingSubCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isDeletingSubCategory, setIsDeletingSubCategory] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'category' | 'subcategory';
    itemId: string;
    itemName: string;
  } | null>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const subCategoryInputRef = useRef<HTMLInputElement>(null);

  const methods = useForm<ProjectSchema>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      slug: '',
      gallery: [],
      categoryId: null,
      subCategoryId: null,
      translations: {
        vi: {
          title: '',
          location: '',
          area: '',
          year: '',
          content: '',
        },
        en: {
          title: '',
      location: '',
      area: '',
      year: '',
      content: '',
        },
      },
    },
    mode: 'onChange',
  });

  const { handleSubmit, trigger, setValue, watch, formState: { errors }, reset } = methods;
  const translations = watch('translations');
  const currentTranslation = translations[currentLocale] || translations.vi || translations.en;
  const viContent = translations?.vi?.content || '';
  const enContent = translations?.en?.content || '';
  const selectedCategoryId = watch('categoryId');
  const selectedSubCategoryId = watch('subCategoryId');
  
  // Check which tabs have content
  const hasViContent = viContent.trim().length > 0;
  const hasEnContent = enContent.trim().length > 0;
  const hasBothContent = hasViContent && hasEnContent;
  const hasNoContent = !hasViContent && !hasEnContent;
  const missingContentTab = !hasViContent ? 'vi' : !hasEnContent ? 'en' : null;

  // Load categories and subcategories with all translations
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        // Load with current locale for display, but we'll get full translations from API
        const res = await fetch(`/api/admin/categories?includeSubCategories=true&locale=${currentLocale}`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.items || []);
        
        // Flatten subcategories
        const allSubCategories: SubCategory[] = [];
        (data.items || []).forEach((cat: Category) => {
          if (cat.subCategories) {
            allSubCategories.push(...cat.subCategories);
          }
        });
        setSubCategories(allSubCategories);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [currentLocale]);

  // Reset subcategory selection when category changes (không thay đổi danh sách subCategories đã flatten)
  useEffect(() => {
    setSubCategoryInput('');
    setValue('subCategoryId', null);
  }, [selectedCategoryId, setValue]);

  const reloadCategories = useCallback(async () => {
    try {
      const reloadRes = await fetch(`/api/admin/categories?includeSubCategories=true&locale=${currentLocale}`);
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setCategories(reloadData.items || []);
        const allSubCategories: SubCategory[] = [];
        (reloadData.items || []).forEach((cat: Category) => {
          if (cat.subCategories) {
            allSubCategories.push(...cat.subCategories);
          }
        });
        setSubCategories(allSubCategories);
      }
    } catch (err) {
      console.error('Error reloading categories:', err);
    }
  }, [currentLocale]);

  const availableSubCategories = useMemo(() => {
    return selectedCategoryId
      ? subCategories.filter(sc => sc.categoryId === selectedCategoryId)
      : [];
  }, [selectedCategoryId, subCategories]);

  const getCategoryName = useCallback((cat: Category, locale: string): string => {
    if (cat.translations) {
      const trans = cat.translations.find(t => t.locale === locale)
        || cat.translations.find(t => t.locale === 'vi')
        || cat.translations.find(t => t.locale === 'en')
        || cat.translations[0];
      return trans?.name || cat.name;
    }
    return cat.name;
  }, []);

  const getSubCategoryName = useCallback((sub: SubCategory, locale: string): string => {
    if (sub.translations) {
      const trans = sub.translations.find(t => t.locale === locale)
        || sub.translations.find(t => t.locale === 'vi')
        || sub.translations.find(t => t.locale === 'en')
        || sub.translations[0];
      return trans?.name || sub.name;
    }
    return sub.name;
  }, []);

  // Update category/subcategory input when locale changes
  useEffect(() => {
    if (selectedCategoryId) {
      const cat = categories.find(c => c.id === selectedCategoryId);
      if (cat) {
        setCategoryInput(getCategoryName(cat, currentLocale));
      }
    }
    if (selectedSubCategoryId) {
      const sub = subCategories.find(s => s.id === selectedSubCategoryId);
      if (sub) {
        setSubCategoryInput(getSubCategoryName(sub, currentLocale));
      }
    }
  }, [currentLocale, selectedCategoryId, selectedSubCategoryId, categories, subCategories, getCategoryName, getSubCategoryName]);

  const filteredCategories = useMemo(() => {
    const searchTerm = categoryInput.trim().toLowerCase();
    if (!searchTerm) return categories;
    return categories.filter((cat) => {
      const name = getCategoryName(cat, currentLocale);
      return name.toLowerCase().includes(searchTerm);
    });
  }, [categories, categoryInput, currentLocale, getCategoryName]);

  const filteredSubCategories = useMemo(() => {
    const searchTerm = subCategoryInput.trim().toLowerCase();
    if (!searchTerm) return availableSubCategories;
    return availableSubCategories.filter((sub) => {
      const name = getSubCategoryName(sub, currentLocale);
      return name.toLowerCase().includes(searchTerm);
    });
  }, [availableSubCategories, subCategoryInput, currentLocale, getSubCategoryName]);

  const handleAddCategory = () => {
    const name = categoryInput.trim();
    if (!name) return;
    const existing = categories.find((c) => {
      const catName = getCategoryName(c, currentLocale);
      return catName.toLowerCase() === name.toLowerCase();
    });
    if (existing) {
      setValue('categoryId', existing.id, { shouldValidate: true });
      return;
    }
    setModalTranslations({ vi: name, en: name });
    setTranslationModal({ isOpen: true, type: 'category', initialName: name });
  };

  const handleCreateCategory = async () => {
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('category.nameRequired') });
      return;
    }
    try {
      setIsCreatingCategory(true);
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: generateSlug(modalTranslations.vi.trim()),
          translations: {
            vi: { name: modalTranslations.vi.trim() },
            en: { name: modalTranslations.en.trim() },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.id) {
        throw new Error(json.error || 'Failed to create category');
      }
      
      // Reload categories to get full data including subcategories
      await reloadCategories();
      
      setValue('categoryId', json.id, { shouldValidate: true });
      // Set input to current locale translation
      const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
      setCategoryInput(displayName);
      setValue('subCategoryId', null, { shouldValidate: true });
      setSubCategoryInput('');
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create category' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleAddSubCategory = () => {
    const name = subCategoryInput.trim();
    if (!name) return;
    const catId = selectedCategoryId;
    if (!catId) {
      setSaveMessage({ type: 'error', text: t('category.selectCategoryFirst') });
      return;
    }
    const existing = availableSubCategories.find(
      (s) => {
        const subName = getSubCategoryName(s, currentLocale);
        return subName.toLowerCase() === name.toLowerCase() && s.categoryId === catId;
      }
    );
    if (existing) {
      setValue('subCategoryId', existing.id, { shouldValidate: true });
      return;
    }
    setModalTranslations({ vi: name, en: name });
    setTranslationModal({ isOpen: true, type: 'subcategory', initialName: name });
  };

  const handleCreateSubCategory = async () => {
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('category.nameRequired') });
      return;
    }
    const catId = selectedCategoryId;
    if (!catId) {
      setSaveMessage({ type: 'error', text: t('category.selectCategoryFirst') });
      return;
    }
    try {
      setIsCreatingSubCategory(true);
      const res = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: catId,
          slug: generateSlug(modalTranslations.vi.trim()),
          translations: {
            vi: { name: modalTranslations.vi.trim() },
            en: { name: modalTranslations.en.trim() },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.id) {
        throw new Error(json.error || 'Failed to create subcategory');
      }
      
      // Reload categories to get updated subcategories
      await reloadCategories();
      
      setValue('subCategoryId', json.id, { shouldValidate: true });
      const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
      setSubCategoryInput(displayName);
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create subcategory' });
    } finally {
      setIsCreatingSubCategory(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!translationModal?.itemId) return;
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('category.nameRequired') });
      return;
    }
    try {
      setIsUpdatingCategory(true);
      const res = await fetch(`/api/admin/categories/${translationModal.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: generateSlug(modalTranslations.vi.trim()),
          translations: {
            vi: { name: modalTranslations.vi.trim() },
            en: { name: modalTranslations.en.trim() },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update category');
      }
      
      const reloadRes = await fetch(`/api/admin/categories?includeSubCategories=true&locale=${currentLocale}`);
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setCategories(reloadData.items || []);
        const allSubCategories: SubCategory[] = [];
        (reloadData.items || []).forEach((cat: Category) => {
          if (cat.subCategories) {
            allSubCategories.push(...cat.subCategories);
          }
        });
        setSubCategories(allSubCategories);
      }
      
      if (selectedCategoryId === translationModal.itemId) {
        const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
        setCategoryInput(displayName);
      }
      
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
      setSaveMessage({ type: 'success', text: t('category.updateSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update category' });
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!translationModal?.itemId) return;
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('category.nameRequired') });
      return;
    }
    const catId = selectedCategoryId;
    if (!catId) {
      setSaveMessage({ type: 'error', text: t('category.selectCategoryBeforeUpdate') });
      return;
    }
    try {
      setIsUpdatingSubCategory(true);
      const res = await fetch(`/api/admin/subcategories/${translationModal.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: catId,
          slug: generateSlug(modalTranslations.vi.trim()),
          translations: {
            vi: { name: modalTranslations.vi.trim() },
            en: { name: modalTranslations.en.trim() },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update subcategory');
      }
      
      const reloadRes = await fetch(`/api/admin/categories?includeSubCategories=true&locale=${currentLocale}`);
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setCategories(reloadData.items || []);
        const allSubCategories: SubCategory[] = [];
        (reloadData.items || []).forEach((cat: Category) => {
          if (cat.subCategories) {
            allSubCategories.push(...cat.subCategories);
          }
        });
        setSubCategories(allSubCategories);
      }
      
      if (selectedSubCategoryId === translationModal.itemId) {
        const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
        setSubCategoryInput(displayName);
      }
      
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
      setSaveMessage({ type: 'success', text: t('category.updateSubSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update subcategory' });
    } finally {
      setIsUpdatingSubCategory(false);
    }
  };

  const handleDeleteCategory = useCallback((categoryId: string, categoryName: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: 'category',
      itemId: categoryId,
      itemName: categoryName,
    });
  }, []);

  const handleDeleteSubCategory = useCallback((subCategoryId: string, subCategoryName: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: 'subcategory',
      itemId: subCategoryId,
      itemName: subCategoryName,
    });
  }, []);

  const performDeleteCategory = useCallback(async (categoryId: string) => {
    try {
      setIsDeletingCategory(true);
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete category');
      }
      
      await reloadCategories();
      
      if (selectedCategoryId === categoryId) {
        setCategoryInput('');
        setValue('categoryId', null, { shouldValidate: true });
        setSubCategoryInput('');
        setValue('subCategoryId', null, { shouldValidate: true });
      }
      
      setSaveMessage({ type: 'success', text: t('category.deleteSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete category' });
    } finally {
      setIsDeletingCategory(false);
      setDeleteConfirmDialog(null);
    }
  }, [selectedCategoryId, reloadCategories, setValue, t]);

  const performDeleteSubCategory = useCallback(async (subCategoryId: string) => {
    try {
      setIsDeletingSubCategory(true);
      const res = await fetch(`/api/admin/subcategories/${subCategoryId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete subcategory');
      }
      
      await reloadCategories();
      
      if (selectedSubCategoryId === subCategoryId) {
        setSubCategoryInput('');
        setValue('subCategoryId', null, { shouldValidate: true });
      }
      
      setSaveMessage({ type: 'success', text: t('category.deleteSubSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete subcategory' });
    } finally {
      setIsDeletingSubCategory(false);
      setDeleteConfirmDialog(null);
    }
  }, [selectedSubCategoryId, reloadCategories, setValue, t]);

  const handleEditCategory = useCallback((cat: Category) => {
    const viTrans = cat.translations?.find(t => t.locale === 'vi')?.name || cat.name;
    const enTrans = cat.translations?.find(t => t.locale === 'en')?.name || cat.name;
    setModalTranslations({ vi: viTrans, en: enTrans });
    setTranslationModal({ isOpen: true, type: 'category', initialName: getCategoryName(cat, currentLocale), itemId: cat.id });
  }, [currentLocale, getCategoryName]);

  const handleEditSubCategory = useCallback((subCat: SubCategory) => {
    const viTrans = subCat.translations?.find(t => t.locale === 'vi')?.name || subCat.name;
    const enTrans = subCat.translations?.find(t => t.locale === 'en')?.name || subCat.name;
    setModalTranslations({ vi: viTrans, en: enTrans });
    setTranslationModal({ isOpen: true, type: 'subcategory', initialName: getSubCategoryName(subCat, currentLocale), itemId: subCat.id });
  }, [currentLocale, getSubCategoryName]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmDialog) return;
    if (deleteConfirmDialog.type === 'category') {
      performDeleteCategory(deleteConfirmDialog.itemId);
    } else {
      performDeleteSubCategory(deleteConfirmDialog.itemId);
    }
  }, [deleteConfirmDialog, performDeleteCategory, performDeleteSubCategory]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmDialog(null);
  }, []);

  // Memoize dialog title and message
  const deleteDialogTitle = useMemo(() => {
    if (!deleteConfirmDialog) return '';
    return deleteConfirmDialog.type === 'category' ? t('category.delete') : t('category.deleteSub');
  }, [deleteConfirmDialog, t]);

  const deleteDialogMessage = useMemo(() => {
    if (!deleteConfirmDialog) return '';
    return deleteConfirmDialog.type === 'category'
      ? t('category.deleteConfirm', { name: deleteConfirmDialog.itemName })
      : t('category.deleteSubConfirm', { name: deleteConfirmDialog.itemName });
  }, [deleteConfirmDialog, t]);

  const gallery = useGalleryUpload({
    onUploadSuccess: (urls) => {
      const currentGallery = watch('gallery') || [];
      setValue('gallery', [...currentGallery, ...urls], { shouldValidate: true });
    },
    onError: (error) => {
      setSaveMessage({ type: 'error', text: error });
    },
    onReorder: (urls) => {
      setValue('gallery', urls, { shouldValidate: true });
    },
    projectSlug: slug || watch('slug') || null,
  });

  useEffect(() => {
    async function loadProject() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const project = await response.json();
        
        const heroImageIndex = project.gallery && project.gallery.length > 0
          ? project.gallery.findIndex((url: string) => url === project.heroImage)
          : -1;

        const translationsData: Record<string, ProjectTranslationSchema> = {};
        
        if (project.translations && Array.isArray(project.translations)) {
          project.translations.forEach((trans: ProjectTranslation) => {
            translationsData[trans.locale] = {
              title: trans.title || '',
              location: trans.location || '',
              area: trans.area || '',
              year: trans.year || '',
              content: trans.content || '',
            };
          });
        } else {
          translationsData.vi = {
          title: project.title || '',
          location: project.location || '',
          area: project.area || '',
          year: project.year || '',
            content: project.content || '',
          };
          translationsData.en = {
            title: '',
            location: '',
            area: '',
            year: '',
            content: '',
          };
        }

        reset({
          slug: project.slug || '',
          gallery: project.gallery || [],
          categoryId: project.categoryId || null,
          subCategoryId: project.subCategoryId || null,
          translations: translationsData,
        });

        const categoryName =
          project.category?.translations?.find((t: { locale: string; name: string }) => t.locale === currentLocale)?.name ||
          project.category?.translations?.find((t: { locale: string; name: string }) => t.locale === 'vi')?.name ||
          project.category?.translations?.[0]?.name ||
          '';
        const subCategoryName =
          project.subCategory?.translations?.find((t: { locale: string; name: string }) => t.locale === currentLocale)?.name ||
          project.subCategory?.translations?.find((t: { locale: string; name: string }) => t.locale === 'vi')?.name ||
          project.subCategory?.translations?.[0]?.name ||
          '';
        setCategoryInput(categoryName);
        setSubCategoryInput(subCategoryName);

        gallery.setGalleryUrls(project.gallery || []);
        gallery.setHeroImageIndex(heroImageIndex >= 0 ? heroImageIndex : 0);
      } catch (error) {
        console.error('Error loading project:', error);
        setSaveMessage({ type: 'error', text: t('edit.error') });
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, reset, t]);

  useEffect(() => {
    if (currentStep === 2) {
      setCurrentLocale('vi');
    }
  }, [currentStep]);

  const scrollToFormTop = () => {
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const slugValid = await trigger('slug');
      const galleryValid = await trigger('gallery');
      const viFieldsValid = await trigger([
        'translations.vi.title' as keyof ProjectSchema,
        'translations.vi.location' as keyof ProjectSchema,
        'translations.vi.area' as keyof ProjectSchema,
        'translations.vi.year' as keyof ProjectSchema,
      ]);
      const enFieldsValid = await trigger([
        'translations.en.title' as keyof ProjectSchema,
        'translations.en.location' as keyof ProjectSchema,
        'translations.en.area' as keyof ProjectSchema,
        'translations.en.year' as keyof ProjectSchema,
      ]);
      
      const isValid = slugValid && galleryValid && viFieldsValid && enFieldsValid;
      
      if (isValid) {
        setCurrentStep(2);
      } else {
        const viHasError = errors.translations?.vi;
        const enHasError = errors.translations?.en;
        
        if (enHasError && !viHasError) {
          setCurrentLocale('en');
        } else if (viHasError) {
          setCurrentLocale('vi');
        }

        scrollToFormTop();
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleStep2Next = () => {
    if (missingContentTab) {
      // Switch to the tab that's missing content
      setCurrentLocale(missingContentTab);
      scrollToFormTop();
    }
  };

  const updateTranslation = (locale: string, field: string, value: string) => {
    const currentTranslations = watch('translations') || {};
    const localeTranslation = currentTranslations[locale] || {};
    setValue('translations', {
      ...currentTranslations,
      [locale]: {
        ...localeTranslation,
        [field]: value,
      },
    }, { shouldValidate: true });
  };

  const handleCopyContent = () => {
    const currentTranslations = watch('translations') || {};
    const sourceLocale = currentLocale === 'vi' ? 'en' : 'vi';
    const sourceContent = currentTranslations[sourceLocale]?.content || '';
    
    if (!sourceContent.trim()) {
      setSaveMessage({ type: 'error', text: `Không có nội dung để copy từ tab ${LOCALE_LABELS[sourceLocale].label}` });
      return;
    }

    updateTranslation(currentLocale, 'content', sourceContent);
    setSaveMessage({ type: 'success', text: `Đã copy nội dung từ tab ${LOCALE_LABELS[sourceLocale].label}` });
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const onSubmit = async (data: ProjectSchema) => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const galleryUrlStrings = gallery.getGalleryUrlStrings();
      let finalCategoryId = data.categoryId || null;
      let finalSubCategoryId = data.subCategoryId || null;

      const normalizedCategories = categories || [];
      const normalizedSubCategories = subCategories || [];

      if (!finalCategoryId && categoryInput.trim()) {
        const existingCat = normalizedCategories.find(c => c.name.toLowerCase() === categoryInput.trim().toLowerCase());
        if (existingCat) {
          finalCategoryId = existingCat.id;
        } else {
          const newCatRes = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: generateSlug(categoryInput.trim()),
              translations: {
                vi: { name: categoryInput.trim() },
                en: { name: categoryInput.trim() },
              },
            }),
          });
          const newCatJson = await newCatRes.json();
          if (!newCatRes.ok || !newCatJson.id) {
            throw new Error(newCatJson.error || 'Failed to create category');
          }
          finalCategoryId = newCatJson.id;
        }
      }

      if (!finalSubCategoryId && subCategoryInput.trim()) {
        if (!finalCategoryId) {
          throw new Error('Please select or create a category before adding subcategory');
        }
        const existingSub = normalizedSubCategories.find(
          sc => sc.categoryId === finalCategoryId && sc.name.toLowerCase() === subCategoryInput.trim().toLowerCase()
        );
        if (existingSub) {
          finalSubCategoryId = existingSub.id;
        } else {
          const newSubRes = await fetch('/api/admin/subcategories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: finalCategoryId,
              slug: generateSlug(subCategoryInput.trim()),
              translations: {
                vi: { name: subCategoryInput.trim() },
                en: { name: subCategoryInput.trim() },
              },
            }),
          });
          const newSubJson = await newSubRes.json();
          if (!newSubRes.ok || !newSubJson.id) {
            throw new Error(newSubJson.error || 'Failed to create subcategory');
          }
          finalSubCategoryId = newSubJson.id;
        }
      }

      const projectData = {
        slug: data.slug,
        heroImage: galleryUrlStrings.length > 0 && gallery.heroImageIndex < galleryUrlStrings.length 
          ? galleryUrlStrings[gallery.heroImageIndex] 
          : (galleryUrlStrings.length > 0 ? galleryUrlStrings[0] : ''),
        gallery: galleryUrlStrings,
        categoryId: finalCategoryId,
        subCategoryId: finalSubCategoryId,
        translations: data.translations,
      };
      
      const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}. ${text.substring(0, 200)}`);
      }
      
      if (!response.ok) {
        const errorMessage = result.error || t('edit.error');
        const errorDetails = result.details ? `\nDetails: ${JSON.stringify(result.details, null, 2)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      setSaveMessage({ type: 'success', text: t('edit.success') });
      
      setTimeout(() => {
        router.push('/admin/projects');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating project:', error);
      const errorMessage = error instanceof Error ? error.message : t('edit.error');
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666]">{t('edit.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header isFixed={true} />

      <div className="max-w-5xl mx-auto py-12 px-8 md:px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-normal tracking-[3px] uppercase text-[#333] md:text-2xl">
              {t('edit.title')}
            </h1>
            <div className="flex items-center gap-4">
              {currentStep === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyContent}
                  title={`Copy nội dung từ tab ${currentLocale === 'vi' ? 'English' : 'Tiếng Việt'}`}
                >
                  Copy từ {currentLocale === 'vi' ? 'EN' : 'VI'}
                </Button>
              )}
              <LocaleTabs
                locales={LOCALES}
                currentLocale={currentLocale}
                onLocaleChange={setCurrentLocale}
                translations={LOCALE_LABELS}
                variant="inline"
              />
            </div>
          </div>
          <p className="text-sm text-[#666] tracking-[1px] uppercase">
            {`${t('new.step')} ${currentStep} ${t('new.of')} 2`}
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={2} />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-none border border-[#e0e0e0] p-8 md:p-6 space-y-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-normal tracking-[2px] uppercase text-[#333] mb-6 border-b border-[#e0e0e0] pb-2">
                    {t('new.projectInfo')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" key={currentLocale}>
                    <div className="md:col-span-2">
                      <FormField
                        key={`title-${currentLocale}`}
                        name={`translations.${currentLocale}.title`}
                        label={`${t('fields.title')} (${LOCALE_LABELS[currentLocale].label})`}
                        placeholder="NARROW HOUSE"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        name="slug"
                        label={t('fields.slug')}
                        placeholder="narrow-house"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat">
                        {t('fields.category')} <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={categoryInputRef}
                          value={categoryInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCategoryInput(val);
                            const match = categories.find(c => {
                              const name = getCategoryName(c, currentLocale);
                              return name.toLowerCase() === val.trim().toLowerCase();
                            });
                            setValue('categoryId', match ? match.id : null, { shouldValidate: true });
                            setSubCategoryInput('');
                            setValue('subCategoryId', null, { shouldValidate: true });
                            setCategoryPopoverOpen(true);
                          }}
                          onFocus={() => setCategoryPopoverOpen(true)}
                          onBlur={() => setTimeout(() => setCategoryPopoverOpen(false), 150)}
                        placeholder={t('fields.selectCategory')}
                          className="w-full h-[44px] border border-black px-4 pr-10 rounded-lg bg-white text-[#333] outline-none focus:outline-none focus:border-black transition-colors"
                          disabled={loadingCategories}
                        required
                        />
                      {selectedCategoryId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCategoryInput('');
                            setValue('categoryId', null, { shouldValidate: true });
                            setSubCategoryInput('');
                            setValue('subCategoryId', null, { shouldValidate: true });
                            setCategoryPopoverOpen(true);
                            setTimeout(() => {
                              categoryInputRef.current?.focus();
                            }, 0);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333] transition-colors"
                          tabIndex={-1}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                        {categoryPopoverOpen && (
                          <div className="absolute z-20 mt-1 w-full rounded-none border border-[#e0e0e0] bg-white shadow">
                            {filteredCategories.length > 0 ? (
                              filteredCategories.map((cat) => (
                                <div
                                  key={cat.id}
                                  className="flex items-center justify-between group hover:bg-gray-100"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const name = getCategoryName(cat, currentLocale);
                                      setCategoryInput(name);
                                      setValue('categoryId', cat.id, { shouldValidate: true });
                                      setCategoryPopoverOpen(false);
                                      setSubCategoryInput('');
                                      setValue('subCategoryId', null, { shouldValidate: true });
                                    }}
                                    className="flex-1 text-left px-3 py-2 text-sm"
                                  >
                                    {getCategoryName(cat, currentLocale)}
                                  </button>
                                  <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditCategory(cat);
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title={t('fields.update')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(cat.id, getCategoryName(cat, currentLocale));
                                      }}
                                      disabled={isDeletingCategory}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                      title={t('fields.delete')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : categoryInput.trim() === '' ? (
                              <div className="px-3 py-2 text-sm text-[#666]">
                                {t('fields.noOption')}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-gray-100 disabled:opacity-50"
                                disabled={isCreatingCategory}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleAddCategory}
                              >
                                {isCreatingCategory ? t('fields.creating') : `Add "${categoryInput.trim()}"`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat">
                        {t('fields.subCategory')}
                      </label>
                      <div className="relative">
                        <input
                          ref={subCategoryInputRef}
                          value={subCategoryInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSubCategoryInput(val);
                            const match = availableSubCategories.find(
                              sc => {
                                const name = getSubCategoryName(sc, currentLocale);
                                return name.toLowerCase() === val.trim().toLowerCase();
                              }
                            );
                            setValue('subCategoryId', match ? match.id : null, { shouldValidate: true });
                            setSubCategoryPopoverOpen(true);
                          }}
                          onFocus={() => setSubCategoryPopoverOpen(true)}
                          onBlur={() => setTimeout(() => setSubCategoryPopoverOpen(false), 150)}
                          placeholder={
                            selectedCategoryId ? t('fields.selectSubCategory') : t('fields.selectCategoryFirst')
                          }
                          className="w-full h-[44px] border border-black px-4 pr-10 rounded-lg bg-white text-[#333] outline-none focus:outline-none focus:border-black transition-colors"
                          disabled={loadingCategories || !selectedCategoryId}
                        />
                      {selectedSubCategoryId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSubCategoryInput('');
                            setValue('subCategoryId', null, { shouldValidate: true });
                            setSubCategoryPopoverOpen(true);
                            setTimeout(() => {
                              subCategoryInputRef.current?.focus();
                            }, 0);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333] transition-colors"
                          tabIndex={-1}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                        {subCategoryPopoverOpen && (
                          <div className="absolute z-20 mt-1 w-full rounded-none border border-[#e0e0e0] bg-white shadow">
                            {filteredSubCategories.length > 0 ? (
                              filteredSubCategories.map((subCat) => (
                                <div
                                  key={subCat.id}
                                  className="flex items-center justify-between group hover:bg-gray-100"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const name = getSubCategoryName(subCat, currentLocale);
                                      setSubCategoryInput(name);
                                      setValue('subCategoryId', subCat.id, { shouldValidate: true });
                                      setSubCategoryPopoverOpen(false);
                                    }}
                                    className="flex-1 text-left px-3 py-2 text-sm"
                                  >
                                    {getSubCategoryName(subCat, currentLocale)}
                                  </button>
                                  <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSubCategory(subCat);
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title={t('fields.update')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSubCategory(subCat.id, getSubCategoryName(subCat, currentLocale));
                                      }}
                                      disabled={isDeletingSubCategory}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                      title={t('fields.delete')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : subCategoryInput.trim() === '' ? (
                              <div className="px-3 py-2 text-sm text-[#666]">
                                {t('fields.noOption')}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-gray-100 disabled:opacity-50"
                                disabled={isCreatingSubCategory || !selectedCategoryId}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleAddSubCategory}
                              >
                                {isCreatingSubCategory ? t('fields.creating') : `Add "${subCategoryInput.trim()}"`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <FormField
                        key={`location-${currentLocale}`}
                        name={`translations.${currentLocale}.location`}
                        label={`${t('fields.location')} (${LOCALE_LABELS[currentLocale].label})`}
                        placeholder="TP. Hồ Chí Minh"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        key={`area-${currentLocale}`}
                        name={`translations.${currentLocale}.area`}
                        label={`${t('fields.area')} (${LOCALE_LABELS[currentLocale].label})`}
                        placeholder="58 m²"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        key={`year-${currentLocale}`}
                        name={`translations.${currentLocale}.year`}
                        label={`${t('fields.year')} (${LOCALE_LABELS[currentLocale].label})`}
                        placeholder="2018"
                        required
                      />
                    </div>
                  </div>
                  {errors.gallery && (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {errors.gallery.message as string}
                    </p>
                  )}
                </div>

                <GalleryUpload
                  galleryUrls={gallery.galleryUrls}
                  heroImageIndex={gallery.heroImageIndex}
                  uploading={gallery.uploading}
                  uploadProgress={gallery.uploadProgress}
                  isDragging={gallery.isDragging}
                  fileInputRef={gallery.fileInputRef}
                  onFileUpload={gallery.handleFileUpload}
                  onDragOver={gallery.handleDragOver}
                  onDragLeave={gallery.handleDragLeave}
                  onDrop={gallery.handleDrop}
                  onClick={gallery.handleClick}
                  onRemove={(index) => {
                    gallery.handleGalleryUrlRemove(index, (urls) => {
                      setValue('gallery', urls, { shouldValidate: true });
                    });
                  }}
                  onSetHero={gallery.handleSetHeroImage}
                  onReorder={gallery.handleReorder}
                  error={errors.gallery?.message as string | undefined}
                />

                <div className="flex justify-end pt-4 border-t border-[#e0e0e0]">
                  <Button type="button" onClick={handleNext}>
                    {t('new.next')}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-normal tracking-[2px] uppercase text-[#333] mb-6 border-b border-[#e0e0e0] pb-2">
                    {t('new.content')}
                  </h2>
                  <label className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat">
                    {t('new.content')} ({LOCALE_LABELS[currentLocale].label})
                  </label>
                  <TiptapEditor
                    key={`content-${currentLocale}`}
                    content={currentTranslation?.content || ''}
                    onChange={(newContent) => {
                      updateTranslation(currentLocale, 'content', newContent);
                    }}
                    projectSlug={slug || watch('slug') || null}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-[#e0e0e0]">
                  <Button type="button" variant="secondary" onClick={handleBack}>
                    {t('new.back')}
                  </Button>
                  {hasBothContent ? (
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? t('edit.updating') : t('edit.update')}
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleStep2Next}
                      disabled={hasNoContent || isSaving}
                    >
                      {t('new.next')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {saveMessage && (
              <div
                className={`px-4 py-3 rounded-none border-2 ${
                  saveMessage.type === 'success'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-red-50 border-red-500 text-red-700'
                }`}
              >
                {saveMessage.text}
              </div>
            )}
          </form>
        </FormProvider>

        {translationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 md:p-4">
            <div className="bg-white border border-[#e0e0e0] w-full max-w-md shadow-lg">
              <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-b border-[#e0e0e0]">
                <h2 className="text-sm sm:text-base md:text-base font-semibold tracking-[1px] sm:tracking-[1.5px] md:tracking-[2px] uppercase text-[#333]">
                  {translationModal.itemId
                    ? translationModal.type === 'category'
                      ? t('category.update')
                      : t('category.updateSub')
                    : translationModal.type === 'category'
                    ? t('category.addNew')
                    : t('category.addNewSub')}
                </h2>
              </div>
              <div className="px-4 sm:px-6 md:px-6 py-4 sm:py-5 md:py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
                    {t('category.nameVi')} *
                  </label>
                  <input
                    type="text"
                    value={modalTranslations.vi}
                    onChange={(e) => setModalTranslations({ ...modalTranslations, vi: e.target.value })}
                    className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
                    placeholder={t('category.nameViPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
                    {t('category.nameEn')} *
                  </label>
                  <input
                    type="text"
                    value={modalTranslations.en}
                    onChange={(e) => setModalTranslations({ ...modalTranslations, en: e.target.value })}
                    className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
                    placeholder={t('category.nameEnPlaceholder')}
                    required
                  />
                </div>
              </div>
              <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-t border-[#e0e0e0] flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTranslationModal(null);
                    setModalTranslations({ vi: '', en: '' });
                  }}
                  disabled={isCreatingCategory || isCreatingSubCategory || isUpdatingCategory || isUpdatingSubCategory}
                >
                  {t('category.cancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={
                    translationModal.itemId
                      ? (translationModal.type === 'category' ? handleUpdateCategory : handleUpdateSubCategory)
                      : (translationModal.type === 'category' ? handleCreateCategory : handleCreateSubCategory)
                  }
                  disabled={
                    isCreatingCategory ||
                    isCreatingSubCategory ||
                    isUpdatingCategory ||
                    isUpdatingSubCategory ||
                    !modalTranslations.vi.trim() ||
                    !modalTranslations.en.trim()
                  }
                >
                  {isCreatingCategory || isCreatingSubCategory
                    ? t('category.creating')
                    : isUpdatingCategory || isUpdatingSubCategory
                    ? t('category.updating')
                    : translationModal.itemId
                    ? t('category.updateButton')
                    : t('category.create')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmDialog && (
          <ConfirmDialog
            isOpen={deleteConfirmDialog.isOpen}
            title={deleteDialogTitle}
            message={deleteDialogMessage}
            confirmText={t('fields.delete')}
            cancelText={t('category.cancel')}
            variant="danger"
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        )}
      </div>
    </div>
  );
}
