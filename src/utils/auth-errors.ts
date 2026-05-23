const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email atau password salah. Silakan coba lagi.',
  'Email not confirmed': 'Email belum diverifikasi. Cek inbox email Anda.',
  'User already registered': 'Email sudah terdaftar. Silakan login atau gunakan email lain.',
  'Password should be at least 6 characters': 'Password minimal 6 karakter.',
  'Email rate limit exceeded': 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.',
  'Network request failed': 'Koneksi internet bermasalah. Periksa jaringan Anda.',
};

export function getAuthErrorMessage(error: string): string {
  return AUTH_ERROR_MESSAGES[error] || `Terjadi kesalahan: ${error}`;
}
