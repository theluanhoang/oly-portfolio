import { ProjectCategory } from '@/lib/validations/projectSchema';

export interface TypeOption {
  value: string;
  label: string;
}

export const typeOptionsByCategory: Record<ProjectCategory, TypeOption[]> = {
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

export function isValidCategory(cat: string | undefined): cat is ProjectCategory {
  return cat !== undefined && cat in typeOptionsByCategory;
}

export function getTypeOptionsByCategory(category: ProjectCategory | string | undefined): TypeOption[] {
  if (!category || !isValidCategory(category)) {
    return [];
  }
  return typeOptionsByCategory[category];
}

