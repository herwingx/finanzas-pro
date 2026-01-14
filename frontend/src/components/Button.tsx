import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

/* --- TYPES --- */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  className?: string;
  children?: React.ReactNode;
}

/* --- HELPERS & STYLES --- */
const getButtonClasses = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = ''
}: any) => {

  // Core Layout & Animation
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-200 active:scale-[0.98] outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 relative overflow-hidden";

  const width = fullWidth ? 'w-full' : '';

  const sizes = {
    sm: "text-xs px-3 h-9",
    md: "text-sm px-5 h-12",
    lg: "text-base px-6 h-14",
  };

  const variants = {
    primary: "bg-app-primary text-white shadow-lg shadow-app-primary/20 hover:opacity-90",
    secondary: "bg-app-surface text-app-text border border-app-border hover:bg-app-subtle",
    outline: "bg-transparent text-app-primary border-2 border-current hover:bg-app-primary/10",
    ghost: "bg-transparent text-app-muted hover:text-app-text hover:bg-app-subtle",
    danger: "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600",
    success: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600",
  };

  return `${base} ${sizes[size]} ${variants[variant]} ${width} ${isLoading ? 'cursor-wait opacity-80' : ''} ${className}`;
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

/* ==================================================================================
   COMPONENT 1: Standard Button
   ================================================================================== */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, BaseButtonProps { }

export const Button: React.FC<ButtonProps> = ({
  variant, size, fullWidth, isLoading, leftIcon, rightIcon, children, className, disabled, ...props
}) => {
  return (
    <button
      className={getButtonClasses({ variant, size, fullWidth, isLoading, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner />}
      {!isLoading && leftIcon && <span className="material-symbols-outlined text-[1.25em]">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="material-symbols-outlined text-[1.25em]">{rightIcon}</span>}
    </button>
  );
};

/* ==================================================================================
   COMPONENT 2: Router Link Button (looks like a button)
   ================================================================================== */
interface LinkButtonProps extends LinkProps, BaseButtonProps { }

export const LinkButton: React.FC<LinkButtonProps> = ({
  variant, size, fullWidth, leftIcon, rightIcon, children, className, ...props
}) => {
  return (
    <Link className={getButtonClasses({ variant, size, fullWidth, className })} {...props}>
      {leftIcon && <span className="material-symbols-outlined text-[1.25em]">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="material-symbols-outlined text-[1.25em]">{rightIcon}</span>}
    </Link>
  );
};

/* ==================================================================================
   COMPONENT 3: Icon Button (Circular / Square)
   ================================================================================== */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: 'ghost' | 'surface' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, variant = 'ghost', size = 'md', className = '', ...props }) => {
  const sizeCls = { sm: 'size-8 text-[18px]', md: 'size-10 text-[22px]', lg: 'size-14 text-[28px]' };

  const variantCls = {
    ghost: 'text-app-muted hover:text-app-text hover:bg-app-subtle',
    surface: 'bg-app-surface border border-app-border text-app-text hover:border-app-strong shadow-sm',
    primary: 'bg-app-primary text-white shadow-md shadow-app-primary/20',
    danger: 'bg-rose-50 text-rose-500 hover:bg-rose-100',
  };

  return (
    <button
      className={`flex items-center justify-center rounded-full transition-all active:scale-90 ${sizeCls[size]} ${variantCls[variant]} ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
};

/* ==================================================================================
   COMPONENT 4: Segmented Toggle Group (Tabs)
   ================================================================================== */
export const ToggleButtonGroup: React.FC<{
  options: { value: string; label: string; icon?: string }[];
  value: string;
  onChange: (val: string) => void;
  className?: string; // Add className prop support
}> = ({ options, value, onChange, className = '' }) => {
  return (
    <div className={`flex bg-app-subtle p-1 rounded-2xl w-fit ${className}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5
              ${active
                ? 'bg-app-surface text-app-text shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                : 'text-app-muted hover:text-app-text'
              }
            `}
          >
            {opt.icon && <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  );
};

export default Button;