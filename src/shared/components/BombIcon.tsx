import React from 'react';

interface BombProps {
    color?: string;
    className?: string;
}

export const BombIcon: React.FC<BombProps> = ({ color = '#ef4444', className = '' }) => {
    return (
        <div className={`relative inline-block ${className}`} style={{ minWidth: '1em', minHeight: '1em' }}>
            {/* Fuse Container */}
            <div className="absolute -top-[30%] -right-[10%] w-[50%] h-[50%] z-0 pointer-events-none">
                {/* Fuse Cord */}
                <div className="absolute bottom-0 left-0 w-full h-full border-t-[3px] border-r-[3px] border-stone-400 rounded-tr-full transform -rotate-12 origin-bottom-left" />
                {/* Spark */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-orange-500 rounded-full animate-ping filter blur-[1px]" />
                <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-yellow-300 rounded-full animate-pulse shadow-[0_0_10px_orange]" />
            </div>

            {/* Bomb Body */}
            <div className="relative w-full h-full rounded-full bg-[radial-gradient(circle_at_30%_30%,_#4b5563,_#000000)] shadow-lg z-10"
                style={{ boxShadow: `0 0 15px ${color}40` }}>

                {/* Specular Highlight */}
                <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/20 rounded-[50%] blur-[1px] transform -rotate-45" />

                {/* Red/Color Glow Inner */}
                <div className="absolute inset-0 rounded-full opacity-30 animate-pulse"
                    style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
            </div>
        </div>
    );
};
