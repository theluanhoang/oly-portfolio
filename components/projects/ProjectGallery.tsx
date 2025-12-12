'use client';

import { useState, useEffect } from 'react';

interface ProjectGalleryProps {
  images?: string[];
}

export default function ProjectGallery({ images = [] }: ProjectGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);

  // Nếu không có images, trả về null
  if (!images || images.length === 0) {
    return null;
  }

  // Nếu chỉ có 1 ảnh, hiển thị đơn giản
  if (images.length === 1) {
    return (
      <section className="w-full bg-background">
        <div className="w-full overflow-hidden">
          <img
            src={images[0]}
            alt="Project gallery"
            className="w-full h-auto object-cover"
            loading="eager"
          />
        </div>
      </section>
    );
  }

  // Tính toán các thumbnail cần hiển thị
  const maxThumbnails = 5;
  const totalImages = images.length;
  const remainingImages = totalImages - thumbnailStartIndex - maxThumbnails;
  const showRemainingCount = remainingImages > 0;

  // Tự động điều chỉnh thumbnail slider khi selectedImage thay đổi
  useEffect(() => {
    // Nếu ảnh được chọn nằm ngoài phạm vi hiển thị của thumbnail slider
    if (selectedImage < thumbnailStartIndex) {
      // Ảnh ở bên trái, scroll về trái
      setThumbnailStartIndex(Math.max(0, selectedImage));
    } else if (selectedImage >= thumbnailStartIndex + (showRemainingCount ? maxThumbnails - 1 : maxThumbnails)) {
      // Ảnh ở bên phải, scroll về phải
      const newStartIndex = Math.min(
        totalImages - maxThumbnails,
        selectedImage - (maxThumbnails - 2)
      );
      setThumbnailStartIndex(Math.max(0, newStartIndex));
    }
  }, [selectedImage, thumbnailStartIndex, showRemainingCount, maxThumbnails, totalImages]);

  // Lấy các thumbnail cần hiển thị (tối đa 4 ảnh + 1 ảnh đếm số lượng còn lại)
  const visibleThumbnails = images.slice(
    thumbnailStartIndex,
    thumbnailStartIndex + (showRemainingCount ? maxThumbnails - 1 : maxThumbnails)
  );


  // Xử lý khi click vào thumbnail
  const handleThumbnailClick = (index: number): void => {
    const actualIndex = thumbnailStartIndex + index;
    setSelectedImage(actualIndex);
  };

  // Xử lý khi click vào ảnh đếm số lượng còn lại
  const handleRemainingClick = (): void => {
    const nextIndex = thumbnailStartIndex + maxThumbnails - 1;
    if (nextIndex < totalImages) {
      setSelectedImage(nextIndex);
      // Cập nhật thumbnail slider để hiển thị ảnh tiếp theo
      const newStartIndex = Math.min(
        totalImages - maxThumbnails,
        thumbnailStartIndex + 1
      );
      setThumbnailStartIndex(newStartIndex);
    }
  };

  // Xử lý khi click vào arrow để chuyển ảnh chính
  const handlePrevImage = (): void => {
    const newIndex = selectedImage > 0 ? selectedImage - 1 : totalImages - 1;
    setSelectedImage(newIndex);
  };

  const handleNextImage = (): void => {
    const newIndex = selectedImage < totalImages - 1 ? selectedImage + 1 : 0;
    setSelectedImage(newIndex);
  };

  return (
    <section className="w-full bg-background py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Main Image với arrows */}
        <div className="relative w-full mb-6 md:mb-8 overflow-hidden rounded-lg group">
          <img
            src={images[selectedImage]}
            alt={`Project image ${selectedImage + 1}`}
            className="w-full h-auto object-cover transition-opacity duration-300"
            loading={selectedImage === 0 ? 'eager' : 'lazy'}
          />
          
          {/* Arrow Left */}
          <button
            onClick={handlePrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Arrow Right */}
          <button
            onClick={handleNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Thumbnail Slider */}
        <div className="relative">
          {/* Thumbnail Container */}
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {visibleThumbnails.map((image, index) => {
              const actualIndex = thumbnailStartIndex + index;
              const isSelected = selectedImage === actualIndex;
              
              return (
                <button
                  key={actualIndex}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative aspect-video overflow-hidden rounded-md transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-[#333] scale-105'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${actualIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}

            {/* Ảnh hiển thị số lượng còn lại */}
            {showRemainingCount && (
              <button
                onClick={handleRemainingClick}
                className="relative aspect-video overflow-hidden rounded-md transition-all duration-200 opacity-70 hover:opacity-100 hover:scale-105 bg-[#333]"
              >
                <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm md:text-base z-10">
                  +{remainingImages}
                </div>
                {images[thumbnailStartIndex + maxThumbnails - 1] && (
                  <img
                    src={images[thumbnailStartIndex + maxThumbnails - 1]}
                    alt="Remaining images"
                    className="w-full h-full object-cover opacity-30"
                    loading="lazy"
                  />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

