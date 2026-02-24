import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    MoreHorizontal,
    LogOut,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Search,
    SquarePen,
    Trash2,
    Edit3,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { cn } from '../../utils/cn';

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { chats, activeChatId, createNewChat, renameChat, deleteChat } = useChat();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    const handleRename = (chatId) => {
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            setSelectedChatId(chatId);
            setRenameValue(chat.name);
            setShowRenameModal(true);
            setActiveMenu(null);
        }
    };

    const handleRenameSubmit = () => {
        if (renameValue.trim()) {
            renameChat(selectedChatId, renameValue.trim());
            setShowRenameModal(false);
            setRenameValue('');
            setSelectedChatId(null);
        }
    };

    const handleDeleteClick = (chatId) => {
        setSelectedChatId(chatId);
        setShowDeleteConfirm(true);
        setActiveMenu(null);
    };

    const handleDeleteConfirm = () => {
        deleteChat(selectedChatId);
        setShowDeleteConfirm(false);
        setSelectedChatId(null);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenu !== null) {
                const target = event.target;
                const isMenuButton = target.closest('button[data-menu-trigger]');
                const isMenuItem = target.closest('[data-action-menu]');
                
                if (!isMenuButton && !isMenuItem) {
                    setActiveMenu(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenu]);

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ 
                    width: isMobile ? '280px' : (isOpen ? '260px' : '0px'),
                    x: isMobile ? (isOpen ? 0 : -280) : 0,
                    opacity: isMobile && !isOpen ? 0 : 1
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                    "fixed md:relative h-full bg-[var(--sidebar-bg)] flex flex-col z-50 overflow-hidden border-r border-border transition-colors duration-300",
                    !isOpen && !isMobile && "border-none"
                )}
            >
                <div className="flex flex-col h-full w-[260px] sm:w-[280px] md:w-[260px]">
                    {/* Fixed Header */}
                    <div className="p-3 space-y-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    createNewChat();
                                    setSearchQuery('');
                                    if (isMobile) setIsOpen(false);
                                }}
                                className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-(--hover-bg) transition-colors cursor-pointer"
                            >
                                <SquarePen size={16} />
                                <span className="text-sm font-medium">New chat</span>
                            </button>

                            {isMobile && (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-(--hover-bg) transition-colors cursor-pointer text-foreground/70"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                            <input
                                type="text"
                                placeholder="Search chats"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-(--input-bg) border border-(--input-border) focus:ring-1 focus:ring-(--button-primary) text-sm outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Scrollable History List */}
                    <div className="flex-1 overflow-y-auto scrollbar-none px-3 space-y-1 pb-4">
                        <div className="text-xs font-semibold text-foreground/50 px-3 py-2 sticky top-0 bg-[var(--sidebar-bg)] z-10">Recent</div>
                        {chats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase())).map((chat) => (
                            <div key={chat.id} className={cn("relative group/item", activeMenu === chat.id ? "z-50" : "z-10")}>
                                <div 
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-(--hover-bg) transition-colors cursor-pointer relative",
                                        activeChatId === chat.id && "bg-(--active-bg)"
                                    )}
                                >
                                    <button 
                                        onClick={() => {
                                            navigate(`/chat/${chat.id}`);
                                            if (isMobile) setIsOpen(false);
                                        }}
                                        className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
                                    >
                                        <MessageSquare size={16} className="shrink-0" />
                                        <span className="text-sm truncate">{chat.name}</span>
                                    </button>
                                    
                                    <button
                                        data-menu-trigger
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === chat.id ? null : chat.id);
                                        }}
                                        className={cn(
                                            "opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer p-1 hover:bg-(--active-bg) rounded shrink-0",
                                            activeMenu === chat.id && "opacity-100 bg-(--active-bg)"
                                        )}
                                    >
                                        < MoreHorizontal size={16} />
                                    </button>
                                </div>
                                
                                {/* Action Menu */}
                                <AnimatePresence>
                                    {activeMenu === chat.id && (
                                        <motion.div
                                            data-action-menu
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-1 top-10 w-44 bg-(--modal-bg) border border-(--border) rounded-xl shadow-2xl z-[100] overflow-hidden py-1"
                                        >
                                            <button
                                                onClick={() => handleRename(chat.id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-(--hover-bg) transition-colors text-sm cursor-pointer"
                                            >
                                                <Edit3 size={16} />
                                                <span>Rename</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(chat.id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-500 transition-colors text-sm cursor-pointer border-t border-(--border)"
                                            >
                                                <Trash2 size={16} />
                                                <span>Delete</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* Fixed Footer */}
                    <div className="shrink-0 p-3 border-t border-(--border) bg-[var(--sidebar-bg)]">
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer group/user">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10">
                                {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm font-medium truncate flex-1 text-foreground">
                                {user?.username ? (user.username.charAt(0).toUpperCase() + user.username.slice(1)) : 'Guest'}
                            </span>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="p-2 rounded-full hover:bg-(--hover-bg) transition-colors cursor-pointer text-foreground/60 hover:text-foreground"
                            >
                                <LogOut size={16}/>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Toggle Button (Desktop Only) */}
            {!isMobile && (
                <div className={cn(
                    "fixed top-1/2 -translate-y-1/2 z-[100] transition-all duration-300 pointer-events-none group",
                    isOpen ? "left-[248px]" : "left-2"
                )}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "w-6 h-6 rounded-full bg-(--background) border border-(--border) shadow-md flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-200",
                            "opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95",
                            
                        )}
                        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {isOpen ? <ChevronLeft size={14} className="text-foreground/40" /> : <ChevronRight size={14} className="text-foreground/40" />}
                    </button>
                </div>
            )}

            {/* Modals Container */}
            <AnimatePresence>
                {(showRenameModal || showDeleteConfirm || showLogoutConfirm) && (
                    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        {showRenameModal && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-(--modal-bg) border border-(--border) rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
                            >
                                <h3 className="text-lg font-semibold mb-4 text-foreground">Rename Chat</h3>
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameSubmit();
                                        if (e.key === 'Escape') {
                                            setShowRenameModal(false);
                                            setRenameValue('');
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-lg border border-(--border) bg-(--input-bg) text-foreground focus:border-(--button-primary) focus:ring-1 focus:ring-(--button-primary) outline-none transition-all mb-6"
                                    placeholder="Enter new name"
                                    autoFocus
                                />
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowRenameModal(false);
                                            setRenameValue('');
                                        }}
                                        className="px-5 py-2.5 rounded-lg hover:bg-(--hover-bg) transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRenameSubmit}
                                        className="px-5 py-2.5 rounded-lg bg-(--button-primary) hover:bg-(--button-primary-hover) text-white transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Rename
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {showDeleteConfirm && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-(--modal-bg) border border-(--border) rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                            >
                                <div className="flex items-center gap-3 mb-4 text-red-500">
                                    <AlertCircle size={24} />
                                    <h3 className="text-lg font-semibold">Delete Chat</h3>
                                </div>
                                <p className="text-foreground/70 mb-6 text-sm">
                                    Are you sure you want to delete this chat? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-5 py-2.5 rounded-lg hover:bg-(--hover-bg) transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteConfirm}
                                        className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {showLogoutConfirm && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-(--modal-bg) border border-(--border) rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
                            >
                                <div className="flex items-center gap-3 mb-4 text-red-500">
                                    <AlertCircle size={24} />
                                    <h3 className="text-lg font-semibold">Confirm Logout</h3>
                                </div>
                                <p className="text-foreground/70 mb-6 text-sm">
                                    Are you sure you want to log out? You will need to sign in again to access your chats.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setShowLogoutConfirm(false)}
                                        className="px-5 py-2.5 rounded-lg hover:bg-(--hover-bg) transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
