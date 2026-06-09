import { NavLink } from 'react-router-dom';
import { User, Settings, Truck, CreditCard, Shield } from 'lucide-react';

const tabs = [
  { to: '/mitra/pengaturan', label: 'Operasional', icon: Settings, end: true },
  { to: '/mitra/pengaturan/profil', label: 'Profil Toko', icon: User },
  { to: '/mitra/pengaturan/pengiriman', label: 'Pengiriman', icon: Truck },
  { to: '/mitra/pengaturan/finansial', label: 'Keuangan', icon: CreditCard },
  { to: '/mitra/pengaturan/paket', label: 'Langganan', icon: Shield },
];

export default function SettingsTabs() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6 border-b border-border">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'bg-surface-secondary text-content-secondary border border-transparent hover:bg-surface-tertiary'
              }`
            }
          >
            <Icon size={16} />
            {tab.label}
          </NavLink>
        );
      })}
    </div>
  );
}
