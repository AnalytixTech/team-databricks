import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

export default function Rating({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  showCount = false,
  count = 0,
}: RatingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              index < value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
      {showCount && count > 0 && (
        <span className="ml-2 text-sm text-gray-600">({count})</span>
      )}
    </div>
  );
}

