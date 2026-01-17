'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with enhanced blur */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
                onClick={onClose}
            />

            {/* Floating glow orbs for atmosphere */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Modal Content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`
                    relative w-full ${sizes[size]}
                    animate-scale-in
                    focus:outline-none
                `}
            >
                {/* Gradient border wrapper */}
                <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-cyan-500/50 via-transparent to-purple-500/50">
                    <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                        {/* Subtle top gradient accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="
                                        p-2 text-gray-400 rounded-lg
                                        transition-all duration-200
                                        hover:text-white hover:bg-white/10
                                        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
                                        active:scale-95
                                    "
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-6 relative">
                            {/* Content glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/5 blur-2xl pointer-events-none" />
                            <div className="relative">
                                {children}
                            </div>
                        </div>

                        {/* Subtle bottom gradient accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    );
}
