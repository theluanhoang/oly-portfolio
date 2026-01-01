'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useForm, FormProvider, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import TiptapEditor from '@/components/admin/TiptapEditor';
import SingleImageUpload from '@/components/admin/SingleImageUpload';
import FormField from '@/components/forms/FormField';
import Textarea from '@/components/forms/Textarea';
import { Header, PageHeader, StepIndicator } from '@/components/layout';
import { Button } from '@/components/ui';
import { productSchema, ProductSchema } from '@/lib/validations/productSchema';
import { generateSlug } from '@/lib/utils';
import { PRODUCT_CATEGORIES, PRODUCT_MATERIALS } from '@/lib/constants/productConstants';
import { Plus, X } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const t = useTranslations('Admin.products');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const methods = useForm<ProductSchema>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title: '',
      slug: '',
      category: '',
      material: '',
      year: '',
      thumbnail: '',
      descriptions: [],
      content: '',
    },
    mode: 'onBlur',
  });

  const { handleSubmit, trigger, setValue, watch, formState: { errors }, control, reset } = methods;
  const content = watch('content');
  const title = watch('title');
  const thumbnail = watch('thumbnail');
  const previousTitleRef = useRef('');

  const { fields, append, remove } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as any,
    name: 'descriptions',
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const product = await response.json();
        
        reset({
          title: product.title || '',
          slug: product.slug || '',
          category: product.category || '',
          material: product.material || '',
          year: product.year || '',
          thumbnail: product.thumbnail || '',
          descriptions: product.descriptions || [],
          content: product.content || '',
        });

        previousTitleRef.current = product.title || '';
      } catch (error) {
        console.error('Error loading product:', error);
        setSaveMessage({ type: 'error', text: t('edit.error') });
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug, reset, t]);

  useEffect(() => {
    if (title && title !== previousTitleRef.current) {
      const generatedSlug = generateSlug(title);
      const currentSlug = watch('slug');
      const previousGeneratedSlug = previousTitleRef.current ? generateSlug(previousTitleRef.current) : '';
      
      if (!currentSlug || currentSlug === previousGeneratedSlug) {
        setValue('slug', generatedSlug, { shouldValidate: false });
      }
      previousTitleRef.current = title;
    }
  }, [title, setValue, watch]);

  const handleContentChange = (newContent: string) => {
    setValue('content', newContent, { shouldValidate: false });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(['title', 'slug', 'category', 'material', 'year', 'thumbnail']);
      if (isValid) {
        setCurrentStep(2);
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
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        category: data.category,
        material: data.material,
        year: data.year,
        thumbnail: data.thumbnail,
        descriptions: data.descriptions || [],
        content: data.content || '',
      };
      
      const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
        method: 'PUT',
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
        const errorMessage = result.error || t('edit.error');
        const errorDetails = result.details ? `\nDetails: ${JSON.stringify(result.details, null, 2)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      setSaveMessage({ type: 'success', text: t('edit.success') });
      
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating product:', error);
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
        <PageHeader
          title={t('edit.title')}
          subtitle={`${t('new.step')} ${currentStep} ${t('new.of')} 2`}
        />

        <StepIndicator currentStep={currentStep} totalSteps={2} />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-none border border-[#e0e0e0] p-8 md:p-6 space-y-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-normal tracking-[2px] uppercase text-[#333] mb-6 border-b border-[#e0e0e0] pb-2">
                    {t('new.productInfo')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        name="title"
                        label={t('fields.title')}
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
                    {t('fields.descriptions')}
                  </h3>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Controller
                            name={`descriptions.${index}`}
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
                  <TiptapEditor
                    content={content || ''}
                    onChange={handleContentChange}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-[#e0e0e0]">
                  <Button type="button" variant="secondary" onClick={handleBack}>
                    {t('new.back')}
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? t('edit.updating') : t('edit.update')}
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

