# Asset Optimization Guide

## Overview

This guide covers best practices for optimizing images, 3D models, and other assets in the AILesson platform to ensure fast loading times and smooth performance across all devices.

## Image Optimization

### Using OptimizedImage Component

The platform provides an `OptimizedImage` component that wraps Next.js Image with additional optimizations.

#### Basic Usage

```typescript
import { OptimizedImage } from '@/components/ui/OptimizedImage';

function MyComponent() {
  return (
    <OptimizedImage
      src="/images/lesson-thumbnail.jpg"
      alt="Lesson thumbnail"
      width={400}
      height={300}
      quality={75}
    />
  );
}
```

#### Specialized Components

**Avatar Images:**
```typescript
import { AvatarImage } from '@/components/ui/OptimizedImage';

<AvatarImage
  src="/avatars/user-123.jpg"
  alt="User avatar"
  size="md" // sm, md, lg, xl
/>
```

**Hero Images:**
```typescript
import { HeroImage } from '@/components/ui/OptimizedImage';

<HeroImage
  src="/images/hero-banner.jpg"
  alt="Hero banner"
  priority={true} // Load immediately
/>
```

**Thumbnails:**
```typescript
import { ThumbnailImage } from '@/components/ui/OptimizedImage';

<ThumbnailImage
  src="/images/lesson-preview.jpg"
  alt="Lesson preview"
  width={200}
  height={150}
/>
```

### Image Optimization Best Practices

#### 1. Choose the Right Format

- **JPEG**: Photos, complex images with many colors
- **PNG**: Images with transparency, logos, icons
- **WebP**: Modern format, smaller file size (Next.js converts automatically)
- **SVG**: Icons, logos, simple graphics

#### 2. Optimize Image Sizes

**Before uploading images:**

```bash
# Install image optimization tools
npm install -g sharp-cli

# Optimize JPEG
sharp input.jpg -o output.jpg --quality 75

# Optimize PNG
sharp input.png -o output.png --compressionLevel 9

# Convert to WebP
sharp input.jpg -o output.webp --quality 80
```

#### 3. Use Appropriate Dimensions

Don't upload images larger than needed:

| Use Case | Recommended Size |
|----------|-----------------|
| Avatar | 200x200px |
| Thumbnail | 400x300px |
| Card Image | 800x600px |
| Hero Banner | 1920x1080px |
| Full Screen | 2560x1440px |

#### 4. Implement Lazy Loading

```typescript
// Lazy load images below the fold
<OptimizedImage
  src="/images/lesson.jpg"
  alt="Lesson"
  loading="lazy" // Default behavior
  width={400}
  height={300}
/>

// Prioritize above-the-fold images
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero"
  priority={true} // Load immediately
  width={1920}
  height={1080}
/>
```

#### 5. Use Blur Placeholders

```typescript
<OptimizedImage
  src="/images/lesson.jpg"
  alt="Lesson"
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate with sharp
/>
```

Generate blur data URL:
```bash
sharp input.jpg --resize 10 --blur 5 --toFormat jpeg --quality 20 --toBuffer | base64
```

### Next.js Image Configuration

Configure in `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

## 3D Model Optimization

### Model Preparation

#### 1. Reduce Polygon Count

Use Blender to optimize models:

```python
# Blender Python script
import bpy

# Select object
obj = bpy.context.active_object

# Add Decimate modifier
modifier = obj.modifiers.new(name="Decimate", type='DECIMATE')
modifier.ratio = 0.5  # Reduce to 50% of original polygons

# Apply modifier
bpy.ops.object.modifier_apply(modifier="Decimate")
```

**Recommended polygon counts:**
- Mobile: 5,000 - 10,000 triangles
- Desktop: 20,000 - 50,000 triangles
- High-end: 50,000 - 100,000 triangles

#### 2. Optimize Textures

```bash
# Resize textures
sharp texture.png --resize 1024 1024 -o texture-optimized.png

# Compress textures
sharp texture.png --quality 80 -o texture-compressed.png
```

**Recommended texture sizes:**
- Mobile: 512x512 or 1024x1024
- Desktop: 1024x1024 or 2048x2048
- High-end: 2048x2048 or 4096x4096

#### 3. Use glTF Format

Export models as `.glb` (binary glTF):
- Smaller file size
- Faster loading
- Better compression
- Industry standard

#### 4. Compress Models

```bash
# Install gltf-pipeline
npm install -g gltf-pipeline

# Compress glTF
gltf-pipeline -i model.gltf -o model-compressed.glb -d

# With Draco compression (best compression)
gltf-pipeline -i model.gltf -o model-draco.glb -d --draco.compressionLevel 10
```

### Using 3D Optimization Utilities

#### Preload Common Models

```typescript
import { preload3DModels, COMMON_3D_MODELS } from '@/lib/utils/3d-optimization';

// In your app initialization
useEffect(() => {
  preload3DModels(COMMON_3D_MODELS);
}, []);
```

#### Optimize Loaded Models

```typescript
import { optimizeGLTFScene } from '@/lib/utils/3d-optimization';
import { useGLTF } from '@react-three/drei';

function MyModel() {
  const { scene } = useGLTF('/models/avatar.glb');
  
  // Optimize the scene
  const optimizedScene = useMemo(() => {
    return optimizeGLTFScene(scene.clone(), {
      simplifyGeometry: true,
      optimizeMaterials: true,
      castShadows: false, // Disable shadows on mobile
      receiveShadows: false,
    });
  }, [scene]);
  
  return <primitive object={optimizedScene} />;
}
```

#### Dispose Resources

```typescript
import { dispose3DResources } from '@/lib/utils/3d-optimization';

function MyModel() {
  const { scene } = useGLTF('/models/avatar.glb');
  
  useEffect(() => {
    return () => {
      // Clean up on unmount
      dispose3DResources(scene);
    };
  }, [scene]);
  
  return <primitive object={scene} />;
}
```

#### Adaptive Quality

```typescript
import { getRecommended3DQuality } from '@/lib/utils/3d-optimization';

function MyScene() {
  const quality = getRecommended3DQuality();
  
  return (
    <Canvas shadows={quality.shadows}>
      <ambientLight intensity={0.5} />
      {Array.from({ length: quality.maxLights }).map((_, i) => (
        <pointLight key={i} position={[i * 5, 5, 0]} />
      ))}
      {/* Your 3D content */}
    </Canvas>
  );
}
```

#### Performance Monitoring

```typescript
import { Performance3DMonitor } from '@/lib/utils/3d-optimization';

function MyScene() {
  const [quality, setQuality] = useState('high');
  const monitor = useRef(new Performance3DMonitor());
  
  useFrame(() => {
    monitor.current.update();
    
    const recommendation = monitor.current.getQualityRecommendation();
    if (recommendation === 'reduce' && quality !== 'low') {
      setQuality('low');
    } else if (recommendation === 'increase' && quality !== 'high') {
      setQuality('high');
    }
  });
  
  return (
    <Scene mobileOptimized={quality === 'low'}>
      {/* Your content */}
    </Scene>
  );
}
```

## Code Splitting

### Dynamic Imports for 3D Components

Always use dynamic imports for 3D components:

```typescript
import { DynamicScene, DynamicCard3D, DynamicExpertAvatar } from '@/components/3d';

// These components are automatically code-split
function MyPage() {
  return (
    <DynamicScene>
      <DynamicCard3D title="Hello" content="World" />
      <DynamicExpertAvatar expert={expert} />
    </DynamicScene>
  );
}
```

### Route-Based Code Splitting

Next.js automatically splits code by route. Organize your code to maximize this:

```
app/
├── (dashboard)/
│   ├── student/
│   │   ├── lessons/      # Lessons bundle
│   │   ├── quiz/         # Quiz bundle
│   │   └── chat/         # Chat bundle
│   └── teacher/
│       └── create-lesson/ # Lesson creation bundle
```

## Performance Monitoring

### Lighthouse Scores

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### Core Web Vitals

Monitor these metrics:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Analysis

Analyze bundle size:

```bash
# Install bundle analyzer
npm install -D @next/bundle-analyzer

# Add to next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

## Checklist

### Before Deployment

- [ ] All images optimized and using OptimizedImage component
- [ ] 3D models compressed and under recommended polygon count
- [ ] Dynamic imports used for all 3D components
- [ ] Lazy loading enabled for below-the-fold content
- [ ] Blur placeholders generated for hero images
- [ ] Bundle size analyzed and optimized
- [ ] Lighthouse score > 90 for all pages
- [ ] Core Web Vitals meet targets
- [ ] Tested on mobile devices
- [ ] Tested on slow 3G connection

### Ongoing Monitoring

- [ ] Monitor bundle size on each deployment
- [ ] Track Core Web Vitals in production
- [ ] Review Lighthouse scores monthly
- [ ] Optimize new assets before adding
- [ ] Clean up unused assets regularly

## Tools and Resources

### Image Optimization
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [Squoosh](https://squoosh.app/) - Online image optimizer
- [TinyPNG](https://tinypng.com/) - PNG/JPEG compression

### 3D Model Optimization
- [Blender](https://www.blender.org/) - 3D modeling and optimization
- [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) - glTF optimizer
- [glTF Viewer](https://gltf-viewer.donmccurdy.com/) - Test models

### Performance Testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance audit
- [WebPageTest](https://www.webpagetest.org/) - Detailed performance analysis
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Performance profiling

### Bundle Analysis
- [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) - Analyze bundle size
- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) - Visualize bundle

## Common Issues and Solutions

### Issue: Images loading slowly
**Solution**: Use OptimizedImage with appropriate quality settings and lazy loading

### Issue: 3D models causing lag
**Solution**: Reduce polygon count, optimize textures, use LOD (Level of Detail)

### Issue: Large bundle size
**Solution**: Use dynamic imports, code splitting, and tree shaking

### Issue: Poor mobile performance
**Solution**: Enable mobile optimization flags, reduce quality settings, disable shadows

### Issue: Layout shift (CLS)
**Solution**: Always specify width and height for images, use blur placeholders

## Best Practices Summary

1. **Always use OptimizedImage** for all images
2. **Compress 3D models** before uploading
3. **Use dynamic imports** for 3D components
4. **Enable lazy loading** for below-the-fold content
5. **Monitor performance** regularly
6. **Test on mobile** devices and slow connections
7. **Optimize for Core Web Vitals**
8. **Use appropriate quality settings** based on device
9. **Preload critical assets** only
10. **Clean up unused assets** regularly
