'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('App error:', error);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Что-то пошло не так
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-300">
          Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-300 mb-2">
              Детали ошибки (только в режиме разработки)
            </summary>
            <div className="mt-2">
              <p className="text-sm font-mono text-red-700 dark:text-red-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          </details>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}
