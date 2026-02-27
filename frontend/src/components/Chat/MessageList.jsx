import { Bot, Paperclip, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '../../utils/cn';
import TypingIndicator from './TypingIndicator';
import { BASE_URL } from '../../utils/api';

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

const AttachmentCard = ({ file }) => {
    // Fix 4: Make attachments clickable and opening in new tab
    const fileUrl = file.file?.startsWith('http') ? file.file : `${BASE_URL}${file.file}`;

    return (
        <div
            onClick={() => window.open(fileUrl, '_blank')}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-(--border) bg-(--hover-bg) shadow-sm w-48 cursor-pointer hover:bg-(--active-bg) transition-all group/att"
        >
            <div className="w-8 h-8 rounded-lg bg-(--background) border border-(--border) flex items-center justify-center shrink-0 group-hover/att:border-(--button-primary)/30 transition-colors">
                <Paperclip size={14} className="text-(--button-primary)" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-xs text-(--foreground) truncate">{file.name}</span>
                {file.file_type && (
                    <span className="text-[10px] text-(--foreground)/40 font-medium uppercase tracking-tight">
                        {file.file_type.split('/')[1] || 'FILE'}
                    </span>
                )}
            </div>
            <ExternalLink size={12} className="text-(--foreground)/20 opacity-0 group-hover/att:opacity-100 transition-opacity shrink-0" />
        </div>
    );
};

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
            "flex flex-col gap-4 sm:gap-8 py-4 sm:py-8 mx-auto px-2 sm:px-4 transition-all duration-300",
            isSidebarOpen && !isMobile ? "max-w-3xl" : "max-w-5xl"
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
                            "flex gap-2 sm:gap-4 group",
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                    >
                        <div className={cn(
                            "flex flex-col gap-0.5 sm:gap-1 min-w-0",
                            msg.role === 'user' ? 'items-end max-w-[92%] sm:max-w-[85%] md:max-w-[75%]' : 'items-start max-w-[95%] sm:max-w-[90%] md:max-w-[85%]'
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
                                    "px-3 py-2 sm:px-4 sm:py-2.5 rounded-[20px] text-sm sm:text-[15px] leading-normal sm:leading-relaxed transition-all",
                                    msg.role === 'user'
                                        ? 'bg-(--user-msg-bg) text-(--user-msg-text) rounded-tr-md shadow-md shadow-(--user-msg-bg)/10 font-normal'
                                        : 'bg-transparent text-foreground/90'
                                )}>
                                    {msg.role === 'user' ? (
                                        <div className="whitespace-pre-wrap word-break-all">{msg.content}</div>
                                    ) : (
                                        <MarkdownRenderer
                                            content={msg.content}
                                            isStreaming={isStreaming}
                                        />
                                    )}
                                </div>
                            )}


                            {/* Copy Button */}
                            {!isStreaming && msg.content && (
                                <div className={cn(
                                    "flex mt-0.5",
                                    msg.role === 'user' ? 'justify-end pr-2' : 'sm:ml-2 ml-4 pl-1'
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