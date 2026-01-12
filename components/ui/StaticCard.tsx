'use client';

interface StaticCardProps {
  title: string;
  content: string;
  onClick?: () => void;
  color?: string;
  icon?: React.ReactNode;
}

/**
 * Static card component for users who prefer reduced motion
 * Provides the same functionality as Card3D without animations
 */
export function StaticCard({ 
  title, 
  content, 
  onClick,
  color = '#6366f1',
  icon
}: StaticCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-6 rounded-xl shadow-lg transition-colors hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{ 
        backgroundColor: color,
        color: 'white'
      }}
      aria-label={`${title}: ${content}`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        {icon && (
          <div className="text-4xl" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-bold">
          {title}
        </h3>
        <p className="text-sm opacity-90">
          {content}
        </p>
      </div>
    </button>
  );
}
