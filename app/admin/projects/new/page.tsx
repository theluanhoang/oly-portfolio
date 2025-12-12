'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TiptapEditor from '@/components/admin/TiptapEditor';
import GalleryUpload from '@/components/admin/GalleryUpload';
import FormField from '@/components/forms/FormField';
import { Header, PageHeader, StepIndicator } from '@/components/layout';
import { Button } from '@/components/ui';
import { useGalleryUpload } from '@/hooks/useGalleryUpload';
import { projectSchema, ProjectSchema, ProjectCategory } from '@/lib/validations/projectSchema';
import { generateSlug } from '@/lib/utils';

export default function NewProjectPage() {
  const [currentStep, setCurrentStep] = useState(1);
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

  const { handleSubmit, trigger, setValue, watch, formState: { errors } } = methods;
  const content = watch('content');
  const title = watch('title');
  const category = watch('category');
  const previousTitleRef = useRef('');

  const typeOptionsByCategory: Record<ProjectCategory, Array<{ value: string; label: string }>> = {
    [ProjectCategory.Architecture]: [
      { value: 'Nhà phố', label: 'Nhà phố' },
      { value: 'Shophouse', label: 'Shophouse' },
      { value: 'Biệt thự', label: 'Biệt thự' },
      { value: 'Nhà vườn', label: 'Nhà vườn' },
      { value: 'Resort', label: 'Resort' },
      { value: 'Nhà nghỉ dưỡng', label: 'Nhà nghỉ dưỡng' },
      { value: 'Cabin', label: 'Cabin' },
      { value: 'Bungalow', label: 'Bungalow' },
      { value: 'Nhà tre', label: 'Nhà tre' },
      { value: 'Nhà cổ', label: 'Nhà cổ' },
      { value: 'Nhà thông minh', label: 'Nhà thông minh' },
      { value: 'Nhà nổi', label: 'Nhà nổi' },
    ],
    [ProjectCategory.InteriorConstruction]: [
      { value: 'Căn hộ', label: 'Căn hộ' },
      { value: 'Penthouse', label: 'Penthouse' },
      { value: 'Không gian làm việc', label: 'Không gian làm việc' },
      { value: 'Văn phòng', label: 'Văn phòng' },
      { value: 'Showroom', label: 'Showroom' },
      { value: 'Nhà hàng', label: 'Nhà hàng' },
      { value: 'Khách sạn', label: 'Khách sạn' },
      { value: 'Cửa hàng', label: 'Cửa hàng' },
    ],
  };

  const isValidCategory = (cat: string | undefined): cat is ProjectCategory => {
    return cat !== undefined && cat in typeOptionsByCategory;
  };

  const typeOptions = isValidCategory(category) ? typeOptionsByCategory[category] : [];

  const gallery = useGalleryUpload({
    onUploadSuccess: (urls) => {
      const currentGallery = watch('gallery') || [];
      setValue('gallery', [...currentGallery, ...urls], { shouldValidate: true });
    },
    onError: (error) => {
      setSaveMessage({ type: 'error', text: error });
    },
  });

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
        slug: data.slug || generateSlug(data.title),
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
      
      const response = await fetch('/api/projects/save', {
        method: 'POST',
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
        const errorMessage = result.error || 'Failed to save project';
        const errorDetails = result.details ? `\nDetails: ${JSON.stringify(result.details, null, 2)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      setSaveMessage({ type: 'success', text: 'Dự án đã được lưu thành công!' });
      
      methods.reset({
        title: '',
        slug: '',
        category: ProjectCategory.Architecture,
        type: '',
        location: '',
        area: '',
        year: '',
        gallery: [],
        content: '',
      });
      gallery.reset();
      setCurrentStep(1);
      
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu dự án';
      setSaveMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header isFixed={true} />

      <div className="max-w-5xl mx-auto py-12 px-8 md:px-4">
        <PageHeader
          title="Tạo Dự Án Mới"
          subtitle={`Bước ${currentStep} / 2`}
        />

        <StepIndicator currentStep={currentStep} totalSteps={2} />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-none border border-[#e0e0e0] p-8 md:p-6 space-y-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-normal tracking-[2px] uppercase text-[#333] mb-6 border-b border-[#e0e0e0] pb-2">
                    Thông Tin Dự Án
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <FormField
                        name="title"
                        label="Tên dự án"
                        placeholder="NARROW HOUSE"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        name="slug"
                        label="Slug"
                        placeholder="narrow-house"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        name="category"
                        label="Thể loại"
                        type="select"
                        placeholder="Chọn thể loại"
                        required
                        options={[
                          { value: ProjectCategory.Architecture, label: 'Architecture' },
                          { value: ProjectCategory.InteriorConstruction, label: 'Interior & Construction' },
                        ]}
                      />
                    </div>

                    <div>
                      <FormField
                        name="type"
                        label="Thể loại phụ"
                        type="select"
                        placeholder={category ? "Chọn thể loại phụ" : "Vui lòng chọn thể loại trước"}
                        options={typeOptions}
                        disabled={!category}
                      />
                    </div>

                    <div>
                      <FormField
                        name="location"
                        label="Địa điểm"
                        placeholder="TP. Hồ Chí Minh"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        name="area"
                        label="Diện tích"
                        placeholder="58 m²"
                        required
                      />
                    </div>

                    <div>
                      <FormField
                        name="year"
                        label="Năm thực hiện"
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
                  error={errors.gallery?.message as string | undefined}
                />

                <div className="flex justify-end pt-4 border-t border-[#e0e0e0]">
                  <Button type="button" onClick={handleNext}>
                    Tiếp Theo →
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-normal tracking-[2px] uppercase text-[#333] mb-6 border-b border-[#e0e0e0] pb-2">
                    Nội Dung Bài Viết
                  </h2>
                  <TiptapEditor
                    content={content || ''}
                    onChange={handleContentChange}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-[#e0e0e0]">
                  <Button type="button" variant="secondary" onClick={handleBack}>
                    ← Quay Lại
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu Dự Án'}
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
