import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'flex h-11 w-full rounded-lg border border-gray-300 bg-white pl-4 pr-12 py-2 text-base leading-tight font-normal text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
              '[&>option]:py-2 [&>option]:px-4 [&>option]:text-base [&>option]:leading-tight [&>option]:font-normal [&>option]:bg-white [&>option]:text-gray-900 [&>option:checked]:bg-primary-50 [&>option:hover]:bg-gray-100',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <svg
              className="h-5 w-5 text-gray-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

