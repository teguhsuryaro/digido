import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { getStoredTheme, applyTheme } from '@/utils/theme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Terapkan tema SEBELUM React render (menghindari flash)
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

