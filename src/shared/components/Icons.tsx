interface IconProps {
    className?: string;
    size?: number;
}

// Stylized Bomb Icon
export function BombIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Bomb body */}
            <circle
                cx="11"
                cy="14"
                r="8"
                className="fill-current"
            />
            {/* Fuse holder */}
            <path
                d="M14 7L16 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Fuse spark */}
            <circle
                cx="17"
                cy="4"
                r="2"
                className="fill-amber-500 animate-pulse"
            />
            {/* Highlight */}
            <circle
                cx="8"
                cy="11"
                r="2"
                className="fill-white/30"
            />
        </svg>
    );
}

// Sparkle/Star Icon
export function SparkleIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                className="fill-current"
            />
            <path
                d="M19 14L19.75 16.25L22 17L19.75 17.75L19 20L18.25 17.75L16 17L18.25 16.25L19 14Z"
                className="fill-current opacity-70"
            />
            <path
                d="M5 2L5.5 3.5L7 4L5.5 4.5L5 6L4.5 4.5L3 4L4.5 3.5L5 2Z"
                className="fill-current opacity-50"
            />
        </svg>
    );
}

// Explosion Icon
export function ExplosionIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2L14 8L20 7L16 12L21 17L14 15L12 22L10 15L3 17L8 12L4 7L10 8L12 2Z"
                className="fill-current"
            />
            {/* Center glow */}
            <circle
                cx="12"
                cy="12"
                r="3"
                className="fill-amber-400"
            />
        </svg>
    );
}

// Flame Icon for decorative purposes
export function FlameIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 22C16.4183 22 20 18.4183 20 14C20 9 16 5 12 2C12 6 9 8 8 10C7 12 8 14 8 14C8 14 7 13 6 14C4 16 5 19 7 21C8 22 10 22 12 22Z"
                className="fill-current"
            />
            <path
                d="M12 22C14 22 16 20 16 17C16 14 14 12 12 10C12 13 10 14 10 16C10 18 11 20 12 22Z"
                className="fill-amber-400"
            />
        </svg>
    );
}

// Game Controller Icon
export function GamepadIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="6" y1="12" x2="10" y2="12" />
            <line x1="8" y1="10" x2="8" y2="14" />
            <circle cx="15" cy="13" r="1" fill="currentColor" />
            <circle cx="18" cy="11" r="1" fill="currentColor" />
            <rect x="2" y="6" width="20" height="12" rx="3" />
        </svg>
    );
}

// Crown Icon for Host
export function CrownIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" />
            <rect x="5" y="18" width="14" height="2" rx="1" />
        </svg>
    );
}

// Check Icon
export function CheckIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

// Users/Players Icon
export function UsersIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

// Plus Icon
export function PlusIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

// Arrow Right Icon
export function ArrowRightIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
}

// Logout/Leave Icon
export function LogoutIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

// Copy Icon
export function CopyIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}

// User Icon
export function UserIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

// Lightning/Bolt Icon
export function BoltIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    );
}

// Play Icon
export function PlayIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

// Clock/Timer Icon
export function ClockIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

// X/Close Icon
export function XIcon({ className = '', size = 24 }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
