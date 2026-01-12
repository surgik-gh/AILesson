import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  label = 'Загрузка...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} role="status" aria-live="polite">
      <svg
        className={`animate-spin text-indigo-600 dark:text-indigo-400 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
      {size !== 'sm' && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</p>
      )}
    </div>
  );
}

export function LoadingOverlay({ message = 'Загрузка...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <LoadingSpinner size="lg" label={message} />
      </div>
    </div>
  );
}

export function LoadingButton({ 
  loading, 
  children, 
  className = '',
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`relative ${className}`}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}
