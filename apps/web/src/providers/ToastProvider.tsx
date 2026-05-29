'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0e1628',
          color: '#f0f4ff',
          border: '1px solid #1e2d4e',
          borderRadius: '10px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          maxWidth: '380px',
        },
        success: {
          iconTheme: {
            primary: '#C9A84C',
            secondary: '#080d1a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
