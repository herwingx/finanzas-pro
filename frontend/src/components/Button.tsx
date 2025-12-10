/**
 * Modern Button Components - Finanzas Pro
 * Consistent, accessible, and beautiful button styles
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'btn-modern font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-app-danger text-white hover:bg-app-danger/90 shadow-sm',
    ghost: 'btn-ghost',
    success: 'bg-app-success text-white hover:bg-app-success/90 shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span>
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// Icon Button Component
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: 'default' | 'danger' | 'primary';
  size?: 'sm' | 'md';
  label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  label,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-lg transition-all flex items-center justify-center';

  const variantStyles = {
    default: 'text-app-muted hover:bg-app-elevated hover:text-app-text',
    danger: 'text-app-danger hover:bg-app-danger/10',
    primary: 'text-app-primary hover:bg-app-primary/10',
  };

  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={label}
      {...props}
    >
      <span className={`material-symbols-outlined ${size === 'sm' ? 'text-base' : 'text-xl'}`}>
        {icon}
      </span>
    </button>
  );
};

// Link Button Component (looks like button but is actually a link)
interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'btn-modern font-bold transition-all inline-flex items-center justify-center';

  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'bg-app-danger text-white hover:bg-app-danger/90',
    ghost: 'btn-ghost',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <a
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
};

// Floating Action Button (FAB)
interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  position?: 'bottom-right' | 'bottom-center';
}

export const FAB: React.FC<FABProps> = ({
  icon,
  position = 'bottom-right',
  className = '',
  ...props
}) => {
  const positionStyles = {
    'bottom-right': 'fixed bottom-24 right-6',
    'bottom-center': 'fixed bottom-24 left-1/2 -translate-x-1/2',
  };

  return (
    <button
      className={`${positionStyles[position]} size-14 rounded-full bg-app-primary text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </button>
  );
};

// Toggle Button Group
interface ToggleOption {
  value: string;
  label: string;
  color?: string;
}

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
}

export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  options,
  value,
  onChange,
  fullWidth = true,
}) => {
  return (
    <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${value === option.value
              ? `${option.color || 'bg-app-primary'} text-white shadow-md`
              : 'text-app-muted hover:bg-app-elevated'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Button;
