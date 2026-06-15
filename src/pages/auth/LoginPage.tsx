import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { getAuthErrorMessage } from '@/utils/auth-errors';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Ambil intended URL (dari PrivateRoute redirect)
  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(getAuthErrorMessage(error.message));
        return;
      }

      if (authData.user && authData.session) {
        // Ambil profile untuk menentukan redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profile) {
          useAuthStore.getState().setAuth(authData.user, authData.session);
          useAuthStore.getState().setProfile(profile as any);

          toast.success(`Selamat datang kembali, ${(profile as any).full_name}!`);

          // Redirect berdasarkan role
          if ((profile as any).role === 'superadmin') {
            navigate('/superadmin', { replace: true });
          } else if ((profile as any).role === 'mitra') {
            navigate('/mitra', { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="/logo.png" alt="DigiDO Logo" className="h-16 w-16 object-contain mb-3" />
        <h2 className="text-xl font-bold text-content-primary text-center">
          Masuk ke DigiDO
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          placeholder="Masukkan password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          Masuk
        </Button>
      </form>

      <p className="text-sm text-content-secondary text-center mt-6">
        Belum punya akun?{' '}
        <Link to="/register" className="text-primary-500 font-semibold hover:underline">
          Daftar di sini
        </Link>
      </p>
    </PageTransition>
  );
}
