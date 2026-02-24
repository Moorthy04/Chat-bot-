import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10a37f]"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/chat" replace />;
    }

    return children;
};

export default PublicRoute;
