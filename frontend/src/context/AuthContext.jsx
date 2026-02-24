import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearStaleData = () => {
        const legacyKeys = ['chatgpt_user', 'username', 'user_id', 'role', 'access', 'refresh', 'name', 'email'];
        legacyKeys.forEach(key => localStorage.removeItem(key));
    };

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const userData = await api.get('/api/auth/me/');
                setUser(userData);
            } catch (err) {
                // Session check failed
                if (err.message.includes('Unauthorized') || err.message.includes('Refresh failed')) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    clearStaleData();
                }
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username, password) => {
        try {
            const data = await api.post('/api/auth/login/', { username, password });
            clearStaleData();
            setUser(data.user);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            toast.success('Welcome back!');
            return true;
        } catch (err) {
            toast.error(err.message || 'Login failed');
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            await api.post('/api/auth/register/', { username, email, password });
            toast.success('Account created! Please log in.');
            return true;
        } catch (err) {
            toast.error(err.message || 'Registration failed');
            return false;
        }
    };

    const logout = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token');
            await api.post('/api/auth/logout/', { refresh });
        } catch (err) {
            // Logout API failed
        } finally {
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            clearStaleData();
            toast.success('Logged out');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
