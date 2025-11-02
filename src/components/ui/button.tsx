import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200';
  const variants = {
    primary: 'bg-yellow-400 text-black shadow-md hover:bg-yellow-300 focus:ring-yellow-300',
    secondary: 'bg-background text-black border border-black hover:bg-gray-200',
    error: 'bg-error text-white hover:bg-red-700',
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
