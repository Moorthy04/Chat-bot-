import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, Zap, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Bot size={28} className="text-(--button-primary)" />
                            <span className="text-xl font-bold">ChatBot</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-sidebar-foreground/5 transition-colors cursor-pointer"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm font-medium hover:bg-sidebar-foreground/5 rounded-lg transition-colors"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 text-sm font-medium bg-(--button-primary) hover:bg-(--button-primary-hover) text-white rounded-lg transition-colors"
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-(--button-primary)/10 text-(--button-primary) text-sm font-medium mb-8">
                    <Sparkles size={16} />
                    <span>Powered by Advanced AI</span>
                </div>

                <p className="text-xl text-sidebar-foreground/70 mb-12 max-w-2xl mx-auto">
                    Experience the power of conversational AI. Get instant answers, creative ideas, and intelligent assistance.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 bg-(--button-primary) hover:bg-(--button-primary-hover) text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Start chatting
                        <ArrowRight size={20} />
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="px-8 py-4 border border-border hover:bg-sidebar-foreground/5 font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                        Create account
                    </button>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-2xl border border-border hover:border-(--button-primary) transition-all">
                        <div className="w-12 h-12 rounded-xl bg-(--button-primary)/10 flex items-center justify-center mb-4">
                            <Zap size={24} className="text-(--button-primary)" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                        <p className="text-sidebar-foreground/70">
                            Get instant responses to your questions with our optimized AI engine.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl border border-border hover:border-(--button-primary) transition-all">
                        <div className="w-12 h-12 rounded-xl bg-(--button-primary)/10 flex items-center justify-center mb-4">
                            <Sparkles size={24} className="text-(--button-primary)" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Creative & Smart</h3>
                        <p className="text-sidebar-foreground/70">
                            From writing to coding, get creative and intelligent assistance.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl border border-border hover:border-(--button-primary) transition-all">
                        <div className="w-12 h-12 rounded-xl bg-(--button-primary)/10 flex items-center justify-center mb-4">
                            <Shield size={24} className="text-(--button-primary)" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
                        <p className="text-sidebar-foreground/70">
                            Your conversations are encrypted and your privacy is our priority.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-border mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-sm text-sidebar-foreground/50">
                        © 2026 ChatBot. Built with React and AI.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
