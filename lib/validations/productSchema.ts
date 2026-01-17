import { z } from 'zod';

export const productTranslationSchema = z.object({
  title: z
    .string()
    .min(1, 'Tên sản phẩm là bắt buộc')
    .max(200, 'Tên sản phẩm không được vượt quá 200 ký tự'),
  descriptions: z
    .array(z.string())
    .optional()
    .default([]),
  content: z.string().optional().default(''),
});

export const productSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug là bắt buộc')
    .max(200, 'Slug không được vượt quá 200 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục').nullable(),
  materialId: z.string().min(1, 'Vui lòng chọn chất liệu').nullable(),
  year: z
    .string()
    .min(1, 'Năm là bắt buộc')
    .regex(/^\d{4}$/, 'Năm phải là 4 chữ số'),
  thumbnail: z
    .string()
    .min(1, 'Vui lòng upload ảnh đại diện'),
  translations: z.record(z.string(), productTranslationSchema).refine(
    (translations) => Object.keys(translations).length > 0,
    'Phải có ít nhất một bản dịch'
  ),
});

export type ProductTranslationSchema = z.infer<typeof productTranslationSchema>;
export type ProductSchema = z.infer<typeof productSchema>;
