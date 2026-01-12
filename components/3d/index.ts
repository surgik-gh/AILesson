// Direct exports (for server components or when code splitting is not needed)
export { Scene } from './Scene';
export { Card3D } from './Card3D';
export { ExpertAvatar } from './ExpertAvatar';

// Dynamic exports with code splitting (recommended for client components)
export {
  DynamicScene,
  DynamicCard3D,
  DynamicExpertAvatar,
  Dynamic3DWrapper,
} from './Dynamic3DComponents';

// Type exports
export type { SceneProps } from './Scene';
export type { Card3DProps } from './Card3D';
export type { ExpertAvatarProps } from './ExpertAvatar';
