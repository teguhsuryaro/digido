import { Outlet } from 'react-router-dom';
import PageErrorBoundary from '@/components/PageErrorBoundary';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-primary flex">
      {/* Left Panel — Hero/Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden">
        {/* Company Photo Spot — ganti src nanti */}
        <img 
          src="/company-photo.jpg" 
          alt="DigiDO - Digitalisasi UMKM" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          onError={(e) => {
            // Fallback if image doesn't exist
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col justify-center items-start p-12 xl:p-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <img 
              src="/logo.png" 
              alt="DigiDO Logo" 
              className="h-12 w-12 object-contain" 
              onError={(e) => {
                // Fallback if logo doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-4xl font-extrabold">DigiDO</h1>
          </div>
          <p className="text-xl font-medium text-primary-100 max-w-md leading-relaxed">
            Platform digitalisasi UMKM dan Delivery Order untuk Indonesia.
          </p>
          <p className="text-sm text-primary-200 mt-4 max-w-sm leading-relaxed">
            Temukan produk terbaik dari UMKM lokal, pesan langsung dari rumah, dan dukung ekonomi daerah.
          </p>
          
          {/* Decorative elements */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-500/10 rounded-full" />
          <div className="absolute bottom-20 left-0 w-60 h-60 bg-primary-400/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo (Mobile only — desktop logo sudah di panel kiri) */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src="/logo.png" 
                alt="DigiDO Logo" 
                className="h-10 w-10 object-contain" 
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <h1 className="text-3xl font-extrabold text-primary-500">DigiDO</h1>
            </div>
            <p className="text-sm text-content-secondary">
              Digitalisasi UMKM & Delivery Order
            </p>
          </div>

          {/* Auth Form Card */}
          <div className="bg-surface-card rounded-card border border-border shadow-card p-6 sm:p-8">
            <PageErrorBoundary>
              <Outlet />
            </PageErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
