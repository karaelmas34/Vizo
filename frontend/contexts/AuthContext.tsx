import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import * as api from '../services/apiService';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<User>;
    register: (name: string, email: string, password: string) => Promise<User>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const { user: loggedInUser } = await api.getMe();
                    setUser(loggedInUser);
                } catch (error) {
                    console.error("Session check failed", error);
                    localStorage.removeItem('authToken');
                }
            }
            setIsLoading(false);
        };
        checkLoggedIn();
    }, []);

    const handleAuth = (token: string, user: User) => {
        localStorage.setItem('authToken', token);
        setUser(user);
        return user;
    }

    const login = async (email: string, password: string): Promise<User> => {
        const { token, user } = await api.login(email, password);
        return handleAuth(token, user);
    };

    const register = async (name: string, email: string, password: string): Promise<User> => {
        const { token, user } = await api.register(name, email, password);
        return handleAuth(token, user);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authToken');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
