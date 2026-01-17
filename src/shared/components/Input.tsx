'use client';

import { useState, useRef, useEffect } from 'react';

interface InputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'password' | 'email';
    error?: string;
    disabled?: boolean;
    maxLength?: number;
    autoFocus?: boolean;
    className?: string;
    uppercase?: boolean;
    showCharCount?: boolean;
    icon?: React.ReactNode;
}

export function Input({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    error,
    disabled = false,
    maxLength,
    autoFocus = false,
    className = '',
    uppercase = false,
    showCharCount = false,
    icon,
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [hasShaken, setHasShaken] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Shake animation on error
    useEffect(() => {
        if (error && !hasShaken) {
            setHasShaken(true);
            const timer = setTimeout(() => setHasShaken(false), 500);
            return () => clearTimeout(timer);
        }
    }, [error, hasShaken]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (uppercase) val = val.toUpperCase();
        onChange(val);
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    className={`
                        block text-sm font-medium mb-2
                        transition-colors duration-200
                        ${isFocused ? 'text-cyan-400' : 'text-gray-400'}
                        ${error ? 'text-red-400' : ''}
                    `}
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className={`
                        absolute left-4 top-1/2 -translate-y-1/2
                        transition-colors duration-200
                        ${isFocused ? 'text-cyan-400' : 'text-gray-500'}
                    `}>
                        {icon}
                    </div>
                )}
                <input
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    className={`
                        w-full px-4 py-3.5 rounded-xl
                        bg-slate-800/80 
                        text-white placeholder-gray-500
                        transition-all duration-300 ease-out
                        focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${icon ? 'pl-12' : ''}
                        ${uppercase ? 'uppercase tracking-[0.3em] text-center font-mono text-xl' : ''}
                        ${hasShaken ? 'animate-shake' : ''}
                        ${error
                            ? 'border-2 border-red-500/60 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2),0_0_20px_rgba(239,68,68,0.15)]'
                            : 'border border-slate-600/50 focus:border-cyan-500/60 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15),0_0_25px_rgba(6,182,212,0.1)]'
                        }
                        ${isFocused && !error ? 'bg-slate-800/95' : ''}
                    `}
                />
                {/* Animated border glow */}
                <div
                    className={`
                        absolute inset-0 rounded-xl pointer-events-none
                        transition-opacity duration-300
                        ${isFocused && !error ? 'opacity-100' : 'opacity-0'}
                    `}
                    style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent, rgba(139, 92, 246, 0.1))',
                    }}
                />
            </div>

            {/* Error message and character count */}
            <div className="flex justify-between items-center mt-2 min-h-[1.25rem]">
                {error && (
                    <p className="text-sm text-red-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
                {showCharCount && maxLength && (
                    <p className={`
                        text-xs ml-auto
                        transition-colors duration-200
                        ${value.length >= maxLength ? 'text-amber-400' : 'text-gray-500'}
                    `}>
                        {value.length}/{maxLength}
                    </p>
                )}
            </div>
        </div>
    );
}
