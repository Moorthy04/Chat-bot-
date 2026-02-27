import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, BASE_URL } from "../utils/api";
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

  // Fix 1: Track generating states and abort controllers globally
  const [generatingChatIds, setGeneratingChatIds] = useState(new Set());
  const abortControllers = useRef({});
  const [showExhaustionBanner, setShowExhaustionBanner] = useState(false);

  // ----------------------------
  // Dynamic Browser Tab Title
  // ----------------------------
  useEffect(() => {
    const baseTitle = "Chat Bot 2.0";
    let title = baseTitle;

    if (location.pathname === "/profile") {
      title = `Profile — ${baseTitle}`;
    } else if (location.pathname === "/login") {
      title = `Login — ${baseTitle}`;
    } else if (location.pathname === "/signup") {
      title = `Sign Up — ${baseTitle}`;
    } else if (location.pathname.startsWith("/chat/")) {
      const activeChat = chats.find(chat => chat.id === activeChatId);
      if (activeChat && activeChat.title) {
        title = `${activeChat.title}`;
      }
    }

    document.title = title;
  }, [location.pathname, activeChatId, chats]);

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

  // ----------------------------
  // Streaming Logic (Fix 1)
  // ----------------------------
  const sendMessage = async (content, attachments, selectedModel) => {
    let currentChatId = activeChatId;

    // Stop existing stream if any for this specific chat (though UI usually prevents this)
    if (abortControllers.current[currentChatId]) {
      abortControllers.current[currentChatId].abort();
    }

    const controller = new AbortController();

    // Create new chat if none active
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

    abortControllers.current[currentChatId] = controller;
    setGeneratingChatIds(prev => new Set(prev).add(currentChatId));

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
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Streaming failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';

        for (const frame of frames) {
          for (const line of frame.split('\n')) {
            if (!line.startsWith('data:')) continue;
            const raw = line.slice(5).trimStart();
            if (raw === '[DONE]') continue;
            try {
              assistantContent += JSON.parse(raw);
            } catch {
              assistantContent += raw;
            }
          }
        }
        updateLastMessage(currentChatId, assistantContent);
      }

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
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted for chat:', currentChatId);
      } else {
        updateLastMessage(currentChatId, 'Sorry, something went wrong with the connection.');
      }
    } finally {
      setGeneratingChatIds(prev => {
        const next = new Set(prev);
        next.delete(currentChatId);
        return next;
      });
      delete abortControllers.current[currentChatId];
    }
  };

  const stopGeneration = (chatId) => {
    const idToStop = chatId || activeChatId;
    if (abortControllers.current[idToStop]) {
      abortControllers.current[idToStop].abort();
    }
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
        generatingChatIds,
        showExhaustionBanner,
        setShowExhaustionBanner,
        createNewChat,
        renameChat,
        deleteChat,
        addMessage,
        updateLastMessage,
        sendMessage,
        stopGeneration,
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