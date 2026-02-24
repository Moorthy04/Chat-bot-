import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Paperclip, ArrowUp, X, Plus, Image, Loader2, Sparkles, Zap, Bot, ChevronDown, Square } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

const ANIMATION_DURATION = 0.16;
const SPRING_CONFIG = { type: "spring", stiffness: 500, damping: 40 };
const MAX_TEXTAREA_HEIGHT = 300;

const MODELS = [
    { id: 'gemini', name: 'Gemini 2.5', icon: Sparkles, color: 'bg-blue-500', desc: 'Fast & Creative' },
    { id: 'gpt', name: 'GPT-4o', icon: Zap, color: 'bg-green-600', desc: 'Powerful & Accurate' },
    { id: 'claude', name: 'Claude 3.5', icon: Bot, color: 'bg-purple-600', desc: 'Natural & Poetic' }
];

const ChatInput = ({ 
    onSend, 
    selectedModel, 
    setSelectedModel, 
    isModelSelectorOpen, 
    setIsModelSelectorOpen,
    isSidebarOpen,
    isMobile,
    isResponding,
    onStop
}) => {
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const menuRef = useRef(null);
    const textareaRef = useRef(null);
    const modelMenuRef = useRef(null);
    const containerRef = useRef(null);
    const dragCounterRef = useRef(0);

    const resizeTextarea = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
        textarea.style.height = `${newHeight}px`;
    }, []);

    useLayoutEffect(() => { resizeTextarea(); }, [text, resizeTextarea]);

    useEffect(() => {
        window.addEventListener('resize', resizeTextarea);
        return () => window.removeEventListener('resize', resizeTextarea);
    }, [resizeTextarea]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
            if (modelMenuRef.current && !modelMenuRef.current.contains(event.target)) setIsModelSelectorOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsModelSelectorOpen]);

    // FIX 2: Paste handler — paste image/file directly into input
    const handlePaste = useCallback((e) => {
        const files = Array.from(e.clipboardData?.files || []);
        if (files.length > 0) {
            e.preventDefault();
            handleFileUpload(files);
        }
    }, []);

    // FIX 3: Drag and drop handlers
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        dragCounterRef.current++;
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDragging(false);
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length > 0) {
            handleFileUpload(files);
        }
    }, []);

    const handleFileUpload = useCallback(async (files) => {
        if (files.length === 0) return;
        setIsUploading(true);
        setIsMenuOpen(false);
        try {
            const uploaded = await Promise.all(
                files.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    return await api.post('/api/upload/', formData);
                })
            );
            setAttachments(prev => [...prev, ...uploaded]);
        } catch (err) {
            toast.error('Failed to upload some files');
        } finally {
            setIsUploading(false);
            // FIX 4: Focus textarea after upload
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, []);

    const handleFileChange = (e) => {
        handleFileUpload(Array.from(e.target.files));
        if (e.target) e.target.value = '';
    };

    const removeAttachment = useCallback((index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        setTimeout(() => textareaRef.current?.focus(), 50);
    }, []);

    const handleSubmit = useCallback((e) => {
        if (e) e.preventDefault();
        const trimmedText = text.trim();
        if ((trimmedText || attachments.length > 0) && !isUploading && !isResponding) {
            onSend(trimmedText, attachments);
            setText('');
            setAttachments([]);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    }, [text, attachments, isUploading, onSend]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    const isSendDisabled = (!text.trim() && attachments.length === 0) || isUploading;
    const currentModelData = MODELS.find(m => m.id === selectedModel) || MODELS[0];

    return (
        <div className={cn(
            "w-full mx-auto px-4 pb-3 transition-all duration-300",
            isSidebarOpen && !isMobile ? "max-w-[850px]" : "max-w-5xl"
        )}>
            <LayoutGroup>
                {/* FIX 3: Drag & drop on the whole container */}
                <motion.div
                    ref={containerRef}
                    layout="position"
                    transition={SPRING_CONFIG}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "relative flex flex-col w-full bg-(--input-bg) border rounded-2xl shadow-sm overflow-visible transition-all duration-150",
                        isDragging
                            ? "border-(--button-primary) ring-2 ring-(--button-primary)/20"
                            : "border-(--border) focus-within:ring-1 focus-within:ring-(--button-primary)/20 focus-within:border-(--button-primary)/40"
                    )}
                >
                    {/* Drag overlay hint */}
                    {isDragging && (
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10 pointer-events-none">
                            <p className="text-sm font-semibold text-(--button-primary)">Drop files here</p>
                        </div>
                    )}

                    {/* Attachments */}
                    <AnimatePresence initial={false}>
                        {attachments.length > 0 && (
                            <motion.div
                                layout="position"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: ANIMATION_DURATION }}
                                className="flex flex-wrap gap-1.5 px-3 pt-3 overflow-hidden"
                            >
                                {attachments.map((file, i) => (
                                    <motion.div
                                        layout="position"
                                        key={file.id || i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-(--hover-bg) border border-(--border) w-44"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-(--background) border border-(--border) flex items-center justify-center shrink-0">
                                            <Paperclip size={14} className="text-(--button-primary)" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate text-xs font-semibold text-(--foreground)/80">{file.name}</span>
                                            <span className="text-[10px] text-(--foreground)/40 uppercase font-medium">
                                                {file.file_type ? file.file_type.split('/')[1] : 'file'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeAttachment(i)}
                                            className="absolute -top-1.5 -right-1.5 bg-(--foreground) text-(--background) rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                        >
                                            <X size={9} />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* FIX 2: Paste handler on textarea */}
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={isDragging ? '' : 'Ask Anything...'}
                        className="w-full bg-transparent border-none text-(--foreground) outline-none focus:ring-0 resize-none px-4 pt-[10px] pb-2 text-[15px] leading-relaxed placeholder:text-(--foreground)/30 overflow-y-auto scrollbar-none"
                        style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
                    />

                    {/* Bottom toolbar */}
                    <div className="flex items-center justify-between px-2 pb-2">

                        {/* Left: Attach */}
                        <div className="relative" ref={menuRef}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-full hover:bg-(--hover-bg) transition-colors text-(--foreground)/40 hover:text-(--foreground) cursor-pointer"
                            >
                                <Plus size={18} />
                            </motion.button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        transition={{ duration: ANIMATION_DURATION }}
                                        className="absolute bottom-full left-0 mb-2 w-44 bg-(--modal-bg) border border-(--border) rounded-2xl shadow-xl z-50 overflow-hidden py-1"
                                    >
                                        {[
                                            { label: 'Document', icon: Paperclip, ref: fileInputRef },
                                            { label: 'Image', icon: Image, ref: imageInputRef }
                                        ].map((item) => (
                                            <button
                                                key={item.label}
                                                type="button"
                                                onClick={() => { item.ref.current?.click(); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--hover-bg) transition-colors text-sm cursor-pointer"
                                            >
                                                <item.icon size={15} />
                                                <span>{item.label}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                        </div>

                        {/* Right: Model picker + Send */}
                        <div className="flex items-center gap-2">
                            <div className="relative" ref={modelMenuRef}>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-(--hover-bg) border border-border/40 transition-all cursor-pointer group text-xs font-semibold text-(--foreground)/50 hover:text-(--foreground)"
                                >
                                    <div className={cn("w-4 h-4 rounded-md flex items-center justify-center text-white shrink-0", currentModelData.color)}>
                                        <currentModelData.icon size={10} />
                                    </div>
                                    <span className="hidden sm:inline">{currentModelData.name}</span>
                                    <ChevronDown size={11} className={cn("transition-transform duration-200 text-(--foreground)/30", isModelSelectorOpen && "rotate-180")} />
                                </motion.button>

                                <AnimatePresence>
                                    {isModelSelectorOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            transition={{ duration: ANIMATION_DURATION }}
                                            className="absolute bottom-full right-0 mb-2 w-52 bg-(--modal-bg) border border-(--border) rounded-2xl shadow-xl z-50 overflow-hidden py-1.5"
                                        >
                                            {MODELS.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => { setSelectedModel(m.id); setIsModelSelectorOpen(false); }}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--hover-bg) transition-colors text-left group",
                                                        selectedModel === m.id && "bg-(--active-bg)"
                                                    )}
                                                >
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform", m.color)}>
                                                        <m.icon size={15} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold truncate">{m.name}</span>
                                                        <span className="text-[10px] text-(--foreground)/40">{m.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.button
                                whileHover={(!isSendDisabled || isResponding) ? { scale: 1.05 } : {}}
                                whileTap={(!isSendDisabled || isResponding) ? { scale: 0.95 } : {}}
                                type="button"
                                onClick={isResponding ? onStop : handleSubmit}
                                disabled={isSendDisabled && !isResponding}
                                className={cn(
                                    "w-9 h-9 rounded-full transition-all shrink-0 flex items-center justify-center",
                                    (isSendDisabled && !isResponding)
                                        ? "bg-(--foreground)/8 text-(--foreground)/20 cursor-not-allowed"
                                        : "bg-(--button-primary) hover:bg-(--button-primary-hover) text-white cursor-pointer shadow-sm"
                                )}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={isResponding ? 'stop' : (isUploading ? 'loading' : 'send')}
                                        initial={{ opacity: 0, scale: 0.5, rotate: isResponding ? -90 : 0 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.5, rotate: isResponding ? 90 : 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {isResponding ? (
                                            <Square size={14} fill="currentColor" strokeWidth={0} />
                                        ) : isUploading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <ArrowUp size={16} strokeWidth={2.5} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </LayoutGroup>

            <p className="text-[10px] text-center mt-2 text-(--foreground)/30 font-medium">
                AI can make mistakes. Check important info.
            </p>
        </div>
    );
};

export default ChatInput;