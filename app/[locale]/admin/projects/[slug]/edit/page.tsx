'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import TiptapEditor from '@/components/admin/TiptapEditor';
import GalleryUpload from '@/components/admin/GalleryUpload';
import FormField from '@/components/forms/FormField';
import { Header, PageHeader, StepIndicator } from '@/components/layout';
import { Button } from '@/components/ui';
import { useGalleryUpload } from '@/hooks/useGalleryUpload';
import { projectSchema, ProjectSchema, ProjectCategory } from '@/lib/validations/projectSchema';
import { getTypeOptionsByCategory } from '@/lib/constants/projectConstants';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const t = useTranslations('Admin.projects');
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const methods = useForm<ProjectSchema>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      slug: '',
      category: ProjectCategory.Architecture,
      type: '',
      location: '',
      area: '',
      year: '',
      gallery: [],
      content: '',
    },
    mode: 'onBlur',
  });

  const { handleSubmit, trigger, setValue, watch, formState: { errors }, reset } = methods;
  const content = watch('content');
  const category = watch('category');

  const typeOptions = getTypeOptionsByCategory(category);

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

        reset({
          title: project.title || '',
          slug: project.slug || '',
          category: (project.category as ProjectCategory) || ProjectCategory.Architecture,
          type: project.type || '',
          location: project.location || '',
          area: project.area || '',
          year: project.year || '',
          gallery: project.gallery || [],
          content: project.content || '',
        });

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
  }, [slug, reset]);

  useEffect(() => {
    if (!category) {
      setValue('type', '', { shouldValidate: false });
    }
  }, [category, setValue]);

  const handleContentChange = (newContent: string) => {
    setValue('content', newContent, { shouldValidate: false });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(['title', 'slug', 'category', 'location', 'area', 'year', 'gallery']);
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

  const onSubmit = async (data: ProjectSchema) => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const galleryUrlStrings = gallery.getGalleryUrlStrings();
      const projectData = {
        slug: data.slug,
        title: data.title,
        category: data.category,
        type: data.type && data.type.trim() ? data.type.trim() : '',
        location: data.location,
        area: data.area,
        year: data.year,
        heroImage: galleryUrlStrings.length > 0 && gallery.heroImageIndex < galleryUrlStrings.length 
          ? galleryUrlStrings[gallery.heroImageIndex] 
          : (galleryUrlStrings.length > 0 ? galleryUrlStrings[0] : ''),
        gallery: galleryUrlStrings,
        content: data.content || '',
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
                    {t('new.projectInfo')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        name="title"
                        label={t('fields.title')}
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
                      <FormField
                        name="category"
                        label={t('fields.category')}
                        type="select"
                        placeholder={t('fields.selectCategory')}
                        required
                        options={[
                          { value: ProjectCategory.Architecture, label: t('categories.architecture') },
                          { value: ProjectCategory.InteriorConstruction, label: t('categories.interiorConstruction') },
                        ]}
                      />
                    </div>

                    <div>
                      <FormField
                        name="type"
                        label={t('fields.subCategory')}
                        type="select"
                        placeholder={category ? t('fields.selectSubCategory') : t('fields.selectCategoryFirst')}
                        options={typeOptions}
                        disabled={!category}
                      />
                    </div>

                    <div>
                      <FormField
                        name="location"
                        label={t('fields.location')}
                        placeholder="TP. Hồ Chí Minh"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        name="area"
                        label={t('fields.area')}
                        placeholder="58 m²"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        name="year"
                        label={t('fields.year')}
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

