import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
    name: string;
    avatar?: string;
    role: 'ADMIN' | 'VIEWER';
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLocked: boolean;
    user: UserProfile | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    lock: () => void;
    unlock: (pin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default to locked/unauthenticated state
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLocked, setIsLocked] = useState<boolean>(true);
    const [user, setUser] = useState<UserProfile | null>(null);

    // Simple robust PIN for now - In production this should be hashed/salted
    // Default PIN: 1234
    const STORED_PIN = localStorage.getItem('wealth_auth_pin') || '1234';

    useEffect(() => {
        // Check local storage for session on mount
        const savedSession = localStorage.getItem('wealth_auth_session');
        if (savedSession === 'active') {
            setIsAuthenticated(true);
            setIsLocked(true); // Always start locked for security if returning
            setUser({ name: 'Portfolio Manager', role: 'ADMIN' });
        }
    }, []);

    const login = async (pin: string): Promise<boolean> => {
        // Simulate API delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));

        if (pin === STORED_PIN) {
            setIsAuthenticated(true);
            setIsLocked(false);
            setUser({ name: 'Portfolio Manager', role: 'ADMIN' });
            localStorage.setItem('wealth_auth_session', 'active');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsLocked(true);
        setUser(null);
        localStorage.removeItem('wealth_auth_session');
    };

    const lock = () => {
        setIsLocked(true);
    };

    const unlock = async (pin: string): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (pin === STORED_PIN) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLocked, user, login, logout, lock, unlock }}>
            {children}
        </AuthContext.Provider>
    );
};
