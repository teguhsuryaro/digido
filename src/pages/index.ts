import { lazy } from 'react';

// ===== AUTH =====
export const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
export const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
export const MitraRegisterPage = lazy(() => import('@/pages/auth/MitraRegisterPage'));

// ===== CUSTOMER =====
export const HomePage = lazy(() => import('@/pages/customer/HomePage'));
export const UMKMReviewsPage = lazy(() => import('@/pages/customer/UMKMReviewsPage'));
export const SubscriptionPage = lazy(() => import('@/pages/mitra/SubscriptionPage'));

// ===== SUPERADMIN =====
export const SuperadminDashboard = lazy(() => import('@/pages/superadmin/SuperadminDashboard'));
export const SuperadminMitraApproval = lazy(() => import('@/pages/superadmin/SuperadminMitraApproval'));
export const SuperadminReports = lazy(() => import('@/pages/superadmin/SuperadminReports'));
