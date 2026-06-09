import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, 'Nama produk minimal 3 karakter'),
  description: z.string().nullable().optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  daily_stock: z.number().min(0).nullable().optional(),
  discount_percentage: z.number().min(0, 'Diskon tidak boleh negatif').max(100, 'Diskon maksimal 100%').nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_available: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
