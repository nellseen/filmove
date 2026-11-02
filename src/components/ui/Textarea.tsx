import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, disabled, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`w-full p-3 bg-white text-[#17191C] placeholder-[#68707A] text-sm rounded-lg border ${
          error ? 'border-[#DC2626] focus:ring-[#DC2626]' : 'border-[#E5E8EC] focus:border-[#2563EB] focus:ring-[#2563EB]'
        } focus:outline-none focus:ring-1 transition-all disabled:bg-[#F1F3F5] disabled:cursor-not-allowed resize-y ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
