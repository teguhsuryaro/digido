interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-3xl',
};

export default function Avatar({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className = '',
}: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`
          rounded-full object-cover
          ${sizeClasses[size]}
          ${className}
        `}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        bg-primary-100 text-primary-700
        dark:bg-primary-900 dark:text-primary-300
        font-semibold
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={alt}
    >
      {initials}
    </div>
  );
}
