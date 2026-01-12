'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { Expert } from '@/types';

export interface ExpertAvatarProps {
  expert: Expert;
  position?: [number, number, number];
  scale?: number;
  animated?: boolean;
  interactive?: boolean;
  onInteract?: () => void;
  mobileOptimized?: boolean;
}

export function ExpertAvatar({ 
  expert, 
  position = [0, 0, 0],
  scale = 1.5,
  animated = true,
  interactive = false,
  onInteract,
  mobileOptimized = true
}: ExpertAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Try to load GLTF model, fallback to sphere if not available
  let scene: THREE.Group | null = null;
  try {
    const gltf = useGLTF(`/models/${expert.appearance}.glb`, true);
    scene = gltf.scene;
    if (!modelLoaded) {
      setModelLoaded(true);
    }
  } catch (error) {
    if (!modelError) {
      setModelError(true);
      console.warn(`Failed to load model for expert ${expert.name}, using fallback`);
    }
  }

  // Animation mixer for GLTF animations
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    // Skip complex animations on mobile
    if (scene && animated && !(mobileOptimized && isMobile)) {
      try {
        const gltf = useGLTF(`/models/${expert.appearance}.glb`);
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(scene);
          const action = mixerRef.current.clipAction(gltf.animations[0]);
          action.play();
        }
      } catch (error) {
        // No animations available
      }
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [scene, animated, expert.appearance, isMobile, mobileOptimized]);

  // Animation frame updates
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Update animation mixer - skip on mobile
      if (animated && mixerRef.current && !(mobileOptimized && isMobile)) {
        mixerRef.current.update(delta);
      }

      // Idle floating animation - reduced intensity on mobile
      if (animated) {
        const floatIntensity = mobileOptimized && isMobile ? 0.03 : 0.05;
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * floatIntensity;
      }

      // Rotation on hover/touch
      const isInteracting = hovered || touched;
      if (interactive && isInteracting && !(mobileOptimized && isMobile)) {
        groupRef.current.rotation.y += delta * 0.5;
      } else if (animated && !(mobileOptimized && isMobile)) {
        // Gentle idle rotation - disabled on mobile
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      }

      // Scale animation on hover/touch
      const targetScale = isInteracting ? scale * 1.1 : scale;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  const handlePointerOver = () => {
    if (interactive && !isMobile) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    if (interactive) {
      setHovered(false);
      setTouched(false);
      document.body.style.cursor = 'auto';
    }
  };

  const handleClick = () => {
    // Haptic feedback on mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Visual feedback for touch
    if (isMobile) {
      setTouched(true);
      setTimeout(() => setTouched(false), 200);
    }
    
    if (interactive && onInteract) {
      onInteract();
    }
  };

  // Lower geometry detail on mobile
  const sphereDetail = mobileOptimized && isMobile ? 16 : 32;

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={() => isMobile && setTouched(true)}
      onPointerUp={() => isMobile && setTouched(false)}
    >
      {scene && !modelError ? (
        <primitive object={scene.clone()} />
      ) : (
        // Fallback sphere avatar with color based on expert name
        <Sphere args={[0.5, sphereDetail, sphereDetail]}>
          <meshStandardMaterial
            color={getColorFromString(expert.name)}
            metalness={0.6}
            roughness={0.3}
            emissive={(hovered || touched) ? getColorFromString(expert.name) : '#000000'}
            emissiveIntensity={(hovered || touched) ? 0.3 : 0}
          />
        </Sphere>
      )}
    </group>
  );
}

// Helper function to generate consistent color from string
function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// Preload common models (only in browser environment)
if (typeof window !== 'undefined' && useGLTF.preload) {
  useGLTF.preload('/models/default-avatar.glb');
}
