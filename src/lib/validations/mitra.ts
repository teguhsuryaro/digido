import { z } from 'zod';

export const mitraStep1Schema = z.object({
  name: z.string().min(2, 'Nama toko minimal 2 karakter'),
  businessType: z.string().min(1, 'Pilih jenis usaha'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  latitude: z.number(),
  longitude: z.number(),
});

export const mitraStep3Schema = z.object({
  faqs: z.array(z.object({
    question: z.string().min(5, 'Pertanyaan minimal 5 karakter'),
    answer: z.string().min(5, 'Jawaban minimal 5 karakter'),
  })).min(5, 'Minimal 5 FAQ harus diisi'),
});

export type MitraStep1Data = z.infer<typeof mitraStep1Schema>;
export type MitraStep3Data = z.infer<typeof mitraStep3Schema>;
