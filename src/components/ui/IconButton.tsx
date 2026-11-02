import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-11 h-11 p-2.5',
  }[size];

  const variantStyles = {
    ghost: 'hover:bg-[#F1F3F5] text-[#68707A] hover:text-[#17191C]',
    outline: 'border border-[#E5E8EC] bg-white hover:bg-[#F7F8FA] text-[#68707A] hover:text-[#17191C]',
    secondary: 'bg-[#F1F3F5] hover:bg-[#E5E8EC] text-[#17191C]',
    destructive: 'text-[#DC2626] hover:bg-red-50',
  }[variant];

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
