import React from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-xs font-semibold text-[#17191C] uppercase tracking-wider">
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>
      </div>
      {children}
      {error ? (
        <p className="text-xs text-[#DC2626] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#68707A]">{helperText}</p>
      ) : null}
    </div>
  );
};
