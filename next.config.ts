import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* React Compiler for optimized rendering */
  reactCompiler: true,

  /* Turbopack Configuration (Next.js 16+) */
  turbopack: {
    // Empty config to acknowledge Turbopack usage
  },

  /* Image Optimization */
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // Cache images for 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  /* Webpack Configuration for Bundle Optimization */
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      // Split chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
            },
            // Separate 3D libraries
            three: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'three',
              priority: 20,
            },
            // Separate React libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              priority: 30,
            },
            // Common chunks
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Handle GLTF/GLB files
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    });

    return config;
  },

  /* Experimental Features */
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three'],
  },

  /* Production Optimizations */
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  /* Performance Monitoring */
  // Uncomment to enable bundle analyzer
  // To use: ANALYZE=true npm run build
  // ...(process.env.ANALYZE === 'true' && {
  //   webpack: (config) => {
  //     const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  //     config.plugins.push(
  //       new BundleAnalyzerPlugin({
  //         analyzerMode: 'static',
  //         openAnalyzer: true,
  //       })
  //     );
  //     return config;
  //   },
  // }),
};

export default nextConfig;
