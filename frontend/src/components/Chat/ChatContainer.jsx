import React from 'react';
import { cn } from '../../utils/cn';

const ChatContainer = ({ children, className }) => {
    return (
        <main className={cn(
            "flex-1 flex flex-col h-full min-w-0 overflow-hidden relative",
            className
        )}>
            {children}
        </main>
    );
};

export default ChatContainer;
