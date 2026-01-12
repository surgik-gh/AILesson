'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface Card3DProps {
  title: string;
  content: string;
  position?: [number, number, number];
  onClick?: () => void;
  color?: string;
  mobileOptimized?: boolean;
}

export function Card3D({ 
  title, 
  content, 
  position = [0, 0, 0], 
  onClick,
  color = '#6366f1',
  mobileOptimized = true
}: Card3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touched, setTouched] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smooth animation on hover and idle - disabled if reduced motion is preferred
  useFrame((state) => {
    if (meshRef.current && !prefersReducedMotion) {
      // Gentle floating animation - less intense on mobile
      const floatIntensity = mobileOptimized && isMobile ? 0.05 : 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * floatIntensity;
      
      // Smooth scale transition
      const targetScale = (hovered || touched) ? 1.1 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
      
      // Gentle rotation on hover - disabled on mobile for performance
      if ((hovered || touched) && !(mobileOptimized && isMobile)) {
        meshRef.current.rotation.y += 0.01;
      }
    } else if (meshRef.current && prefersReducedMotion) {
      // Static position when reduced motion is preferred
      meshRef.current.position.y = position[1];
      const targetScale = (hovered || touched) ? 1.05 : 1; // Subtle scale only
      meshRef.current.scale.set(targetScale, targetScale, targetScale);
    }
  });

  const handlePointerOver = () => {
    if (!isMobile) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    setTouched(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = () => {
    // Provide haptic feedback on touch devices
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Visual feedback for touch
    if (isMobile) {
      setTouched(true);
      setTimeout(() => setTouched(false), 200);
    }
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={[2, 3, 0.2]}
        radius={0.05}
        smoothness={mobileOptimized && isMobile ? 2 : 4} // Lower smoothness on mobile
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        // Add touch event handlers
        onPointerDown={() => isMobile && setTouched(true)}
        onPointerUp={() => isMobile && setTouched(false)}
      >
        <meshStandardMaterial
          color={(hovered || touched) ? new THREE.Color(color).multiplyScalar(1.2) : color}
          metalness={0.8}
          roughness={0.2}
          emissive={(hovered || touched) ? color : '#000000'}
          emissiveIntensity={(hovered || touched) ? 0.2 : 0}
        />
      </RoundedBox>
      
      {/* Title text - larger on mobile */}
      <Text
        position={[0, 1, 0.15]}
        fontSize={isMobile ? 0.25 : 0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {title}
      </Text>
      
      {/* Content text - larger on mobile */}
      <Text
        position={[0, 0, 0.15]}
        fontSize={isMobile ? 0.15 : 0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {content}
      </Text>
    </group>
  );
}
