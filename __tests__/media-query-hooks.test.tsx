/**
 * Unit tests for media query hooks
 * Tests responsive behavior detection
 * Validates: Requirements 11.2
 */

import { renderHook, act } from '@testing-library/react';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  usePrefersReducedMotion,
} from '@/hooks/useMediaQuery';

// Mock window.matchMedia
const createMatchMedia = (matches: boolean) => {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn((event: string, handler: any) => {
      // Store handler for manual triggering
      (createMatchMedia as any).handler = handler;
    }),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('Media Query Hooks', () => {
  beforeEach(() => {
    // Reset window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    window.matchMedia = createMatchMedia(false);
  });

  describe('useMediaQuery', () => {
    it('should return false during SSR (before mount)', () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      
      // Should return false initially to avoid hydration mismatch
      expect(result.current).toBe(false);
    });

    it('should return correct value after mount', () => {
      window.matchMedia = createMatchMedia(true);
      
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      
      // After mount, should reflect actual media query
      expect(result.current).toBe(true);
    });

    it('should update when media query changes', () => {
      const listeners: Array<(e: any) => void> = [];
      
      window.matchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event: string, handler: any) => {
          listeners.push(handler);
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      
      expect(result.current).toBe(false);
      
      // Simulate media query change by calling the listener
      act(() => {
        listeners.forEach(listener => listener({ matches: true }));
      });
      
      expect(result.current).toBe(true);
    });
  });

  describe('useIsMobile', () => {
    it('should return true for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile size
      });
      
      window.matchMedia = createMatchMedia(true);
      
      const { result } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(true);
    });

    it('should return false for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920, // Desktop size
      });
      
      window.matchMedia = createMatchMedia(false);
      
      const { result } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('should return true for tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet size
      });
      
      window.matchMedia = createMatchMedia(true);
      
      const { result } = renderHook(() => useIsTablet());
      
      expect(result.current).toBe(true);
    });

    it('should return false for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile size
      });
      
      window.matchMedia = createMatchMedia(false);
      
      const { result } = renderHook(() => useIsTablet());
      
      expect(result.current).toBe(false);
    });
  });

  describe('useIsDesktop', () => {
    it('should return true for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920, // Desktop size
      });
      
      window.matchMedia = createMatchMedia(true);
      
      const { result } = renderHook(() => useIsDesktop());
      
      expect(result.current).toBe(true);
    });

    it('should return false for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile size
      });
      
      window.matchMedia = createMatchMedia(false);
      
      const { result } = renderHook(() => useIsDesktop());
      
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTouchDevice', () => {
    it('should return true when touch is supported', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: null,
      });
      
      const { result } = renderHook(() => useIsTouchDevice());
      
      expect(result.current).toBe(true);
    });

    it('should return true when maxTouchPoints > 0', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });
      
      const { result } = renderHook(() => useIsTouchDevice());
      
      expect(result.current).toBe(true);
    });

    it('should return false when touch is not supported', () => {
      // Remove touch support
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });
      
      const { result } = renderHook(() => useIsTouchDevice());
      
      expect(result.current).toBe(false);
    });
  });

  describe('usePrefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      window.matchMedia = createMatchMedia(true);
      
      const { result } = renderHook(() => usePrefersReducedMotion());
      
      expect(result.current).toBe(true);
    });

    it('should return false when user does not prefer reduced motion', () => {
      window.matchMedia = createMatchMedia(false);
      
      const { result } = renderHook(() => usePrefersReducedMotion());
      
      expect(result.current).toBe(false);
    });
  });

  describe('Hook cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const removeEventListener = jest.fn();
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener,
        dispatchEvent: jest.fn(),
      });
      
      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      
      unmount();
      
      expect(removeEventListener).toHaveBeenCalled();
    });
  });
});
