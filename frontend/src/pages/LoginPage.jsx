import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const LoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const validateEmail = (email) => {
        return email.includes('@') && email.includes('.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identifier.trim()) {
            toast.error('Please enter your email or username');
            return;
        }

        if (identifier.includes('@') && !validateEmail(identifier)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        const success = await login(identifier, password);
        if (success) {
            navigate('/chat');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Bot size={28} className="text-[#10a37f]" />
                            <span className="text-xl font-bold">ChatBot</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-sidebar-foreground/5 transition-colors cursor-pointer"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Login Form */}
            <div className="flex flex-col items-center justify-center p-4 pt-20">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mb-6">
                            <Bot size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-center">Welcome back</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email address or username</label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] outline-none transition-all"
                                placeholder="Email or username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] outline-none transition-all pr-12"
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-foreground hover:cursor-pointer transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#10a37f] hover:bg-[#1a7f64] hover:cursor-pointer text-white font-semibold py-3 rounded-lg transition-colors mt-2"
                        >
                            Login
                        </button>
                    </form>

                    <p className="text-center text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-[#10a37f] hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
