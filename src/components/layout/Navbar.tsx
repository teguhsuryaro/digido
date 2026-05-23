import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, Search, Sun, Moon, ShoppingBag, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useThemeStore } from '@/store/useThemeStore';

export default function Navbar() {
  const navigate = useNavigate();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { theme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-content mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {/* Logo Image Slot — ganti src dengan path logo asli nanti */}
          <img 
            src="/logo.png" 
            alt="DigiDO Logo" 
            className="h-8 w-8 object-contain"
            onError={(e) => {
              // Fallback jika logo belum ada
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-xl font-extrabold text-primary-500">DigiDO</span>
        </Link>

        {/* Desktop Search Bar (hidden on mobile) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-placeholder" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk atau UMKM..."
              className="w-full px-4 py-2 pl-9 rounded-full bg-surface-secondary border border-border text-sm text-content-primary placeholder:text-content-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-border-focus transition-colors"
            />
          </div>
        </form>

        {/* Desktop Navigation Links (hidden on mobile — mobile pakai bottom nav) */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/katalog"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-button text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              }`
            }
          >
            <span className="flex items-center gap-1.5">
              <ShoppingBag size={16} />
              Katalog
            </span>
          </NavLink>
          <NavLink
            to="/pesanan"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-button text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              }`
            }
          >
            <span className="flex items-center gap-1.5">
              <ClipboardList size={16} />
              Pesanan
            </span>
          </NavLink>
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-button text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
              }`
            }
          >
            <span className="flex items-center gap-1.5">
              <User size={16} />
              Profil
            </span>
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-surface-secondary transition-colors" 
            aria-label="Toggle tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Search (mobile only) */}
          <button 
            onClick={() => navigate('/cari')} 
            className="md:hidden p-2 rounded-full hover:bg-surface-secondary transition-colors" 
            aria-label="Cari"
          >
            <Search size={18} />
          </button>

          {/* Cart */}
          <button 
            onClick={() => navigate('/keranjang')} 
            className="p-2 rounded-full hover:bg-surface-secondary transition-colors relative" 
            aria-label="Keranjang"
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
