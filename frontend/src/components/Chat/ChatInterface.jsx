import React, { useState, useRef, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { Sun, Moon, Bot, Zap, Menu, ArrowDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import ChatContainer from './ChatContainer';

const ChatInterface = ({ isSidebarOpen = true, setIsSidebarOpen, isMobile }) => {
    const { theme, toggleTheme } = useTheme();
    const {
        getActiveChat,
        activeChatId,
        chatLoading,
        generatingChatIds,
        sendMessage,
        stopGeneration,
        showExhaustionBanner,
        setShowExhaustionBanner
    } = useChat();

    const messagesContainerRef = useRef(null);
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini');
    const [showScrollButton, setShowScrollButton] = useState(false);

    const activeChat = getActiveChat();
    const messages = activeChat?.messages || [];
    const isResponding = generatingChatIds.has(activeChatId);

    const handleSendMessage = (content, attachments) => {
        sendMessage(content, attachments, selectedModel);
    };

    const handleStop = () => {
        stopGeneration(activeChatId);
    };

    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior
            });
        }
    };

    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            // threshold: more than 100px from bottom
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
            setShowScrollButton(!isAtBottom);
        }
    }, []);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    useEffect(() => {
        if (isResponding) {
            scrollToBottom();
        }
    }, [messages, isResponding]);

    useEffect(() => {
        if (!showExhaustionBanner) return;
        const timer = setTimeout(() => setShowExhaustionBanner(false), 5000);
        return () => clearTimeout(timer);
    }, [showExhaustionBanner, setShowExhaustionBanner]);

    useEffect(() => {
        if (showExhaustionBanner) setShowExhaustionBanner(false);
    }, [selectedModel, setShowExhaustionBanner]);

    return (
        <ChatContainer>
            {/* Header */}
            <header className="h-14 sm:h-16 flex items-center justify-between px-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10 transition-all shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    {(!isSidebarOpen && isMobile) && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-(--hover-bg) transition-colors cursor-pointer"
                            aria-label="Open sidebar"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2 px-1 sm:px-2">
                        <span className="flex items-center gap-2 font-semibold text-base sm:text-lg">
                            Chat Bot 2.0
                            <span className="hidden xs:inline text-xs font-normal text-sidebar-foreground/40 mt-0.5">2.0</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-(--hover-bg) transition-colors cursor-pointer"
                        aria-label="Toggle theme"
                        whileTap={{ scale: 0.9 }}
                    >
                        <motion.div
                            key={theme}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </motion.div>
                    </motion.button>
                </div>
            </header>

            {/* Exhaustion Banner */}
            {showExhaustionBanner && (
                <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                            <Zap size={20} />
                        </div>
                        <p className="text-sm text-foreground/80">
                            <span className="font-bold">{selectedModel === 'claude' ? 'Claude' : 'Gemini'}</span> is currently hitting rate limits. Try switching to another model!
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsModelSelectorOpen(true);
                            scrollToBottom();
                        }}
                        className="w-full md:w-auto px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap"
                    >
                        Switch Model
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden">
                <div
                    className="h-full overflow-y-auto scrollbar-none"
                    ref={messagesContainerRef}
                >
                    {chatLoading && activeChatId ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-[#10a37f] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-sidebar-foreground/60 font-medium">Loading chat...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#10a37f] flex items-center justify-center text-white shadow-lg"
                            >
                                <Bot size={messages.length === 0 && !isMobile ? 40 : 28} />
                            </motion.div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How can I help you today?</h2>
                        </div>
                    ) : (
                        <div className="pt-2 sm:pt-4 max-w-4xl mx-auto w-full">
                            <MessageList
                                messages={messages}
                                isSidebarOpen={isSidebarOpen}
                                isResponding={isResponding}
                                isMobile={isMobile}
                            />
                        </div>
                    )}
                </div>

                {/* Scroll to Bottom Button (Fix 2) */}
                <AnimatePresence>
                    {showScrollButton && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            onClick={() => scrollToBottom()}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 p-1 rounded-full bg-(--background) border border-(--border) shadow-lg hover:bg-(--hover-bg) transition-colors z-1 text-foreground/60 hover:text-foreground cursor-pointer" aria-label="Scroll to bottom"
                        >
                            <ArrowDown size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="shrink-0 bg-background/50 backdrop-blur-sm border-t border-transparent">
                <ChatInput
                    onSend={handleSendMessage}
                    onStop={handleStop}
                    isResponding={isResponding}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    isModelSelectorOpen={isModelSelectorOpen}
                    setIsModelSelectorOpen={setIsModelSelectorOpen}
                    isSidebarOpen={isSidebarOpen}
                    isMobile={isMobile}
                />
            </div>
        </ChatContainer>
    );
};

export default ChatInterface;