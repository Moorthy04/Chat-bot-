import { Bot, Paperclip, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '../../utils/cn';
import TypingIndicator from './TypingIndicator';

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-(--hover-bg) text-(--foreground)/40 hover:text-(--foreground) cursor-pointer"
            title="Copy message"
        >
            {copied ? <Check size={14} className="text-(--button-primary)" /> : <Copy size={14} />}
        </button>
    );
};

const AttachmentCard = ({ file }) => (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-(--border) bg-(--hover-bg) shadow-sm w-48">
        <div className="w-8 h-8 rounded-lg bg-(--background) border border-(--border) flex items-center justify-center shrink-0">
            <Paperclip size={14} className="text-(--button-primary)" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-(--foreground) truncate max-w-[120px]">{file.name}</span>
            {file.file_type && (
                <span className="text-[10px] text-(--foreground)/40 font-medium uppercase tracking-tight">
                    {file.file_type.split('/')[1] || 'FILE'}
                </span>
            )}
        </div>
    </div>
);

const MessageList = ({ messages, isSidebarOpen = true, isResponding, isMobile }) => {
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isResponding]);

    return (
        <div className={cn(
            "flex flex-col gap-8 py-8 mx-auto px-4 transition-all duration-300",
            isSidebarOpen && !isMobile ? "max-w-[850px]" : "max-w-5xl"
        )}>
            {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                const isStreaming = isResponding && isLast && msg.role === 'assistant';

                if (isStreaming && !msg.content) {
                    return <TypingIndicator key={msg.id} />;
                }

                return (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        key={msg.id}
                        className={cn(
                            "flex gap-4 group",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <div className={cn(
                            "flex flex-col gap-1 min-w-0",
                            msg.role === 'user' ? 'items-end max-w-[85%] md:max-w-[75%]' : 'items-start max-w-[90%] md:max-w-[85%]'
                        )}>
                            {/* Attachments above message */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                    {msg.attachments.map((file, i) => (
                                        <AttachmentCard key={i} file={file} />
                                    ))}
                                </div>
                            )}

                            {/* Message bubble */}
                            {msg.content && (
                                <div className={cn(
                                    "px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed transition-all",
                                    msg.role === 'user'
                                        ? 'bg-(--user-msg-bg) text-white rounded-tr-none shadow-md shadow-(--user-msg-bg)/10 font-medium'
                                        : 'bg-transparent text-foreground/90'
                                )}>
                                    {msg.role === 'user' ? (
                                        <div className="whitespace-pre-wrap word-break-all">{msg.content}</div>
                                    ) : isStreaming ? (
                                        // During streaming: render as plain text to avoid ReactMarkdown
                                        // showing raw markdown symbols from incomplete/partial chunks.
                                        // Once done, MarkdownRenderer takes over with full formatting.
                                        <div className="whitespace-pre-wrap leading-[1.75] text-[15px]">
                                            {msg.content}
                                            <span className="inline-block ml-0.5 text-(--button-primary) font-bold animate-pulse" aria-hidden="true">▍</span>
                                        </div>
                                    ) : (
                                        <MarkdownRenderer
                                            content={msg.content}
                                            isStreaming={false}
                                        />
                                    )}
                                </div>
                            )}


                            {/* Copy Button */}
                            {!isStreaming && msg.content && (
                                <div className={cn(
                                    "flex mt-0.5",
                                    msg.role === 'user' ? 'justify-end pr-2' : 'justify-start pl-1'
                                )}>
                                    <CopyButton text={msg.content} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;