import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const MainLayout = ({ children }) => {
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            // On desktop, default to open. On mobile, default to closed unless already interacting.
            if (!mobile && !isSidebarOpen) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground relative">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isMobile={isMobile} />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {React.cloneElement(children, { isSidebarOpen, setIsSidebarOpen, isMobile })}
            </main>
        </div>
    );
};

export default MainLayout;
