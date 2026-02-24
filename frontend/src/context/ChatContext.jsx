import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse chat ID from URL
  const activeChatId = location.pathname.startsWith('/chat/') 
    ? location.pathname.split('/')[2] 
    : null;
  

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  // ----------------------------
  // Fetch chat list on auth
  // ----------------------------
  useEffect(() => {
    if (!user) {
      setChats([]);
      setLoading(false);
      return;
    }

    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/conversations/");
      setChats(res.map(c => ({ ...c, name: c.title })));
    } catch (err) {
      // Failed to fetch chats
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------
  // Fetch FULL chat when URL id changes
  // --------------------------------------
  useEffect(() => {
    if (!activeChatId || !user) return;

    const chat = chats.find(c => c.id === activeChatId);

    // If messages not loaded yet → fetch details
    if (!chat || !chat.messages) {
      fetchChatDetail(activeChatId);
    }
  }, [location.pathname, chats, user]);

  const fetchChatDetail = async (chatId) => {
    try {
      setChatLoading(true);
      const fullChat = await api.get(`/api/conversations/${chatId}/`);
      setChats(prev =>
        prev.map(c =>
          c.id === chatId
            ? { ...fullChat, name: fullChat.title }
            : c
        )
      );
    } catch (err) {
      navigate("/chat"); // invalid ID fallback
    } finally {
      setChatLoading(false);
    }
  };

  // ----------------------------
  // Routing-based actions
  // ----------------------------
  const createNewChat = () => {
    navigate("/chat"); // ✅ URL defines state
  };

  const renameChat = async (chatId, newName) => {
    try {
      await api.patch(`/api/conversations/${chatId}/`, { title: newName });
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? { ...chat, title: newName, name: newName }
            : chat
        )
      );
    } catch (err) {
      // Failed to rename chat
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await api.delete(`/api/conversations/${chatId}/`);
      setChats(prev => prev.filter(chat => chat.id !== chatId));

      if (chatId === activeChatId) {
        navigate("/chat");
      }
    } catch (err) {
      // Failed to delete chat
    }
  };

  // ----------------------------
  // Message helpers
  // ----------------------------
  const addMessage = (chatId, message) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...(chat.messages || []), message] }
          : chat
      )
    );
  };

  const updateLastMessage = (chatId, content) => {
    setChats(prev =>
      prev.map(chat => {
        if (chat.id !== chatId) return chat;
        const msgs = [...(chat.messages || [])];
        if (msgs.length > 0) {
          msgs[msgs.length - 1] = {
            ...msgs[msgs.length - 1],
            content,
          };
        }
        return { ...chat, messages: msgs };
      })
    );
  };

  const getActiveChat = () => {
    if (!activeChatId) return null;
    return chats.find(chat => chat.id === activeChatId) || null;
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        loading,
        chatLoading,
        createNewChat,
        renameChat,
        deleteChat,
        addMessage,
        updateLastMessage,
        getActiveChat,
        setChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};