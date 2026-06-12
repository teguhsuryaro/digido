import { lazy } from 'react';

// ===== AUTH =====
export const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
export const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
export const MitraRegisterPage = lazy(() => import('@/pages/auth/MitraRegisterPage'));

// ===== CUSTOMER =====
export const HomePage = lazy(() => import('@/pages/customer/HomePage'));
export const UMKMReviewsPage = lazy(() => import('@/pages/customer/UMKMReviewsPage'));
export const UMKMListPage = lazy(() => import('@/pages/customer/UMKMListPage'));
export const UMKMDetailPage = lazy(() => import('@/pages/customer/UMKMDetailPage'));
export const SearchResultsPage = lazy(() => import('@/pages/customer/SearchResultsPage'));
export const CartPage = lazy(() => import('@/pages/customer/CartPage'));
export const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'));
export const WalletPage = lazy(() => import('@/pages/customer/WalletPage'));
export const OrdersPage = lazy(() => import('@/pages/customer/OrdersPage'));
export const OrderDetailPage = lazy(() => import('@/pages/customer/OrderDetailPage'));
export const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));

// ===== MITRA =====
export const MitraDashboardPage = lazy(() => import('@/pages/mitra/MitraDashboardPage'));
export const MitraProfilePage = lazy(() => import('@/pages/mitra/MitraProfilePage'));
export const InventarisPage = lazy(() => import('@/pages/mitra/InventarisPage'));
export const OrderManagementPage = lazy(() => import('@/pages/mitra/OrderManagementPage'));
export const DeliverySettingsPage = lazy(() => import('@/pages/mitra/DeliverySettingsPage'));
export const OperasionalPage = lazy(() => import('@/pages/mitra/OperasionalPage'));
export const FinansialPage = lazy(() => import('@/pages/mitra/FinansialPage'));
export const LiveChatPage = lazy(() => import('@/pages/mitra/LiveChatPage'));
export const SubscriptionPage = lazy(() => import('@/pages/mitra/SubscriptionPage'));
export const MitraSettingsPage = lazy(() => import('@/pages/mitra/MitraSettingsPage'));

// ===== SUPERADMIN =====
export const SuperadminDashboard = lazy(() => import('@/pages/superadmin/SuperadminDashboard'));
export const SuperadminMitraApproval = lazy(() => import('@/pages/superadmin/SuperadminMitraApproval'));
export const SuperadminReports = lazy(() => import('@/pages/superadmin/SuperadminReports'));
