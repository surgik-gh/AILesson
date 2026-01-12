/**
 * Unit tests for responsive components
 * Tests component rendering at different breakpoints
 * Validates: Requirements 11.2
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { MobileNav } from '@/components/ui/MobileNav';

// Mock window.matchMedia
const createMatchMedia = (width: number) => {
  return (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('Responsive Components', () => {
  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    window.matchMedia = createMatchMedia(1024);
  });

  describe('ResponsiveContainer', () => {
    it('should render children correctly', () => {
      render(
        <ResponsiveContainer>
          <div data-testid="child">Test Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply correct max-width classes', () => {
      const { container } = render(
        <ResponsiveContainer maxWidth="lg">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-lg');
    });

    it('should apply padding when padding prop is true', () => {
      const { container } = render(
        <ResponsiveContainer padding={true}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/px-4|sm:px-6|lg:px-8/);
    });

    it('should not apply padding when padding prop is false', () => {
      const { container } = render(
        <ResponsiveContainer padding={false}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toMatch(/px-/);
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ResponsiveContainer className="custom-class">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('ResponsiveGrid', () => {
    it('should render children in a grid', () => {
      render(
        <ResponsiveGrid>
          <div data-testid="item-1">Item 1</div>
          <div data-testid="item-2">Item 2</div>
          <div data-testid="item-3">Item 3</div>
        </ResponsiveGrid>
      );

      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });

    it('should apply grid classes', () => {
      const { container } = render(
        <ResponsiveGrid>
          <div>Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toHaveClass('grid');
    });

    it('should apply custom gap', () => {
      const { container } = render(
        <ResponsiveGrid gap={6}>
          <div>Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toMatch(/gap-6/);
    });

    it('should apply responsive column classes', () => {
      const { container } = render(
        <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
          <div>Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toMatch(/grid-cols-1/);
      expect(grid.className).toMatch(/md:grid-cols-2/);
      expect(grid.className).toMatch(/lg:grid-cols-3/);
    });
  });

  describe('MobileNav', () => {
    const mockItems = [
      { label: 'Home', href: '/home', icon: '🏠' },
      { label: 'Profile', href: '/profile', icon: '👤' },
      { label: 'Settings', href: '/settings', icon: '⚙️' },
    ];

    it('should render mobile menu button', () => {
      render(<MobileNav items={mockItems} role="STUDENT" />);
      
      const button = screen.getByLabelText('Toggle menu');
      expect(button).toBeInTheDocument();
    });

    it('should toggle menu on button click', async () => {
      const { container } = render(<MobileNav items={mockItems} role="STUDENT" />);
      
      const button = screen.getByLabelText('Toggle menu');
      const nav = container.querySelector('nav');
      
      // Menu should be translated off-screen initially
      expect(nav).toHaveClass('translate-x-full');
      
      // Click to open
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(nav).toHaveClass('translate-x-0');
      });
    });

    it('should render all navigation items', async () => {
      render(<MobileNav items={mockItems} role="STUDENT" />);
      
      const button = screen.getByLabelText('Toggle menu');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should display role in menu', async () => {
      render(<MobileNav items={mockItems} role="TEACHER" />);
      
      const button = screen.getByLabelText('Toggle menu');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('TEACHER Menu')).toBeInTheDocument();
      });
    });

    it('should close menu when clicking overlay', async () => {
      const { container } = render(<MobileNav items={mockItems} role="STUDENT" />);
      
      const button = screen.getByLabelText('Toggle menu');
      const nav = container.querySelector('nav');
      
      // Open menu
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(nav).toHaveClass('translate-x-0');
      });
      
      // Find and click overlay
      const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50');
      if (overlay) {
        fireEvent.click(overlay);
      }
      
      await waitFor(() => {
        expect(nav).toHaveClass('translate-x-full');
      });
    });

    it('should render icons for navigation items', async () => {
      render(<MobileNav items={mockItems} role="STUDENT" />);
      
      const button = screen.getByLabelText('Open menu');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('🏠')).toBeInTheDocument();
        expect(screen.getByText('👤')).toBeInTheDocument();
        expect(screen.getByText('⚙️')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Breakpoint Behavior', () => {
    it('should handle mobile viewport (< 768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone size
      });

      render(
        <ResponsiveContainer>
          <div data-testid="content">Mobile Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle tablet viewport (768px - 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <ResponsiveContainer>
          <div data-testid="content">Tablet Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should handle desktop viewport (> 1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      render(
        <ResponsiveContainer>
          <div data-testid="content">Desktop Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  describe('Touch Device Support', () => {
    it('should detect touch support', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: null,
      });

      render(<MobileNav items={[]} role="STUDENT" />);
      
      // Component should render without errors on touch devices
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });
  });
});
