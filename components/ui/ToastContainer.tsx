'use client';

import React from 'react';
import { useToast } from '@/lib/contexts/ToastContext';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none"
      style={{ maxWidth: '100vw' }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
