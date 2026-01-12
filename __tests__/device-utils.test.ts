/**
 * Unit tests for device detection utilities
 * Tests device capability detection
 * Validates: Requirements 11.2
 */

import {
  isMobileDevice,
  isTabletDevice,
  isDesktopDevice,
  isTouchDevice,
  supportsWebGL,
  prefersReducedMotion,
  getConnectionSpeed,
  getDeviceCapabilities,
  should3DBeEnabled,
  get3DQualitySettings,
} from '@/lib/utils/device';

describe('Device Detection Utilities', () => {
  beforeEach(() => {
    // Reset window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });
  });

  describe('isMobileDevice', () => {
    it('should return true for mobile viewport width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      expect(isMobileDevice()).toBe(true);
    });

    it('should return true for mobile user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      
      expect(isMobileDevice()).toBe(true);
    });

    it('should return false for desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('isTabletDevice', () => {
    it('should return true for tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      expect(isTabletDevice()).toBe(true);
    });

    it('should return false for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      expect(isTabletDevice()).toBe(false);
    });

    it('should return false for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      expect(isTabletDevice()).toBe(false);
    });
  });

  describe('isDesktopDevice', () => {
    it('should return true for desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      expect(isDesktopDevice()).toBe(true);
    });

    it('should return false for mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      expect(isDesktopDevice()).toBe(false);
    });
  });

  describe('isTouchDevice', () => {
    it('should return true when ontouchstart exists', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: null,
      });
      
      expect(isTouchDevice()).toBe(true);
    });

    it('should return true when maxTouchPoints > 0', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });
      
      expect(isTouchDevice()).toBe(true);
    });

    it('should return false when no touch support', () => {
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });
      
      expect(isTouchDevice()).toBe(false);
    });
  });

  describe('supportsWebGL', () => {
    it('should return true when WebGL is supported', () => {
      // Mock canvas and WebGL context
      const mockCanvas = {
        getContext: jest.fn((type: string) => {
          if (type === 'webgl' || type === 'experimental-webgl') {
            return {}; // Return a truthy value
          }
          return null;
        }),
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      // Also mock WebGLRenderingContext
      (global as any).WebGLRenderingContext = function() {};
      
      expect(supportsWebGL()).toBe(true);
    });

    it('should return false when WebGL is not supported', () => {
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue(null),
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      delete (global as any).WebGLRenderingContext;
      
      expect(supportsWebGL()).toBe(false);
    });

    it('should return false when WebGL throws error', () => {
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('WebGL not supported');
      });
      
      expect(supportsWebGL()).toBe(false);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
      });
      
      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when user does not prefer reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
      });
      
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('getConnectionSpeed', () => {
    it('should return "fast" for 4g connection', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: { effectiveType: '4g' },
      });
      
      expect(getConnectionSpeed()).toBe('fast');
    });

    it('should return "medium" for 3g connection', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: { effectiveType: '3g' },
      });
      
      expect(getConnectionSpeed()).toBe('medium');
    });

    it('should return "slow" for 2g connection', () => {
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: { effectiveType: '2g' },
      });
      
      expect(getConnectionSpeed()).toBe('slow');
    });

    it('should return "medium" when connection API not available', () => {
      delete (navigator as any).connection;
      
      expect(getConnectionSpeed()).toBe('medium');
    });
  });

  describe('getDeviceCapabilities', () => {
    it('should return comprehensive device capabilities', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      const capabilities = getDeviceCapabilities();
      
      expect(capabilities).toHaveProperty('isMobile');
      expect(capabilities).toHaveProperty('isTablet');
      expect(capabilities).toHaveProperty('isDesktop');
      expect(capabilities).toHaveProperty('isTouch');
      expect(capabilities).toHaveProperty('supportsWebGL');
      expect(capabilities).toHaveProperty('prefersReducedMotion');
      expect(capabilities).toHaveProperty('connectionSpeed');
    });

    it('should correctly identify desktop device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      const capabilities = getDeviceCapabilities();
      
      expect(capabilities.isDesktop).toBe(true);
      expect(capabilities.isMobile).toBe(false);
      expect(capabilities.isTablet).toBe(false);
    });
  });

  describe('should3DBeEnabled', () => {
    it('should return false when user prefers reduced motion', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: true,
      });
      
      expect(should3DBeEnabled()).toBe(false);
    });

    it('should return false when WebGL is not supported', () => {
      window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
      });
      
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: jest.fn().mockReturnValue(null),
      } as any);
      
      expect(should3DBeEnabled()).toBe(false);
    });

    it('should return false for slow mobile connection', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: { effectiveType: '2g' },
      });
      
      expect(should3DBeEnabled()).toBe(false);
    });

    it('should return true for capable desktop device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      window.matchMedia = jest.fn().mockReturnValue({
        matches: false,
      });
      
      // Mock WebGL support
      (global as any).WebGLRenderingContext = function() {};
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: jest.fn((type: string) => {
          if (type === 'webgl' || type === 'experimental-webgl') {
            return {}; // Return truthy value
          }
          return null;
        }),
      } as any);
      
      expect(should3DBeEnabled()).toBe(true);
    });
  });

  describe('get3DQualitySettings', () => {
    it('should return high quality settings for desktop with fast connection', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: { effectiveType: '4g' },
      });
      
      const settings = get3DQualitySettings();
      
      expect(settings.pixelRatio).toBe(2);
      expect(settings.antialias).toBe(true);
      expect(settings.shadows).toBe(true);
      expect(settings.geometryDetail).toBe('high');
    });

    it('should return medium quality settings for tablet', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      const settings = get3DQualitySettings();
      
      expect(settings.pixelRatio).toBe(1.5);
      expect(settings.antialias).toBe(true);
      expect(settings.shadows).toBe(false);
      expect(settings.geometryDetail).toBe('medium');
    });

    it('should return low quality settings for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      // Set medium connection speed to trigger mobile low quality
      Object.defineProperty(navigator, 'connection', {
        writable: true,
        configurable: true,
        value: { effectiveType: '3g' },
      });
      
      const settings = get3DQualitySettings();
      
      expect(settings.pixelRatio).toBe(1);
      expect(settings.antialias).toBe(false);
      expect(settings.shadows).toBe(false);
      expect(settings.geometryDetail).toBe('low');
    });
  });
});
