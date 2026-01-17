'use client';

import { ReactNode, useRef, MouseEvent } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  loading?: boolean;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  loading = false,
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Create ripple effect on click
  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button || disabled || loading) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = 'ripple';

    // Remove old ripples
    const existingRipples = button.querySelectorAll('.ripple');
    existingRipples.forEach(r => r.remove());

    button.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => ripple.remove(), 600);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    if (onClick && !disabled && !loading) {
      onClick();
    }
  };

  const baseStyles = `
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-300 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100
        active:scale-[0.97]
        relative overflow-hidden
        btn-shine btn-ripple
    `;

  const variants = {
    primary: `
            bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white
            bg-[length:200%_100%] hover:bg-right
            hover:shadow-xl hover:shadow-cyan-500/25
            hover:scale-[1.02]
            focus-visible:ring-cyan-500
            border border-cyan-400/20
        `,
    secondary: `
            bg-gradient-to-r from-slate-700 to-slate-600 text-white
            border border-slate-500/50
            hover:from-slate-600 hover:to-slate-500 hover:border-slate-400/50
            hover:shadow-lg hover:shadow-slate-900/50
            hover:scale-[1.02]
            focus-visible:ring-slate-500
        `,
    danger: `
            bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white
            bg-[length:200%_100%] hover:bg-right
            hover:shadow-xl hover:shadow-red-500/25
            hover:scale-[1.02]
            focus-visible:ring-red-500
            border border-red-400/20
        `,
    ghost: `
            bg-transparent text-gray-400
            hover:bg-white/5 hover:text-white
            focus-visible:ring-gray-500
            border border-transparent hover:border-white/10
        `,
    success: `
            bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white
            bg-[length:200%_100%] hover:bg-right
            hover:shadow-xl hover:shadow-emerald-500/25
            hover:scale-[1.02]
            focus-visible:ring-emerald-500
            border border-emerald-400/20
        `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
