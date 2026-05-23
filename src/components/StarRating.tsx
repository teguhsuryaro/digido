import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 'md'
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 16,
    md: 24,
    lg: 36
  };

  const handleRating = (value: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(value);
  };

  const currentRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`
            transition-all duration-200 focus:outline-none
            ${!readonly ? 'hover:scale-125 active:scale-95 cursor-pointer' : 'cursor-default'}
          `}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          onClick={() => handleRating(star)}
          aria-label={`Bintang ${star}`}
        >
          <Star 
            size={starSizes[size]} 
            className={`
              transition-colors duration-200
              ${currentRating >= star 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-content-placeholder opacity-30 fill-transparent'
              }
            `}
          />
        </button>
      ))}
    </div>
  );
}
