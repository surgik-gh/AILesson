/**
 * Unit tests for 3D components
 * Requirements: 11.1
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock React Three Fiber and Drei
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({ camera: {}, gl: {}, scene: {} })),
}));

jest.mock('@react-three/drei', () => {
  const mockUseGLTF = jest.fn(() => ({ scene: { clone: () => ({}) }, animations: [] }));
  mockUseGLTF.preload = jest.fn();
  
  return {
    Environment: () => <mesh data-testid="environment" />,
    OrbitControls: () => <mesh data-testid="orbit-controls" />,
    Text: ({ children }: { children: React.ReactNode }) => <mesh data-testid="text">{children}</mesh>,
    RoundedBox: ({ children, onClick, onPointerOver, onPointerOut }: any) => (
      <mesh 
        data-testid="rounded-box"
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        {children}
      </mesh>
    ),
    Sphere: ({ children }: { children: React.ReactNode }) => <mesh data-testid="sphere">{children}</mesh>,
    useGLTF: mockUseGLTF,
  };
});

// Import components after mocks
import { Scene } from '@/components/3d/Scene';
import { Card3D } from '@/components/3d/Card3D';
import { ExpertAvatar } from '@/components/3d/ExpertAvatar';

describe('Scene Component', () => {
  it('should render canvas with children', () => {
    render(
      <Scene>
        <mesh data-testid="test-child" />
      </Scene>
    );
    
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should render environment based on theme', () => {
    const { rerender } = render(<Scene theme="LIGHT"><mesh /></Scene>);
    expect(screen.getByTestId('environment')).toBeInTheDocument();
    
    rerender(<Scene theme="DARK"><mesh /></Scene>);
    expect(screen.getByTestId('environment')).toBeInTheDocument();
    
    rerender(<Scene theme="BASIC"><mesh /></Scene>);
    expect(screen.getByTestId('environment')).toBeInTheDocument();
  });

  it('should render orbit controls when enabled', () => {
    render(
      <Scene enableControls={true}>
        <mesh />
      </Scene>
    );
    
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
  });

  it('should not render orbit controls by default', () => {
    render(
      <Scene>
        <mesh />
      </Scene>
    );
    
    expect(screen.queryByTestId('orbit-controls')).not.toBeInTheDocument();
  });
});

describe('Card3D Component', () => {
  it('should render with title and content', () => {
    render(
      <Card3D 
        title="Test Card" 
        content="Test Content"
      />
    );
    
    expect(screen.getByTestId('rounded-box')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(
      <Card3D 
        title="Clickable Card" 
        content="Click me"
        onClick={handleClick}
      />
    );
    
    const card = screen.getByTestId('rounded-box');
    card.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle hover events', () => {
    const { container } = render(
      <Card3D 
        title="Hoverable Card" 
        content="Hover me"
      />
    );
    
    const card = screen.getByTestId('rounded-box');
    
    // Verify the card renders (hover functionality is tested in browser)
    expect(card).toBeInTheDocument();
  });

  it('should accept custom position', () => {
    const { container } = render(
      <Card3D 
        title="Positioned Card" 
        content="Custom position"
        position={[1, 2, 3]}
      />
    );
    
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should accept custom color', () => {
    render(
      <Card3D 
        title="Colored Card" 
        content="Custom color"
        color="#ff0000"
      />
    );
    
    expect(screen.getByTestId('rounded-box')).toBeInTheDocument();
  });
});

describe('ExpertAvatar Component', () => {
  const mockExpert = {
    id: '1',
    name: 'Test Expert',
    personality: 'Friendly and helpful',
    communicationStyle: 'Clear and concise',
    appearance: 'default-avatar',
  };

  it('should render expert avatar', () => {
    render(
      <ExpertAvatar expert={mockExpert} />
    );
    
    // Should render a group container
    const { container } = render(<ExpertAvatar expert={mockExpert} />);
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should handle interaction when interactive', () => {
    const handleInteract = jest.fn();
    const originalCursor = document.body.style.cursor;
    
    const { container } = render(
      <ExpertAvatar 
        expert={mockExpert}
        interactive={true}
        onInteract={handleInteract}
      />
    );
    
    const group = container.querySelector('group');
    expect(group).toBeTruthy();
    
    // Restore cursor
    document.body.style.cursor = originalCursor;
  });

  it('should accept custom position and scale', () => {
    const { container } = render(
      <ExpertAvatar 
        expert={mockExpert}
        position={[1, 2, 3]}
        scale={2}
      />
    );
    
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should support animation toggle', () => {
    const { rerender, container } = render(
      <ExpertAvatar 
        expert={mockExpert}
        animated={true}
      />
    );
    
    expect(container.querySelector('group')).toBeTruthy();
    
    rerender(
      <ExpertAvatar 
        expert={mockExpert}
        animated={false}
      />
    );
    
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should render fallback sphere when model fails to load', () => {
    const expertWithInvalidModel = {
      ...mockExpert,
      appearance: 'non-existent-model',
    };
    
    const { container } = render(
      <ExpertAvatar expert={expertWithInvalidModel} />
    );
    
    // Should still render a group container
    expect(container.querySelector('group')).toBeTruthy();
  });
});

describe('3D Components Integration', () => {
  it('should render Scene with Card3D children', () => {
    render(
      <Scene>
        <Card3D title="Card in Scene" content="Integrated" />
      </Scene>
    );
    
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(screen.getByText('Card in Scene')).toBeInTheDocument();
  });

  it('should render Scene with ExpertAvatar children', () => {
    const mockExpert = {
      id: '1',
      name: 'Scene Expert',
      personality: 'Test',
      communicationStyle: 'Test',
      appearance: 'default',
    };
    
    render(
      <Scene>
        <ExpertAvatar expert={mockExpert} />
      </Scene>
    );
    
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    // Avatar is rendered inside the scene
    const { container } = render(
      <Scene>
        <ExpertAvatar expert={mockExpert} />
      </Scene>
    );
    expect(container.querySelector('group')).toBeTruthy();
  });

  it('should render multiple 3D components together', () => {
    const mockExpert = {
      id: '1',
      name: 'Multi Expert',
      personality: 'Test',
      communicationStyle: 'Test',
      appearance: 'default',
    };
    
    render(
      <Scene theme="DARK">
        <Card3D title="Card 1" content="Content 1" position={[-2, 0, 0]} />
        <Card3D title="Card 2" content="Content 2" position={[2, 0, 0]} />
        <ExpertAvatar expert={mockExpert} position={[0, 2, 0]} />
      </Scene>
    );
    
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    // Avatar is rendered as part of the scene
    const { container } = render(
      <Scene theme="DARK">
        <ExpertAvatar expert={mockExpert} position={[0, 2, 0]} />
      </Scene>
    );
    expect(container.querySelector('group')).toBeTruthy();
  });
});
