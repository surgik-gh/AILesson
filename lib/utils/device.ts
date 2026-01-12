/**
 * Device detection and capability utilities
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  supportsWebGL: boolean;
  prefersReducedMotion: boolean;
  connectionSpeed: 'slow' | 'medium' | 'fast';
}

/**
 * Detect if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if the device is a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Detect if the device is desktop
 */
export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

/**
 * Detect if the device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detect if WebGL is supported
 */
export function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Estimate connection speed
 */
export function getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'medium';
  }

  const connection = (navigator as any).connection;
  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g') return 'medium';
  return 'slow';
}

/**
 * Get comprehensive device capabilities
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  return {
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isDesktop: isDesktopDevice(),
    isTouch: isTouchDevice(),
    supportsWebGL: supportsWebGL(),
    prefersReducedMotion: prefersReducedMotion(),
    connectionSpeed: getConnectionSpeed(),
  };
}

/**
 * Determine if 3D effects should be enabled
 */
export function should3DBeEnabled(): boolean {
  const capabilities = getDeviceCapabilities();
  
  // Disable 3D if:
  // - User prefers reduced motion
  // - WebGL is not supported
  // - Connection is slow and device is mobile
  if (capabilities.prefersReducedMotion) return false;
  if (!capabilities.supportsWebGL) return false;
  if (capabilities.connectionSpeed === 'slow' && capabilities.isMobile) return false;
  
  return true;
}

/**
 * Get optimal 3D quality settings based on device
 */
export function get3DQualitySettings() {
  const capabilities = getDeviceCapabilities();
  
  if (capabilities.isDesktop && capabilities.connectionSpeed === 'fast') {
    return {
      pixelRatio: 2,
      antialias: true,
      shadows: true,
      environmentResolution: 512,
      geometryDetail: 'high',
    };
  }
  
  if (capabilities.isTablet || (capabilities.isMobile && capabilities.connectionSpeed === 'fast')) {
    return {
      pixelRatio: 1.5,
      antialias: true,
      shadows: false,
      environmentResolution: 256,
      geometryDetail: 'medium',
    };
  }
  
  // Mobile with slow/medium connection
  return {
    pixelRatio: 1,
    antialias: false,
    shadows: false,
    environmentResolution: 128,
    geometryDetail: 'low',
  };
}
