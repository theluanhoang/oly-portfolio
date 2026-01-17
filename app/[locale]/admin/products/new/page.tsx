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
import { PRODUCT_CATEGORIES, PRODUCT_MATERIALS } from '@/lib/constants/productConstants';
import { Plus, X } from 'lucide-react';

const LOCALES = ['vi', 'en'];
const LOCALE_LABELS: Record<string, { label: string }> = {
  vi: { label: 'Tiếng Việt' },
  en: { label: 'English' },
};

export default function NewProductPage() {
  const t = useTranslations('Admin.products');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLocale, setCurrentLocale] = useState('vi');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const methods = useForm<ProductSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      slug: '',
      category: '',
      material: '',
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


  const handleNext = async () => {
    if (currentStep === 1) {
      const slugValid = await trigger('slug');
      const categoryValid = await trigger('category');
      const materialValid = await trigger('material');
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
        category: data.category,
        material: data.material,
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
        category: '',
        material: '',
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
                      <FormField
                        name="category"
                        label={t('fields.category')}
                        type="select"
                        placeholder={t('fields.selectCategory')}
                        required
                        options={PRODUCT_CATEGORIES.map(cat => ({
                          value: cat.value,
                          label: t(`categories.${cat.value.toLowerCase()}`) || cat.label
                        }))}
                      />
                    </div>

                    <div>
                      <FormField
                        name="material"
                        label={t('fields.material')}
                        type="select"
                        placeholder={t('fields.selectMaterial')}
                        required
                        options={PRODUCT_MATERIALS.map(mat => ({
                          value: mat.value,
                          label: t(`materials.${mat.value.toLowerCase()}`) || mat.label
                        }))}
                      />
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
      </div>
    </div>
  );
}

