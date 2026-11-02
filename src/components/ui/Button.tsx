import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-11 px-5 text-base gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white focus-visible:ring-[#2563EB] shadow-xs',
    secondary: 'bg-[#F1F3F5] hover:bg-[#E5E8EC] text-[#17191C] focus-visible:ring-gray-300',
    outline: 'border border-[#E5E8EC] bg-white hover:bg-[#F7F8FA] text-[#17191C] focus-visible:ring-gray-300 shadow-2xs',
    ghost: 'hover:bg-[#F1F3F5] text-[#17191C] focus-visible:ring-gray-300',
    destructive: 'bg-[#DC2626] hover:bg-[#B91C1C] text-white focus-visible:ring-[#DC2626]',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
