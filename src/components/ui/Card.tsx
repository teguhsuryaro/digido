import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padded?: boolean;
  variant?: 'default' | 'elevated' | 'outline' | 'ghost';
}

const variantClasses = {
  default: 'bg-surface-card border border-border shadow-card',
  elevated: 'bg-surface-card border border-border shadow-card-hover',
  outline: 'bg-transparent border-2 border-border',
  ghost: 'bg-surface-secondary border-none shadow-none',
};

export default function Card({
  hoverable = false,
  padded = true,
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-card transition-all duration-200
        ${variantClasses[variant]}
        ${hoverable ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : ''}
        ${padded ? 'p-4' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
