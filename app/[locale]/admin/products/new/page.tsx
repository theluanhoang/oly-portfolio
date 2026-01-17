'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import dynamicImport from 'next/dynamic';
import { DefaultLoading } from '@/lib/performance/dynamic-imports';

const TiptapEditor = dynamicImport(
  () => import('@/components/admin/TiptapEditor'),
  {
    loading: DefaultLoading,
    ssr: false,
  }
);
import { LocaleTabs } from '@/components/admin/LocaleTabs';
import SingleImageUpload from '@/components/admin/SingleImageUpload';
import FormField from '@/components/forms/FormField';
import Textarea from '@/components/forms/Textarea';
import { Header, StepIndicator } from '@/components/layout';
import { Button } from '@/components/ui';
import { productSchema, ProductSchema } from '@/lib/validations/productSchema';
import { generateSlug } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { Button as ConfirmButton, ConfirmDialog } from '@/components/ui';

const LOCALES = ['vi', 'en'];
const LOCALE_LABELS: Record<string, { label: string }> = {
  vi: { label: 'Tiếng Việt' },
  en: { label: 'English' },
};

interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  translations?: { locale: string; name: string }[];
}

interface ProductMaterial {
  id: string;
  slug: string;
  name: string;
  translations?: { locale: string; name: string }[];
}

export default function NewProductPage() {
  const t = useTranslations('Admin.products');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLocale, setCurrentLocale] = useState('vi');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [translationModal, setTranslationModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'material';
    initialName: string;
    itemId?: string;
  } | null>(null);
  const [modalTranslations, setModalTranslations] = useState({ vi: '', en: '' });
  const [categoryInput, setCategoryInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isUpdatingMaterial, setIsUpdatingMaterial] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'category' | 'material';
    itemId: string;
    itemName: string;
  } | null>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  const methods = useForm<ProductSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      slug: '',
      categoryId: null,
      materialId: null,
      year: '',
      thumbnail: '',
      translations: {
        vi: {
          title: '',
          descriptions: [],
          content: '',
        },
        en: {
          title: '',
          descriptions: [],
          content: '',
        },
      },
    },
    mode: 'onBlur',
  });

  const { handleSubmit, trigger, setValue, watch, formState: { errors }, control } = methods;
  const selectedCategoryId = watch('categoryId');
  const selectedMaterialId = watch('materialId');
  const translations = watch('translations');
  const currentTranslation = translations[currentLocale] || translations.vi || translations.en;
  const viTitle = translations?.vi?.title || '';
  const enTitle = translations?.en?.title || '';
  const thumbnail = watch('thumbnail');
  const previousTitleRef = useRef<Record<string, string>>({});

  const { fields, append, remove } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    name: `translations.${currentLocale}.descriptions` as any,
    keyName: 'id',
  });

  useEffect(() => {
    const firstLocaleWithTitle = LOCALES.find(locale => {
      const title = locale === 'vi' ? viTitle : enTitle;
      return title && title.trim();
    });

    if (firstLocaleWithTitle) {
      const title = firstLocaleWithTitle === 'vi' ? viTitle : enTitle;
      const previousTitle = previousTitleRef.current[firstLocaleWithTitle] || '';
      
      if (title && title !== previousTitle) {
        const generatedSlug = generateSlug(title);
        const currentSlug = watch('slug');
        const previousGeneratedSlug = previousTitle ? generateSlug(previousTitle) : '';
        
        if (!currentSlug || currentSlug === previousGeneratedSlug) {
          setValue('slug', generatedSlug, { shouldValidate: false });
        }
        previousTitleRef.current[firstLocaleWithTitle] = title;
      }
    }
  }, [viTitle, enTitle, setValue, watch]);

  // Load categories and materials once on mount (API returns all translations)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        // Load with vi locale to get all translations
        const res = await fetch(`/api/admin/product-categories?locale=vi`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        setCategories(data.items || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []); // Only load once on mount

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoadingMaterials(true);
        // Load with vi locale to get all translations
        const res = await fetch(`/api/admin/product-materials?locale=vi`);
        if (!res.ok) throw new Error('Failed to fetch materials');
        const data = await res.json();
        setMaterials(data.items || []);
      } catch (err) {
        console.error('Error loading materials:', err);
      } finally {
        setLoadingMaterials(false);
      }
    };
    loadMaterials();
  }, []); // Only load once on mount

  // Helper functions
  const reloadCategories = async () => {
    try {
      // Reload with vi locale to get all translations
      const reloadRes = await fetch(`/api/admin/product-categories?locale=vi`);
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setCategories(reloadData.items || []);
      }
    } catch (err) {
      console.error('Error reloading categories:', err);
    }
  };

  const reloadMaterials = async () => {
    try {
      // Reload with vi locale to get all translations
      const reloadRes = await fetch(`/api/admin/product-materials?locale=vi`);
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setMaterials(reloadData.items || []);
      }
    } catch (err) {
      console.error('Error reloading materials:', err);
    }
  };

  const getCategoryName = (cat: ProductCategory, locale: string): string => {
    if (cat.translations) {
      const trans = cat.translations.find(t => t.locale === locale)
        || cat.translations.find(t => t.locale === 'vi')
        || cat.translations.find(t => t.locale === 'en')
        || cat.translations[0];
      return trans?.name || cat.name;
    }
    return cat.name;
  };

  const getMaterialName = (mat: ProductMaterial, locale: string): string => {
    if (mat.translations) {
      const trans = mat.translations.find(t => t.locale === locale)
        || mat.translations.find(t => t.locale === 'vi')
        || mat.translations.find(t => t.locale === 'en')
        || mat.translations[0];
      return trans?.name || mat.name;
    }
    return mat.name;
  };

  // Update inputs when locale changes
  useEffect(() => {
    if (selectedCategoryId) {
      const cat = categories.find(c => c.id === selectedCategoryId);
      if (cat) {
        setCategoryInput(getCategoryName(cat, currentLocale));
      }
    }
    if (selectedMaterialId) {
      const mat = materials.find(m => m.id === selectedMaterialId);
      if (mat) {
        setMaterialInput(getMaterialName(mat, currentLocale));
      }
    }
  }, [currentLocale, selectedCategoryId, selectedMaterialId, categories, materials]);

  // Filtered lists
  const filteredCategories = categories.filter((cat) => {
    const searchTerm = categoryInput.trim().toLowerCase();
    if (!searchTerm) return true;
    const name = getCategoryName(cat, currentLocale);
    return name.toLowerCase().includes(searchTerm);
  });

  const filteredMaterials = materials.filter((mat) => {
    const searchTerm = materialInput.trim().toLowerCase();
    if (!searchTerm) return true;
    const name = getMaterialName(mat, currentLocale);
    return name.toLowerCase().includes(searchTerm);
  });

  // Handlers
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
      setSaveMessage({ type: 'error', text: t('productCategory.nameRequired') });
      return;
    }
    try {
      setIsCreatingCategory(true);
      const res = await fetch('/api/admin/product-categories', {
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
        throw new Error(json.error || t('productCategory.create') + ' failed');
      }
      await reloadCategories();
      setValue('categoryId', json.id, { shouldValidate: true });
      const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
      setCategoryInput(displayName);
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : t('productCategory.create') + ' failed' });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleAddMaterial = () => {
    const name = materialInput.trim();
    if (!name) return;
    const existing = materials.find((m) => {
      const matName = getMaterialName(m, currentLocale);
      return matName.toLowerCase() === name.toLowerCase();
    });
    if (existing) {
      setValue('materialId', existing.id, { shouldValidate: true });
      return;
    }
    setModalTranslations({ vi: name, en: name });
    setTranslationModal({ isOpen: true, type: 'material', initialName: name });
  };

  const handleCreateMaterial = async () => {
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('productMaterial.nameRequired') });
      return;
    }
    try {
      setIsCreatingMaterial(true);
      const res = await fetch('/api/admin/product-materials', {
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
        throw new Error(json.error || t('productMaterial.create') + ' failed');
      }
      await reloadMaterials();
      setValue('materialId', json.id, { shouldValidate: true });
      const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
      setMaterialInput(displayName);
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : t('productMaterial.create') + ' failed' });
    } finally {
      setIsCreatingMaterial(false);
    }
  };

  const handleEditCategory = (cat: ProductCategory) => {
    const viTrans = cat.translations?.find(t => t.locale === 'vi')?.name || cat.name;
    const enTrans = cat.translations?.find(t => t.locale === 'en')?.name || cat.name;
    setModalTranslations({ vi: viTrans, en: enTrans });
    setTranslationModal({ isOpen: true, type: 'category', initialName: getCategoryName(cat, currentLocale), itemId: cat.id });
  };

  const handleEditMaterial = (mat: ProductMaterial) => {
    const viTrans = mat.translations?.find(t => t.locale === 'vi')?.name || mat.name;
    const enTrans = mat.translations?.find(t => t.locale === 'en')?.name || mat.name;
    setModalTranslations({ vi: viTrans, en: enTrans });
    setTranslationModal({ isOpen: true, type: 'material', initialName: getMaterialName(mat, currentLocale), itemId: mat.id });
  };

  const handleUpdateCategory = async () => {
    if (!translationModal?.itemId) return;
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('productCategory.nameRequired') });
      return;
    }
    try {
      setIsUpdatingCategory(true);
      const res = await fetch(`/api/admin/product-categories/${translationModal.itemId}`, {
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
        throw new Error(json.error || t('productCategory.update') + ' failed');
      }
      await reloadCategories();
      if (selectedCategoryId === translationModal.itemId) {
        const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
        setCategoryInput(displayName);
      }
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
      setSaveMessage({ type: 'success', text: t('productCategory.updateSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : t('productCategory.update') + ' failed' });
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleUpdateMaterial = async () => {
    if (!translationModal?.itemId) return;
    if (!modalTranslations.vi.trim() || !modalTranslations.en.trim()) {
      setSaveMessage({ type: 'error', text: t('productMaterial.nameRequired') });
      return;
    }
    try {
      setIsUpdatingMaterial(true);
      const res = await fetch(`/api/admin/product-materials/${translationModal.itemId}`, {
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
        throw new Error(json.error || t('productMaterial.update') + ' failed');
      }
      await reloadMaterials();
      if (selectedMaterialId === translationModal.itemId) {
        const displayName = currentLocale === 'vi' ? modalTranslations.vi.trim() : modalTranslations.en.trim();
        setMaterialInput(displayName);
      }
      setTranslationModal(null);
      setModalTranslations({ vi: '', en: '' });
      setSaveMessage({ type: 'success', text: t('productMaterial.updateSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : t('productMaterial.update') + ' failed' });
    } finally {
      setIsUpdatingMaterial(false);
    }
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: 'category',
      itemId: categoryId,
      itemName: categoryName,
    });
  };

  const handleDeleteMaterial = (materialId: string, materialName: string) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: 'material',
      itemId: materialId,
      itemName: materialName,
    });
  };

  const performDeleteCategory = async (categoryId: string) => {
    try {
      setIsDeletingCategory(true);
      const res = await fetch(`/api/admin/product-categories/${categoryId}`, {
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
      }
      setSaveMessage({ type: 'success', text: t('productCategory.deleteSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : t('productCategory.delete') + ' failed' });
    } finally {
      setIsDeletingCategory(false);
      setDeleteConfirmDialog(null);
    }
  };

  const performDeleteMaterial = async (materialId: string) => {
    try {
      setIsDeletingMaterial(true);
      const res = await fetch(`/api/admin/product-materials/${materialId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete material');
      }
      await reloadMaterials();
      if (selectedMaterialId === materialId) {
        setMaterialInput('');
        setValue('materialId', null, { shouldValidate: true });
      }
      setSaveMessage({ type: 'success', text: t('productMaterial.deleteSuccess') });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : t('productMaterial.delete') + ' failed' });
    } finally {
      setIsDeletingMaterial(false);
      setDeleteConfirmDialog(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmDialog) return;
    if (deleteConfirmDialog.type === 'category') {
      performDeleteCategory(deleteConfirmDialog.itemId);
    } else {
      performDeleteMaterial(deleteConfirmDialog.itemId);
    }
  };

  const handleContentChange = (newContent: string) => {
    const currentTranslations = watch('translations') || {};
    const localeTranslation = currentTranslations[currentLocale] || {};
    setValue('translations', {
      ...currentTranslations,
      [currentLocale]: {
        ...localeTranslation,
        content: newContent,
      },
    }, { shouldValidate: false });
  };


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
      const categoryValid = await trigger('categoryId');
      const materialValid = await trigger('materialId');
      const yearValid = await trigger('year');
      const thumbnailValid = await trigger('thumbnail');
      const viFieldsValid = await trigger([
        'translations.vi.title' as keyof ProductSchema,
      ]);
      const enFieldsValid = await trigger([
        'translations.en.title' as keyof ProductSchema,
      ]);
      
      const isValid = slugValid && categoryValid && materialValid && yearValid && thumbnailValid && viFieldsValid && enFieldsValid;
      
      if (isValid) {
        setCurrentStep(2);
        setCurrentLocale('vi');
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

  const onSubmit = async (data: ProductSchema) => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      if (!data.thumbnail) {
        throw new Error('Vui lòng upload ảnh đại diện');
      }

      const productData = {
        slug: data.slug || generateSlug(data.translations.vi?.title || data.translations.en?.title || 'product'),
        categoryId: data.categoryId,
        materialId: data.materialId,
        year: data.year,
        thumbnail: data.thumbnail,
        translations: data.translations,
      };
      
      const response = await fetch('/api/products/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
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
        const errorMessage = result.error || t('new.error');
        const errorDetails = result.details ? `\nDetails: ${JSON.stringify(result.details, null, 2)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      setSaveMessage({ type: 'success', text: t('new.success') });
      
      methods.reset({
        slug: '',
        categoryId: null,
        materialId: null,
        year: '',
        thumbnail: '',
        translations: {
          vi: {
            title: '',
            descriptions: [],
            content: '',
          },
          en: {
            title: '',
            descriptions: [],
            content: '',
          },
        },
      });
      setCategoryInput('');
      setMaterialInput('');
      setCurrentStep(1);
      setCurrentLocale('vi');
      
      setTimeout(() => {
        setSaveMessage(null);
        router.push('/admin/products');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : t('new.error');
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header isFixed={true} />

      <div className="max-w-5xl mx-auto py-12 px-8 md:px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-normal tracking-[3px] uppercase text-[#333] md:text-2xl">
              {t('new.title')}
            </h1>
            <LocaleTabs
              locales={LOCALES}
              currentLocale={currentLocale}
              onLocaleChange={setCurrentLocale}
              translations={LOCALE_LABELS}
              variant="inline"
            />
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
                    {t('new.productInfo')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" key={currentLocale}>
                    <div className="md:col-span-2">
                      <FormField
                        key={`title-${currentLocale}`}
                        name={`translations.${currentLocale}.title`}
                        label={`${t('fields.title')} (${LOCALE_LABELS[currentLocale].label})`}
                        placeholder="Wooden Chair"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        name="slug"
                        label={t('fields.slug')}
                        placeholder="wooden-chair"
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
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCategoryInput('');
                              setValue('categoryId', null, { shouldValidate: true });
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
                                      title={t('productCategory.updateButton')}
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
                      {errors.categoryId && (
                        <p className="mt-2 text-xs text-red-600" role="alert">
                          {errors.categoryId.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-bold text-black tracking-[0.16px] leading-normal mb-2 font-montserrat">
                        {t('fields.material')} <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={materialInputRef}
                          value={materialInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMaterialInput(val);
                            const match = materials.find(m => {
                              const name = getMaterialName(m, currentLocale);
                              return name.toLowerCase() === val.trim().toLowerCase();
                            });
                            setValue('materialId', match ? match.id : null, { shouldValidate: true });
                            setMaterialPopoverOpen(true);
                          }}
                          onFocus={() => setMaterialPopoverOpen(true)}
                          onBlur={() => setTimeout(() => setMaterialPopoverOpen(false), 150)}
                          placeholder={t('fields.selectMaterial')}
                          className="w-full h-[44px] border border-black px-4 pr-10 rounded-lg bg-white text-[#333] outline-none focus:outline-none focus:border-black transition-colors"
                          disabled={loadingMaterials}
                          required
                        />
                        {selectedMaterialId && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMaterialInput('');
                              setValue('materialId', null, { shouldValidate: true });
                              setMaterialPopoverOpen(true);
                              setTimeout(() => {
                                materialInputRef.current?.focus();
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
                        {materialPopoverOpen && (
                          <div className="absolute z-20 mt-1 w-full rounded-none border border-[#e0e0e0] bg-white shadow">
                            {filteredMaterials.length > 0 ? (
                              filteredMaterials.map((mat) => (
                                <div
                                  key={mat.id}
                                  className="flex items-center justify-between group hover:bg-gray-100"
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const name = getMaterialName(mat, currentLocale);
                                      setMaterialInput(name);
                                      setValue('materialId', mat.id, { shouldValidate: true });
                                      setMaterialPopoverOpen(false);
                                    }}
                                    className="flex-1 text-left px-3 py-2 text-sm"
                                  >
                                    {getMaterialName(mat, currentLocale)}
                                  </button>
                                  <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditMaterial(mat);
                                      }}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title={t('productMaterial.updateButton')}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMaterial(mat.id, getMaterialName(mat, currentLocale));
                                      }}
                                      disabled={isDeletingMaterial}
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
                            ) : materialInput.trim() === '' ? (
                              <div className="px-3 py-2 text-sm text-[#666]">
                                {t('fields.noOption')}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-gray-100 disabled:opacity-50"
                                disabled={isCreatingMaterial}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleAddMaterial}
                              >
                                {isCreatingMaterial ? t('fields.creating') : `Add "${materialInput.trim()}"`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.materialId && (
                        <p className="mt-2 text-xs text-red-600" role="alert">
                          {errors.materialId.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <FormField
                        name="year"
                        label={t('fields.year')}
                        placeholder="2024"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-normal tracking-[1px] uppercase text-[#333] mb-4">
                    {t('new.thumbnail')}
                  </h3>
                  <SingleImageUpload
                    value={thumbnail}
                    onChange={(url) => setValue('thumbnail', url, { shouldValidate: true })}
                    error={errors.thumbnail?.message as string | undefined}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-normal tracking-[1px] uppercase text-[#333] mb-4">
                    {t('fields.descriptions')} ({LOCALE_LABELS[currentLocale].label})
                  </h3>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Controller
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            name={`translations.${currentLocale}.descriptions.${index}` as any}
                            control={control}
                            render={({ field: textareaField }) => (
                              <Textarea
                                {...textareaField}
                                placeholder={t('fields.descriptionPlaceholder')}
                                className="rounded-none border-none!"
                              />
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => append('')}
                      className="w-full flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('fields.addDescription')}
                    </Button>
                  </div>
                </div>

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
                    onChange={handleContentChange}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-[#e0e0e0]">
                  <Button type="button" variant="secondary" onClick={handleBack}>
                    {t('new.back')}
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? t('new.saving') : t('new.save')}
                  </Button>
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
                      ? t('productCategory.update')
                      : t('productMaterial.update')
                    : translationModal.type === 'category'
                    ? t('productCategory.addNew')
                    : t('productMaterial.addNew')}
                </h2>
              </div>
              <div className="px-4 sm:px-6 md:px-6 py-4 sm:py-5 md:py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
                    {translationModal.type === 'category' ? t('productCategory.nameVi') : t('productMaterial.nameVi')} *
                  </label>
                  <input
                    type="text"
                    value={modalTranslations.vi}
                    onChange={(e) => setModalTranslations({ ...modalTranslations, vi: e.target.value })}
                    className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
                    placeholder={translationModal.type === 'category' ? t('productCategory.nameViPlaceholder') : t('productMaterial.nameViPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[1px] text-[#555] mb-1">
                    {translationModal.type === 'category' ? t('productCategory.nameEn') : t('productMaterial.nameEn')} *
                  </label>
                  <input
                    type="text"
                    value={modalTranslations.en}
                    onChange={(e) => setModalTranslations({ ...modalTranslations, en: e.target.value })}
                    className="w-full border border-[#e0e0e0] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#333]"
                    placeholder={translationModal.type === 'category' ? t('productCategory.nameEnPlaceholder') : t('productMaterial.nameEnPlaceholder')}
                    required
                  />
                </div>
              </div>
              <div className="px-4 sm:px-6 md:px-6 py-3 sm:py-4 md:py-4 border-t border-[#e0e0e0] flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-3">
                <ConfirmButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTranslationModal(null);
                    setModalTranslations({ vi: '', en: '' });
                  }}
                  disabled={isCreatingCategory || isCreatingMaterial || isUpdatingCategory || isUpdatingMaterial}
                >
                  {translationModal.type === 'category' ? t('productCategory.cancel') : t('productMaterial.cancel')}
                </ConfirmButton>
                <ConfirmButton
                  type="button"
                  size="sm"
                  onClick={
                    translationModal.itemId
                      ? (translationModal.type === 'category' ? handleUpdateCategory : handleUpdateMaterial)
                      : (translationModal.type === 'category' ? handleCreateCategory : handleCreateMaterial)
                  }
                  disabled={
                    isCreatingCategory ||
                    isCreatingMaterial ||
                    isUpdatingCategory ||
                    isUpdatingMaterial ||
                    !modalTranslations.vi.trim() ||
                    !modalTranslations.en.trim()
                  }
                >
                  {isCreatingCategory || isCreatingMaterial
                    ? (translationModal.type === 'category' ? t('productCategory.creating') : t('productMaterial.creating'))
                    : isUpdatingCategory || isUpdatingMaterial
                    ? (translationModal.type === 'category' ? t('productCategory.updating') : t('productMaterial.updating'))
                    : translationModal.itemId
                    ? (translationModal.type === 'category' ? t('productCategory.updateButton') : t('productMaterial.updateButton'))
                    : (translationModal.type === 'category' ? t('productCategory.create') : t('productMaterial.create'))}
                </ConfirmButton>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmDialog && (
          <ConfirmDialog
            isOpen={deleteConfirmDialog.isOpen}
            title={deleteConfirmDialog.type === 'category' ? t('productCategory.delete') : t('productMaterial.delete')}
            message={deleteConfirmDialog.type === 'category' 
              ? t('productCategory.deleteConfirm', { name: deleteConfirmDialog.itemName })
              : t('productMaterial.deleteConfirm', { name: deleteConfirmDialog.itemName })}
            confirmText={t('fields.delete')}
            cancelText={deleteConfirmDialog.type === 'category' ? t('productCategory.cancel') : t('productMaterial.cancel')}
            variant="danger"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmDialog(null)}
          />
        )}
      </div>
    </div>
  );
}

