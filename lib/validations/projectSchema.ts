import { z } from 'zod';

export enum ProjectCategory {
  Architecture = 'Architecture',
  InteriorConstruction = 'Interior & Construction',
}

export const projectCategoryValues = Object.values(ProjectCategory) as [string, ...string[]];

export const projectSchema = z.object({
  title: z
    .string()
    .min(1, 'Tên dự án là bắt buộc')
    .max(200, 'Tên dự án không được vượt quá 200 ký tự'),
  slug: z
    .string()
    .min(1, 'Slug là bắt buộc')
    .max(200, 'Slug không được vượt quá 200 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
  category: z.enum(projectCategoryValues, {
    message: 'Vui lòng chọn thể loại',
  }),
  type: z
    .string()
    .max(100, 'Thể loại phụ không được vượt quá 100 ký tự')
    .optional(),
  location: z
    .string()
    .min(1, 'Địa điểm là bắt buộc')
    .max(200, 'Địa điểm không được vượt quá 200 ký tự'),
  area: z
    .string()
    .min(1, 'Diện tích là bắt buộc')
    .max(50, 'Diện tích không được vượt quá 50 ký tự'),
  year: z
    .string()
    .min(1, 'Năm thực hiện là bắt buộc')
    .regex(/^\d{4}$/, 'Năm phải là 4 chữ số'),
  gallery: z
    .array(z.string())
    .min(1, 'Vui lòng upload ít nhất một ảnh'),
  content: z.string().optional(),
});

export const projectStep1Schema = projectSchema.pick({
  title: true,
  slug: true,
  category: true,
  location: true,
  area: true,
  year: true,
});

export type ProjectSchema = z.infer<typeof projectSchema>;
export type ProjectStep1Schema = z.infer<typeof projectStep1Schema>;

