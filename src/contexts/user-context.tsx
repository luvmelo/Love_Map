'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type User = 'melo' | 'may';

export interface UserInfo {
    id: User;
    name: string;
    color: string;
    avatar: string; // Emoji or initials
}

export const USERS: Record<User, UserInfo> = {
    melo: {
        id: 'melo',
        name: 'Melo',
        color: '#6366f1', // Indigo
        avatar: '🧑‍💻',
    },
    may: {
        id: 'may',
        name: 'May',
        color: '#f472b6', // Pink
        avatar: '👩‍🎨',
    },
};

interface UserContextType {
    currentUser: User;
    userInfo: UserInfo;
    switchUser: (user: User) => void;
    otherUser: User;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'love-map-current-user';

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User>('melo');
    const [isHydrated, setIsHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'melo' || stored === 'may') {
            setCurrentUser(stored);
        }
        setIsHydrated(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(STORAGE_KEY, currentUser);
        }
    }, [currentUser, isHydrated]);

    const switchUser = (user: User) => {
        setCurrentUser(user);
    };

    const otherUser: User = currentUser === 'melo' ? 'may' : 'melo';

    const value: UserContextType = {
        currentUser,
        userInfo: USERS[currentUser],
        switchUser,
        otherUser,
    };

    // Prevent hydration mismatch by not rendering until client-side
    if (!isHydrated) {
        return null;
    }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
