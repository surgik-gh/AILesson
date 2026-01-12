'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';

// Loading fallback component
function Loading3D() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg">
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Loading 3D components...
        </p>
      </div>
    </div>
  );
}

// Dynamically import Scene component with code splitting
export const DynamicScene = dynamic(
  () => import('./Scene').then((mod) => mod.Scene),
  {
    loading: () => <Loading3D />,
    ssr: false, // Disable SSR for 3D components
  }
);

// Dynamically import Card3D component with code splitting
export const DynamicCard3D = dynamic(
  () => import('./Card3D').then((mod) => mod.Card3D),
  {
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse bg-indigo-200 dark:bg-indigo-900 rounded-lg w-32 h-48"></div>
      </div>
    ),
    ssr: false,
  }
);

// Dynamically import ExpertAvatar component with code splitting
export const DynamicExpertAvatar = dynamic(
  () => import('./ExpertAvatar').then((mod) => mod.ExpertAvatar),
  {
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse bg-purple-200 dark:bg-purple-900 rounded-full w-24 h-24"></div>
      </div>
    ),
    ssr: false,
  }
);

// Wrapper component that provides Suspense boundary
interface Dynamic3DWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Dynamic3DWrapper({ children, fallback }: Dynamic3DWrapperProps) {
  return (
    <Suspense fallback={fallback || <Loading3D />}>
      {children}
    </Suspense>
  );
}

// Export types for convenience
export type { SceneProps } from './Scene';
export type { Card3DProps } from './Card3D';
export type { ExpertAvatarProps } from './ExpertAvatar';
