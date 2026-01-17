'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import type { LocalUser } from './types';

interface UserContextType {
    user: LocalUser | null;
    setUser: (user: LocalUser | null) => void;
    isAuthenticated: boolean;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'bomberball_user';

function generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<LocalUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUserState(JSON.parse(stored));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoaded(true);
    }, []);

    const setUser = (newUser: LocalUser | null) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const logout = () => {
        setUser(null);
    };

    // Don't render until we've loaded from localStorage
    if (!isLoaded) {
        return null;
    }

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                isAuthenticated: !!user,
                logout,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

export { generateUserId };
