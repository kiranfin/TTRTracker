import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    getCurrentAppUser,
    loginAppUser,
    logoutAppUser,
    registerAppUser,
    type AppUser,
} from '../api/auth';

type AuthContextValue = {
    user: AppUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (params: { username: string; password: string }) => Promise<AppUser>;
    register: (params: { username: string; password: string }) => Promise<AppUser>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<AppUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentAppUser();
            setUser(currentUser);
            return currentUser;
        } catch {
            setUser(null);
            await logoutAppUser();
            return null;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        async function bootstrap() {
            try {
                const currentUser = await getCurrentAppUser();

                if (mounted) {
                    setUser(currentUser);
                }
            } catch {
                if (mounted) {
                    setUser(null);
                }

                await logoutAppUser();
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        bootstrap();

        return () => {
            mounted = false;
        };
    }, []);

    const login = useCallback(async (params: { username: string; password: string }) => {
        const loggedInUser = await loginAppUser(params);
        setUser(loggedInUser);
        return loggedInUser;
    }, []);

    const register = useCallback(async (params: { username: string; password: string }) => {
        const registeredUser = await registerAppUser(params);
        setUser(registeredUser);
        return registeredUser;
    }, []);

    const logout = useCallback(async () => {
        await logoutAppUser();
        setUser(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isLoading,
            isAuthenticated: Boolean(user),
            login,
            register,
            logout,
            refreshUser,
        }),
        [user, isLoading, login, register, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden.');
    }

    return context;
}