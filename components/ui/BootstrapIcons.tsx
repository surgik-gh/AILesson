'use client';

import 'bootstrap-icons/font/bootstrap-icons.css';

interface IconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  'aria-label'?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

export function BootstrapIcon({ name, className = '', size = 'md', ...props }: IconProps) {
  return (
    <i 
      className={`bi bi-${name} ${sizeClasses[size]} ${className}`}
      role="img"
      {...props}
    />
  );
}

// Commonly used icons as named exports
export const Icons = {
  Book: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="book" {...props} />,
  BookOpen: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="book-half" {...props} />,
  Trophy: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="trophy" {...props} />,
  Chat: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="chat-dots" {...props} />,
  Robot: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="robot" {...props} />,
  Coin: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="coin" {...props} />,
  Settings: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="gear" {...props} />,
  User: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="person" {...props} />,
  Users: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="people" {...props} />,
  Check: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="check-lg" {...props} />,
  Plus: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="plus-lg" {...props} />,
  Pencil: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="pencil" {...props} />,
  Award: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="award" {...props} />,
  Star: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="star-fill" {...props} />,
  Chart: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="bar-chart" {...props} />,
  Send: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="send" {...props} />,
  Calendar: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="calendar" {...props} />,
  House: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="house" {...props} />,
  ArrowLeft: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="arrow-left" {...props} />,
  ArrowRight: (props: Omit<IconProps, 'name'>) => <BootstrapIcon name="arrow-right" {...props} />,
};
