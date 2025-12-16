/**
 * UI CORE COMPONENT LIBRARY - BUTTONS
 * Standardized interaction elements for Finanzas Pro
 */

import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

// --- Shared Types ---
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: string; // Optional icon name (Material Symbols)
  iconPosition?: 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}

// --- Loading Spinner Component ---
const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin h-4 w-4 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// --- Style Generator Helper ---
const getButtonClasses = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth: boolean = false,
  className: string = ''
) => {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-app-primary";

  const width = fullWidth ? 'w-full' : '';

  const sizes = {
    sm: "text-xs px-3 py-1.5 h-8",
    md: "text-sm px-4 py-2.5 h-11",
    lg: "text-base px-6 py-3.5 h-14",
    icon: "p-2 aspect-square h-10 w-10", // Square for icon-only
  };

  const variants = {
    // Solid Primary (Brand Color)
    primary: "bg-app-primary hover:bg-app-primary-dark text-white shadow-lg shadow-app-primary/20 hover:shadow-app-primary/30",

    // Surface Secondary (Card background with border)
    secondary: "bg-app-surface text-app-text border border-app-border hover:bg-app-subtle hover:border-app-strong shadow-sm",

    // Ghost (No background unless hover)
    ghost: "bg-transparent text-app-text hover:bg-app-subtle text-app-muted hover:text-app-text",

    // Outline (Border only, brand colored)
    outline: "bg-transparent border border-app-border hover:border-app-primary text-app-muted hover:text-app-primary hover:bg-app-primary/5",

    // Danger (Destructive)
    danger: "bg-semantic-danger text-white hover:opacity-90 shadow-md shadow-semantic-danger/20",

    // Success (Positive action)
    success: "bg-semantic-success text-white hover:opacity-90 shadow-md shadow-semantic-success/20",
  };

  return `${base} ${sizes[size]} ${variants[variant]} ${width} ${className}`;
};


// ============================================================================
// 1. Button (Standard HTML Button)
// ============================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, BaseButtonProps { }

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={getButtonClasses(variant, size, fullWidth, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Spinner />
          {children}
        </span>
      ) : (
        <span className="flex items-center gap-2 truncate">
          {icon && iconPosition === 'left' && <span className="material-symbols-outlined text-[1.25em]">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="material-symbols-outlined text-[1.25em]">{icon}</span>}
        </span>
      )}
    </button>
  );
};


// ============================================================================
// 2. Icon Button (For pure icon actions, uses font size context)
// ============================================================================
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <button
      className={getButtonClasses(variant, size === 'md' ? 'icon' : size, false, className)}
      {...props}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  );
};


// ============================================================================
// 3. Link Button (Acts like a button but is an Anchor tag or Router Link)
// ============================================================================
interface LinkButtonProps extends LinkProps, BaseButtonProps { }

export const LinkButton: React.FC<LinkButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  icon,
  ...props
}) => {
  return (
    <Link
      className={getButtonClasses(variant, size, fullWidth, className)}
      {...props}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-[1.2em]">{icon}</span>}
        {children}
      </span>
    </Link>
  );
};


// ============================================================================
// 4. Toggle Button Group (iOS Segmented Control Style)
// ============================================================================
interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleButtonGroupProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div className="flex p-1 gap-1 bg-app-subtle/80 backdrop-blur-md rounded-xl w-full border border-app-border/50">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all duration-200
              ${isActive
                ? 'bg-app-surface text-app-text shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-app-muted hover:text-app-text hover:bg-black/5 dark:hover:bg-white/5'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// 5. FAB (Floating Action Button - Enhanced)
// ============================================================================
// Note: Usually handled by BottomNav in mobile, but good to have independent.
export const FAB: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string }> = ({
  icon = 'add',
  className = '',
  ...props
}) => {
  return (
    <button
      className={`fixed bottom-6 right-6 lg:hidden size-14 rounded-full bg-app-primary text-white shadow-[0_8px_25px_-5px_rgba(37,99,235,0.5)] active:scale-90 transition-transform z-30 flex items-center justify-center ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined text-[28px] font-semibold">{icon}</span>
    </button>
  );
};

export default Button;