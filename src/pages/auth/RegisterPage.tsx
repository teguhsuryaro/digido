import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { getAuthErrorMessage } from '@/utils/auth-errors';
import { toast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) {
        toast.error(getAuthErrorMessage(error.message));
        return;
      }

      toast.success('Registrasi berhasil! Selamat datang di DigiDO.');
      navigate('/');
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="/logo.png" alt="DigiDO Logo" className="h-16 w-16 object-contain mb-3" />
        <h2 className="text-xl font-bold text-content-primary text-center">
          Buat Akun Baru
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="contoh@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimal 6 karakter"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Konfirmasi Password"
          type="password"
          placeholder="Ulangi password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          Daftar
        </Button>
      </form>

      <p className="text-sm text-content-secondary text-center mt-6">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-primary-500 font-semibold hover:underline">
          Masuk di sini
        </Link>
      </p>
    </PageTransition>
  );
}
