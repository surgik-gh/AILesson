'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has enabled reduced motion in their system settings
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return;
    }

    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Create event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get animation duration based on reduced motion preference
 * Returns 0 if reduced motion is preferred, otherwise returns the provided duration
 */
export function useAnimationDuration(duration: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : duration;
}

/**
 * Hook to conditionally apply animations based on reduced motion preference
 * Returns the animation config if motion is allowed, otherwise returns a static config
 */
export function useConditionalAnimation<T>(
  animationConfig: T,
  staticConfig: T
): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? staticConfig : animationConfig;
}
