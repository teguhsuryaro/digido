interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

export default function Skeleton({ className = '', circle = false }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse
        ${circle ? 'rounded-full' : 'rounded-card'}
        bg-gradient-to-r from-surface-secondary via-border/50 to-surface-secondary
        bg-[length:200%_100%] animate-shimmer
        ${className}
      `}
    />
  );
}
