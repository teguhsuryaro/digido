import type { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  baseDelay?: number; // ms antar item
  className?: string;
}

export default function AnimatedList({
  children,
  baseDelay = 50,
  className = '',
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-slide-up"
          style={{
            animationDelay: `${index * baseDelay}ms`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
