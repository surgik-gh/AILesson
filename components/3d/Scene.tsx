'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useState } from 'react';
import { Theme } from '@/types';

export interface SceneProps {
  children: React.ReactNode;
  theme?: Theme;
  enableControls?: boolean;
  mobileOptimized?: boolean;
}

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

export function Scene({ 
  children, 
  theme = 'BASIC', 
  enableControls = false,
  mobileOptimized = true 
}: SceneProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionListener);

    return () => {
      window.removeEventListener('resize', checkMobile);
      motionQuery.removeEventListener('change', motionListener);
    };
  }, []);

  // Map theme to environment preset
  const getEnvironmentPreset = (theme: Theme): 'sunset' | 'dawn' | 'night' | 'warehouse' => {
    switch (theme) {
      case 'LIGHT':
        return 'sunset';
      case 'DARK':
        return 'night';
      case 'BASIC':
      default:
        return 'warehouse';
    }
  };

  // Adjust settings for mobile performance
  const canvasSettings = mobileOptimized && isMobile
    ? {
        dpr: [1, 1.5], // Lower pixel ratio on mobile
        performance: { min: 0.5 }, // Allow frame rate to drop if needed
      }
    : {
        dpr: [1, 2],
        performance: { min: 0.8 },
      };

  // Disable 3D effects if user prefers reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            3D effects disabled (reduced motion preference)
          </p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: isMobile ? 85 : 75 }}
      gl={{ 
        antialias: !isMobile, // Disable antialiasing on mobile for performance
        alpha: true,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
      }}
      style={{ background: 'transparent' }}
      dpr={canvasSettings.dpr as [number, number]}
      performance={canvasSettings.performance}
    >
      <Suspense fallback={<Loader />}>
        {/* Lighting setup - simplified for mobile */}
        <ambientLight intensity={isMobile ? 0.7 : 0.5} />
        {!isMobile && (
          <>
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
          </>
        )}
        
        {/* Theme-based environment - lower quality on mobile */}
        <Environment 
          preset={getEnvironmentPreset(theme)} 
          resolution={isMobile ? 256 : 512}
        />
        
        {/* Optional orbit controls for debugging */}
        {enableControls && <OrbitControls enableDamping={!isMobile} />}
        
        {/* Render children */}
        {children}
      </Suspense>
    </Canvas>
  );
}
