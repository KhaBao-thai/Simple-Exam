import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Rounded Squircle */}
      <rect
        width="40"
        height="40"
        rx="11"
        className="fill-slate-900 dark:fill-white transition-colors"
      />

      {/* Outer subtle decorative frame */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="9"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1.5"
      />

      {/* Document page silhouette */}
      <path
        d="M12 11C12 9.89543 12.8954 9 14 9H23.5L28 13.5V29C28 30.1046 27.1046 31 26 31H14C12.8954 31 12 30.1046 12 29V11Z"
        className="fill-slate-800 dark:fill-slate-100"
        fillOpacity="0.15"
      />

      {/* Folded paper corner */}
      <path
        d="M23 9V14H28L23 9Z"
        className="fill-slate-700 dark:fill-slate-300"
        fillOpacity="0.3"
      />

      {/* Distinctive exam checkmark mark (S & Checkmark fusion) */}
      <path
        d="M15 20.5L19 24.5L26 16.5"
        className="stroke-white dark:stroke-slate-900"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Clean modern line accents representing quiz choices */}
      <path
        d="M15 14H20M15 27.5H23"
        className="stroke-white/70 dark:stroke-slate-900/70"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};
