# 3D Components - Code Splitting Guide

## Overview

The 3D components in this application use React Three Fiber and are optimized for performance through code splitting. This ensures that the heavy 3D libraries are only loaded when needed, reducing initial bundle size.

## Available Components

### Direct Imports (No Code Splitting)
Use these when you need the components on the server or when code splitting is not beneficial:

```typescript
import { Scene, Card3D, ExpertAvatar } from '@/components/3d';
```

### Dynamic Imports (With Code Splitting) - RECOMMENDED
Use these for client components to enable automatic code splitting:

```typescript
import { 
  DynamicScene, 
  DynamicCard3D, 
  DynamicExpertAvatar,
  Dynamic3DWrapper 
} from '@/components/3d';
```

## Usage Examples

### Basic Scene with Dynamic Loading

```typescript
'use client';

import { DynamicScene, DynamicCard3D } from '@/components/3d';

export default function MyPage() {
  return (
    <div className="w-full h-[600px]">
      <DynamicScene theme="DARK">
        <DynamicCard3D
          title="Welcome"
          content="This is a 3D card"
          onClick={() => console.log('Clicked!')}
        />
      </DynamicScene>
    </div>
  );
}
```

### Expert Avatar with Dynamic Loading

```typescript
'use client';

import { DynamicScene, DynamicExpertAvatar } from '@/components/3d';
import { Expert } from '@/types';

export default function ChatPage({ expert }: { expert: Expert }) {
  return (
    <div className="w-full h-[400px]">
      <DynamicScene theme="LIGHT">
        <DynamicExpertAvatar
          expert={expert}
          animated={true}
          interactive={true}
          onInteract={() => console.log('Expert clicked!')}
        />
      </DynamicScene>
    </div>
  );
}
```

### Using the Wrapper for Custom Fallback

```typescript
'use client';

import { Dynamic3DWrapper, DynamicScene } from '@/components/3d';

export default function CustomPage() {
  return (
    <Dynamic3DWrapper 
      fallback={
        <div className="custom-loading">
          Loading amazing 3D content...
        </div>
      }
    >
      <div className="w-full h-[600px]">
        <DynamicScene>
          {/* Your 3D content */}
        </DynamicScene>
      </div>
    </Dynamic3DWrapper>
  );
}
```

## Performance Benefits

### Bundle Size Reduction
- **Before**: ~500KB of Three.js and React Three Fiber loaded on every page
- **After**: 3D libraries only loaded when 3D components are rendered
- **Savings**: Initial bundle reduced by ~500KB for pages without 3D

### Loading Strategy
1. Initial page load: No 3D libraries loaded
2. User navigates to page with 3D: Libraries loaded in background
3. Loading fallback shown while libraries download
4. 3D content rendered once libraries are ready

### Mobile Optimization
All dynamic components automatically:
- Disable SSR (3D doesn't work on server)
- Show loading states
- Optimize for mobile devices when rendered

## Best Practices

### ✅ DO
- Use `Dynamic*` components for all client-side 3D rendering
- Provide meaningful loading states
- Test on slow network connections
- Use mobile optimization flags

### ❌ DON'T
- Import direct components in client components (use Dynamic versions)
- Render 3D on server (it won't work)
- Skip loading states (users need feedback)
- Forget to test on mobile devices

## Migration Guide

If you have existing code using direct imports:

### Before
```typescript
import { Scene, Card3D } from '@/components/3d';
```

### After
```typescript
import { DynamicScene, DynamicCard3D } from '@/components/3d';
```

Then replace component names:
- `Scene` → `DynamicScene`
- `Card3D` → `DynamicCard3D`
- `ExpertAvatar` → `DynamicExpertAvatar`

All props remain the same!

## Troubleshooting

### "Cannot use import statement outside a module"
- Make sure your component has `'use client'` directive
- Use Dynamic components, not direct imports

### Loading state never completes
- Check browser console for errors
- Verify 3D model files exist in `/public/models/`
- Check network tab for failed requests

### Performance still slow on mobile
- Enable `mobileOptimized` prop on components
- Reduce number of 3D elements on screen
- Consider using static images for very low-end devices

## Technical Details

### Code Splitting Implementation
Uses Next.js `dynamic()` with:
- `ssr: false` - Disables server-side rendering
- Custom loading components
- Automatic chunk splitting

### Bundle Analysis
To see the impact of code splitting:
```bash
npm run build
# Check .next/static/chunks/ for separate 3D bundles
```

### Lazy Loading
Components are loaded:
- On demand (when component mounts)
- In parallel (multiple components load together)
- With prefetching (Next.js optimizes loading)
