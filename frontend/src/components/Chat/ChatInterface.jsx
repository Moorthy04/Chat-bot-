import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { Sun, Moon, Bot, MessageSquare, Sparkles, Zap, Shield, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { api, BASE_URL } from '../../utils/api';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import ChatContainer from './ChatContainer';

const ChatInterface = ({ isSidebarOpen = true, setIsSidebarOpen, isMobile }) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { getActiveChat, addMessage, updateLastMessage, setChats, chatLoading, activeChatId } = useChat();
    const messagesContainerRef = useRef(null);
    const [isResponding, setIsResponding] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini');
    const [showExhaustionBanner, setShowExhaustionBanner] = useState(false);
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    const abortControllerRef = useRef(null);
    
    const activeChat = getActiveChat();
    const messages = activeChat?.messages || [];

    const handleSendMessage = async (content, attachments) => {
        let currentChatId = activeChat?.id;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        if (!currentChatId) {
            try {
                const newChat = await api.post('/api/conversations/', { 
                    title: content.slice(0, 30) || 'New Chat',
                    model: selectedModel 
                });
                newChat.messages = [];
                newChat.name = newChat.title;
                setChats(prev => [newChat, ...prev]);
                navigate(`/chat/${newChat.id}`);
                currentChatId = newChat.id;
            } catch (err) {
                return;
            }
        }

        const userMsg = { 
            id: 'temp-' + Date.now(), 
            role: 'user', 
            content, 
            attachments: attachments || [], 
            created_at: new Date().toISOString() 
        };
        addMessage(currentChatId, userMsg);

        addMessage(currentChatId, {
            id: 'ai-' + Date.now(),
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        });

        setIsResponding(true);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${BASE_URL}/api/chat/stream/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversation_id: currentChatId,
                    user_message: content,
                    attachment_ids: (attachments || []).map(a => a.id),
                    model: selectedModel
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) throw new Error('Streaming failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Accumulate raw text into a buffer
                buffer += decoder.decode(value, { stream: true });

                // Split on SSE frame boundaries "\n\n"
                const frames = buffer.split('\n\n');
                // Keep the last potentially incomplete frame in the buffer
                buffer = frames.pop() ?? '';

                for (const frame of frames) {
                    for (const line of frame.split('\n')) {
                        if (!line.startsWith('data:')) continue;
                        const raw = line.slice(5).trimStart();
                        if (raw === '[DONE]') continue;
                        try {
                            // Backend JSON-encodes chunks so newlines survive SSE transport
                            assistantContent += JSON.parse(raw);
                        } catch {
                            assistantContent += raw; // fallback for plain-text chunks
                        }
                    }
                }

                updateLastMessage(currentChatId, assistantContent);
            }

            // Flush any remaining buffer after stream closes
            if (buffer.trim()) {
                for (const line of buffer.split('\n')) {
                    if (line.startsWith('data:')) {
                        const data = line.slice(5).trimStart();
                        if (data !== '[DONE]') assistantContent += data;
                    }
                }
                if (assistantContent) updateLastMessage(currentChatId, assistantContent);
            }


            if (assistantContent.includes('switching to other models')) {
                setShowExhaustionBanner(true);
            } else {
                setShowExhaustionBanner(false);
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                updateLastMessage(currentChatId, 'Sorry, something went wrong with the connection.');
            }
        } finally {
            setIsResponding(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsResponding(false);
        }
    };

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!showExhaustionBanner) return;
        const timer = setTimeout(() => setShowExhaustionBanner(false), 5000);
        return () => clearTimeout(timer);
    }, [showExhaustionBanner]);

    useEffect(() => {
        if (showExhaustionBanner) setShowExhaustionBanner(false);
    }, [selectedModel]);

    const suggestions = [
        { icon: <MessageSquare className="text-blue-500" size={18} />, text: "Write a short story about a time traveler" },
        { icon: <Sparkles className="text-purple-500" size={18} />, text: "Explain quantum computing in simple terms" },
        { icon: <Zap className="text-yellow-500" size={18} />, text: "Help me write a professional email for a job application" },
        { icon: <Shield className="text-green-500" size={18} />, text: "What are some best practices for web security?" }
    ];

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
                            Chat Bot
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
                            <span className="font-bold">{selectedModel === 'gpt' ? 'GPT' : selectedModel === 'claude' ? 'Claude' : 'Gemini'}</span> is currently hitting rate limits. Try switching to another model!
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsModelSelectorOpen(true);
                            if (messagesContainerRef.current) {
                                messagesContainerRef.current.scrollTo({ 
                                    top: messagesContainerRef.current.scrollHeight,
                                    behavior: 'smooth' 
                                });
                            }
                        }}
                        className="w-full md:w-auto px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer whitespace-nowrap"
                    >
                        Switch Model
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-none" ref={messagesContainerRef}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(s.text)}
                                    className="p-4 rounded-2xl border border-border hover:bg-(--hover-bg) transition-all text-left group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        {s.icon}
                                    </div>
                                    <p className="text-sm text-sidebar-foreground/80 group-hover:text-foreground">{s.text}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="pt-4 max-w-4xl mx-auto w-full">
                        <MessageList 
                            messages={messages} 
                            isSidebarOpen={isSidebarOpen} 
                            isResponding={isResponding}
                            isMobile={isMobile}
                        />
                    </div>
                )}
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