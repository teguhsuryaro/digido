import { supabase } from './supabase';

// ====== AUTH HELPERS ======

/** Mendapatkan user yang sedang login. Returns null jika tidak ada session. */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
  return user;
}

/** Mendapatkan session aktif. */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
}

// ====== STORAGE HELPERS ======

/**
 * Upload file ke Supabase Storage.
 * @param bucket - Nama bucket (misal: 'avatars', 'products', 'documents')
 * @param path - Path di dalam bucket (misal: 'user-123/profile.jpg')
 * @param file - File object dari input
 * @returns Public URL file yang berhasil diupload, atau null jika gagal
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<string | null> {
  // Validasi ukuran file (maks 2MB)
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran file terlalu besar. Maksimal 2MB.');
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite jika sudah ada
    });

  if (error) {
    console.error('Upload error:', error.message);
    throw new Error(`Gagal mengunggah file: ${error.message}`);
  }

  // Dapatkan public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Hapus file dari Supabase Storage.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Delete error:', error.message);
    throw new Error(`Gagal menghapus file: ${error.message}`);
  }
}
