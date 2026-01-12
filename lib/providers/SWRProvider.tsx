'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global fetcher
        fetcher: async (url: string) => {
          const res = await fetch(url);
          
          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.');
            (error as any).info = await res.json();
            (error as any).status = res.status;
            throw error;
          }
          
          return res.json();
        },
        
        // Global configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        
        // Cache provider (optional - uses default Map)
        // Can be replaced with a more sophisticated cache like Redis
        provider: () => new Map(),
        
        // On error callback
        onError: (error, key) => {
          console.error(`SWR Error for key "${key}":`, error);
          
          // You can add error tracking here (e.g., Sentry)
          // if (error.status !== 403 && error.status !== 404) {
          //   trackError(error);
          // }
        },
        
        // On success callback
        onSuccess: (data, key, config) => {
          // You can add analytics here
          // console.log(`SWR Success for key "${key}"`);
        },
        
        // Loading timeout
        loadingTimeout: 3000,
        
        // On loading slow callback
        onLoadingSlow: (key, config) => {
          console.warn(`SWR loading slow for key "${key}"`);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
