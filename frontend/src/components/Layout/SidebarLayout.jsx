import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';

const SidebarLayout = ({ children }) => {
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // On desktop, auto-open if screen is wide enough
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true);
            } else if (mobile) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return (
        <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-(--button-primary) border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium opacity-50">Loading session...</p>
            </div>
        </div>
    );

    if (!user) return <Navigate to="/login" />;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Component */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
                isMobile={isMobile} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                {React.cloneElement(children, { isSidebarOpen, setIsSidebarOpen, isMobile })}
            </div>
        </div>
    );
};

export default SidebarLayout;
