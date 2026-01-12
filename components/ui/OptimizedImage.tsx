'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage Component
 * 
 * A wrapper around Next.js Image component with additional optimizations:
 * - Automatic lazy loading
 * - Blur placeholder support
 * - Error handling with fallback
 * - Loading state
 * - Responsive sizing
 * - WebP/AVIF format support (automatic via Next.js)
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 75, // Default quality (75 is good balance)
  className = '',
  objectFit = 'cover',
  loading = 'lazy',
  placeholder = 'empty',
  blurDataURL,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Fallback image for errors
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Common props for both fill and fixed size images
  const commonProps = {
    src,
    alt,
    quality,
    priority,
    loading: priority ? 'eager' as const : loading,
    placeholder,
    blurDataURL,
    onLoad: handleLoad,
    onError: handleError,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
  };

  // Responsive sizes for different breakpoints
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  if (fill) {
    return (
      <div className="relative w-full h-full">
        <Image
          {...commonProps}
          fill
          sizes={defaultSizes}
          style={{ objectFit }}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      <Image
        {...commonProps}
        width={width}
        height={height}
        sizes={defaultSizes}
        style={{ objectFit }}
      />
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  );
}

/**
 * Avatar Image Component
 * Optimized for user avatars and expert avatars
 */
interface AvatarImageProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarImage({ src, alt, size = 'md', className = '' }: AvatarImageProps) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  const dimension = sizeMap[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={`rounded-full ${className}`}
      objectFit="cover"
      quality={80}
      sizes={`${dimension}px`}
    />
  );
}

/**
 * Hero Image Component
 * Optimized for large hero/banner images
 */
interface HeroImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export function HeroImage({ src, alt, priority = true, className = '' }: HeroImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority={priority}
      quality={85}
      className={className}
      objectFit="cover"
      sizes="100vw"
    />
  );
}

/**
 * Thumbnail Image Component
 * Optimized for small preview images
 */
interface ThumbnailImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ThumbnailImage({
  src,
  alt,
  width = 200,
  height = 150,
  className = '',
}: ThumbnailImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={70}
      className={`rounded-lg ${className}`}
      objectFit="cover"
      sizes="(max-width: 640px) 50vw, 200px"
    />
  );
}
