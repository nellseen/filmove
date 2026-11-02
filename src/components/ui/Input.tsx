import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftElement, rightElement, disabled, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftElement && (
          <div className="absolute left-3 flex items-center pointer-events-none text-[#68707A]">
            {leftElement}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full h-10 px-3.5 ${leftElement ? 'pl-9' : ''} ${
            rightElement ? 'pr-9' : ''
          } bg-white text-[#17191C] placeholder-[#68707A] text-sm rounded-lg border ${
            error ? 'border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#E5E8EC] focus:border-[#2563EB] focus:ring-[#2563EB]'
          } focus:outline-none focus:ring-1 transition-all disabled:bg-[#F1F3F5] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center pointer-events-none text-[#68707A]">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
