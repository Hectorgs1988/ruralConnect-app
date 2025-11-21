import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none';
  const variants = {
    primary: 'bg-primary text-dark shadow-md hover:bg-primaryStrong focus:ring-2 focus:ring-primaryStrong/60',
    secondary: 'bg-background text-dark border border-borderSoft hover:bg-surfaceMuted focus:ring-2 focus:ring-borderSoft/60',
    error: 'bg-error text-white hover:bg-red-700 focus:ring-2 focus:ring-error/60',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
