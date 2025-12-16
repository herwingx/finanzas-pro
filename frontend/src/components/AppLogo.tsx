import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
}

/**
 * Brand logo component that renders the exact same design as the favicon.
 * 3 ascending bars representing financial growth.
 */
export const AppLogo: React.FC<AppLogoProps> = ({ size = 40, className = '' }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    className={className}
    aria-label="Finanzas Pro Logo"
  >
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--brand-primary, #2563EB)" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>

    {/* Rounded background */}
    <rect width="512" height="512" rx="96" fill="url(#logoGrad)" />

    {/* Growth bars - white */}
    <g transform="translate(96, 128)" fill="white">
      {/* Bar 1 (Short) */}
      <rect x="0" y="160" width="72" height="96" rx="12" opacity="0.7" />
      {/* Bar 2 (Medium) */}
      <rect x="112" y="96" width="72" height="160" rx="12" opacity="0.85" />
      {/* Bar 3 (Tall) */}
      <rect x="224" y="0" width="72" height="256" rx="12" />
    </g>

    {/* Accent dot */}
    <circle cx="388" cy="152" r="24" fill="white" opacity="0.9" />
  </svg>
);

export default AppLogo;
