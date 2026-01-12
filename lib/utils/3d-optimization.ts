/**
 * 3D Model Optimization Utilities
 * 
 * Utilities for optimizing 3D models and assets for better performance
 */

import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Preload 3D models to improve initial render time
 * Call this in your app initialization or on route prefetch
 */
export function preload3DModels(modelPaths: string[]) {
  if (typeof window === 'undefined') return;
  
  modelPaths.forEach((path) => {
    try {
      useGLTF.preload(path);
    } catch (error) {
      console.warn(`Failed to preload 3D model: ${path}`, error);
    }
  });
}

/**
 * Common 3D models to preload
 */
export const COMMON_3D_MODELS = [
  '/models/default-avatar.glb',
  '/models/expert-avatar-1.glb',
  '/models/expert-avatar-2.glb',
  '/models/expert-avatar-3.glb',
];

/**
 * Optimize a loaded GLTF scene for better performance
 * - Reduces geometry complexity
 * - Optimizes materials
 * - Disposes of unnecessary data
 */
export function optimizeGLTFScene(scene: THREE.Group, options: {
  simplifyGeometry?: boolean;
  optimizeMaterials?: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
} = {}) {
  const {
    simplifyGeometry = true,
    optimizeMaterials = true,
    castShadows = false,
    receiveShadows = false,
  } = options;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Optimize geometry
      if (simplifyGeometry && child.geometry) {
        // Compute vertex normals if not present
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        
        // Dispose of unnecessary attributes
        if (child.geometry.attributes.uv2) {
          child.geometry.deleteAttribute('uv2');
        }
      }

      // Optimize materials
      if (optimizeMaterials && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        
        // Reduce material complexity for better performance
        if (material.map) {
          material.map.minFilter = THREE.LinearFilter;
          material.map.generateMipmaps = false;
        }
        
        // Disable features not needed for mobile
        material.flatShading = false;
        material.needsUpdate = true;
      }

      // Shadow settings
      child.castShadow = castShadows;
      child.receiveShadow = receiveShadows;
    }
  });

  return scene;
}

/**
 * Get optimized texture settings based on device capabilities
 */
export function getOptimizedTextureSettings() {
  if (typeof window === 'undefined') {
    return {
      anisotropy: 1,
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    };
  }

  const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
  const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;

  if (isMobile || isLowEnd) {
    return {
      anisotropy: 1,
      generateMipmaps: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    };
  }

  return {
    anisotropy: 4,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  };
}

/**
 * Dispose of 3D resources to free memory
 * Call this when unmounting components or switching scenes
 */
export function dispose3DResources(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }

      // Dispose materials
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => disposeMaterial(material));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

/**
 * Dispose of a material and its textures
 */
function disposeMaterial(material: THREE.Material) {
  // Dispose textures
  Object.keys(material).forEach((key) => {
    const value = (material as any)[key];
    if (value && typeof value === 'object' && 'minFilter' in value) {
      value.dispose();
    }
  });

  // Dispose material
  material.dispose();
}

/**
 * Calculate appropriate LOD (Level of Detail) based on distance
 */
export function calculateLOD(distance: number): 'high' | 'medium' | 'low' {
  if (distance < 5) return 'high';
  if (distance < 10) return 'medium';
  return 'low';
}

/**
 * Get optimized renderer settings based on device
 */
export function getOptimizedRendererSettings() {
  if (typeof window === 'undefined') {
    return {
      antialias: false,
      powerPreference: 'low-power' as const,
      precision: 'lowp' as const,
    };
  }

  const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
  const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;

  if (isMobile || isLowEnd) {
    return {
      antialias: false,
      powerPreference: 'low-power' as const,
      precision: 'lowp' as const,
      logarithmicDepthBuffer: false,
    };
  }

  return {
    antialias: true,
    powerPreference: 'high-performance' as const,
    precision: 'highp' as const,
    logarithmicDepthBuffer: true,
  };
}

/**
 * Lazy load 3D model with error handling
 */
export async function lazy3DModelLoader(modelPath: string): Promise<THREE.Group | null> {
  try {
    // Note: This function should be called from within a React component
    // that has access to useGLTF hook. This is a utility for reference.
    console.warn('lazy3DModelLoader should be used within React components with useGLTF');
    return null;
  } catch (error) {
    console.error(`Failed to load 3D model: ${modelPath}`, error);
    return null;
  }
}

/**
 * Check if device supports WebGL 2
 */
export function supportsWebGL2(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('experimental-webgl2')
    );
  } catch (e) {
    return false;
  }
}

/**
 * Get recommended quality settings based on device
 */
export function getRecommended3DQuality(): {
  shadows: boolean;
  antialiasing: boolean;
  postProcessing: boolean;
  particleCount: number;
  maxLights: number;
} {
  if (typeof window === 'undefined') {
    return {
      shadows: false,
      antialiasing: false,
      postProcessing: false,
      particleCount: 50,
      maxLights: 2,
    };
  }

  const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
  const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  const hasWebGL2 = supportsWebGL2();

  if (isMobile || isLowEnd) {
    return {
      shadows: false,
      antialiasing: false,
      postProcessing: false,
      particleCount: 50,
      maxLights: 2,
    };
  }

  if (!hasWebGL2) {
    return {
      shadows: false,
      antialiasing: true,
      postProcessing: false,
      particleCount: 100,
      maxLights: 3,
    };
  }

  return {
    shadows: true,
    antialiasing: true,
    postProcessing: true,
    particleCount: 200,
    maxLights: 5,
  };
}

/**
 * Monitor 3D performance and adjust quality dynamically
 */
export class Performance3DMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private readonly targetFPS = 60;
  private readonly minFPS = 30;

  update() {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000) {
      this.fps = (this.frameCount * 1000) / deltaTime;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  shouldReduceQuality(): boolean {
    return this.fps < this.minFPS;
  }

  shouldIncreaseQuality(): boolean {
    return this.fps > this.targetFPS * 0.9;
  }

  getFPS(): number {
    return this.fps;
  }

  getQualityRecommendation(): 'reduce' | 'maintain' | 'increase' {
    if (this.shouldReduceQuality()) return 'reduce';
    if (this.shouldIncreaseQuality()) return 'increase';
    return 'maintain';
  }
}
