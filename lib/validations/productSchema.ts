import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_MATERIALS } from '@/lib/constants/productConstants';

export const productCategoryValues = PRODUCT_CATEGORIES.map(cat => cat.value) as [string, ...string[]];
export const productMaterialValues = PRODUCT_MATERIALS.map(mat => mat.value) as [string, ...string[]];

export const productSchema = z.object({
  title: z
    .string()
    .min(1, 'Tên sản phẩm là bắt buộc')
    .max(200, 'Tên sản phẩm không được vượt quá 200 ký tự'),
  slug: z
    .string()
    .min(1, 'Slug là bắt buộc')
    .max(200, 'Slug không được vượt quá 200 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
  category: z.enum(productCategoryValues, {
    message: 'Vui lòng chọn danh mục',
  }),
  material: z.enum(productMaterialValues, {
    message: 'Vui lòng chọn chất liệu',
  }),
  year: z
    .string()
    .min(1, 'Năm là bắt buộc')
    .regex(/^\d{4}$/, 'Năm phải là 4 chữ số'),
  // Legacy (URL). Kept optional because we now store storage-agnostic asset references.
  thumbnail: z.string().optional().default(''),
  // New canonical field.
  thumbnailAssetId: z.string().min(1, 'Vui lòng upload ảnh đại diện'),
  descriptions: z
    .array(z.string())
    .optional()
    .default([]),
  content: z.string().optional().default(''),
});

export type ProductSchema = z.infer<typeof productSchema>;
