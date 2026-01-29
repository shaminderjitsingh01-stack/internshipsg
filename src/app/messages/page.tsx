"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { formatDistanceToNow } from "date-fns";

interface Participant {
  email: string;
  username: string | null;
  name: string;
  image: string | null;
  school: string | null;
  tier: string | null;
  level: number | null;
}

interface Message {
  id: string;
  content: string;
  sender_email: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  updated_at: string;
  participant: Participant | null;
  lastMessage: Message | null;
  unreadCount: number;
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    participant: Participant | null;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      const res = await fetch(
        `/api/messages?email=${encodeURIComponent(session.user.email)}`
      );

      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);

        // Simulate online status for demo (in production, use websockets/presence)
        const onlineSet = new Set<string>();
        data.conversations.forEach((conv: Conversation) => {
          if (conv.participant && Math.random() > 0.5) {
            onlineSet.add(conv.participant.email);
          }
        });
        setOnlineUsers(onlineSet);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status, fetchConversations]);

  // Search users for new conversation
  const searchUsers = useCallback(async (query: string) => {
    if (!session?.user?.email) return;

    try {
      setSearchingUsers(true);
      const res = await fetch(
        `/api/messages/search?email=${encodeURIComponent(session.user.email)}&q=${encodeURIComponent(query)}`
      );

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error("Failed to search users:", error);
    } finally {
      setSearchingUsers(false);
    }
  }, [session?.user?.email]);

  // Debounced search
  useEffect(() => {
    if (showNewConversation) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, showNewConversation, searchUsers]);

  // Focus search input when modal opens
  useEffect(() => {
    if (showNewConversation) {
      searchInputRef.current?.focus();
    }
  }, [showNewConversation]);

  // Start new conversation with user
  const startConversation = async (participant: Participant) => {
    if (!session?.user?.email) return;

    // Check if conversation already exists
    const existingConv = conversations.find(
      conv => conv.participant?.email === participant.email
    );

    if (existingConv) {
      selectConversation(existingConv.id);
      setShowNewConversation(false);
      setSearchQuery("");
      return;
    }

    // Create a temporary conversation object for new chat
    const tempConv: Conversation = {
      id: `new-${participant.email}`,
      updated_at: new Date().toISOString(),
      participant,
      lastMessage: null,
      unreadCount: 0,
    };

    setConversations(prev => [tempConv, ...prev]);
    setActiveConversationId(tempConv.id);
    setActiveConversation({
      id: tempConv.id,
      participant,
    });
    setMessages([]);
    setShowNewConversation(false);
    setSearchQuery("");
    setShowMobileConversation(true);
    inputRef.current?.focus();
  };

  // Check for conversation ID in URL
  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId && convId !== activeConversationId) {
      setActiveConversationId(convId);
      setShowMobileConversation(true);
    }
  }, [searchParams, activeConversationId]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!session?.user?.email) return;

    try {
      setLoadingMessages(true);
      const res = await fetch(
        `/api/messages/${conversationId}?email=${encodeURIComponent(session.user.email)}`
      );

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveConversation({
          id: data.conversation.id,
          participant: data.conversation.participant,
        });

        // Mark messages as read
        await fetch("/api/messages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_id: conversationId,
            user_email: session.user.email,
          }),
        });

        // Update unread count in conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      inputRef.current?.focus();
    }
  }, [activeConversationId]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user?.email || !activeConversationId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);

    // Check if this is a new conversation
    const isNewConversation = activeConversationId.startsWith("new-");
    const recipientEmail = isNewConversation
      ? activeConversationId.replace("new-", "")
      : null;

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_email: session.user.email,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_email: session.user.email,
          ...(isNewConversation
            ? { recipient_email: recipientEmail }
            : { conversation_id: activeConversationId }),
          content: messageContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace temp message with real one
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessage.id ? data.message : msg
          )
        );

        // If this was a new conversation, update the conversation ID
        if (isNewConversation && data.conversation_id) {
          const realConversationId = data.conversation_id;

          // Update active conversation
          setActiveConversationId(realConversationId);
          if (activeConversation) {
            setActiveConversation({
              ...activeConversation,
              id: realConversationId,
            });
          }

          // Update conversations list - replace temp with real
          setConversations(prev => {
            const updated = prev.map(conv =>
              conv.id === activeConversationId
                ? {
                    ...conv,
                    id: realConversationId,
                    lastMessage: data.message,
                    updated_at: new Date().toISOString(),
                  }
                : conv
            );
            return updated.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });

          // Update URL
          router.push(`/messages?conversation=${realConversationId}`, { scroll: false });
        } else {
          // Update conversation list
          setConversations(prev => {
            const updated = prev.map(conv =>
              conv.id === activeConversationId
                ? {
                    ...conv,
                    lastMessage: data.message,
                    updated_at: new Date().toISOString(),
                  }
                : conv
            );
            // Sort by updated_at
            return updated.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle conversation selection
  const selectConversation = (convId: string) => {
    setActiveConversationId(convId);
    setShowMobileConversation(true);
    router.push(`/messages?conversation=${convId}`, { scroll: false });
  };

  // Go back to list on mobile
  const handleBackToList = () => {
    setShowMobileConversation(false);
    setActiveConversationId(null);
    router.push("/messages", { scroll: false });
  };

  // Get total unread count
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (status === "loading" || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className={`min-h-screen transition-colors ${isDarkTheme ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkTheme ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/logo.png" alt="Internship.sg" className={`h-7 w-auto ${isDarkTheme ? 'brightness-0 invert' : ''}`} />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/home"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </span>
            </Link>
            <Link
              href="/jobs"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Jobs
              </span>
            </Link>
            <Link
              href="/network"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkTheme ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Network
              </span>
            </Link>
            <Link
              href="/messages"
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${isDarkTheme ? 'bg-slate-800 text-white' : 'bg-red-50 text-red-600'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </span>
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              {isDarkTheme ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Profile */}
            <Link
              href={`/u/${session.user.email?.split("@")[0]}`}
              className="flex items-center gap-2"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-red-900/50' : 'bg-red-100'}`}>
                  <span className="text-red-600 font-semibold">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto h-[calc(100vh-4rem)]">
        <div className={`flex h-full border-x ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
          {/* Conversations List (Left Sidebar) */}
          <div className={`w-full md:w-96 flex-shrink-0 border-r flex flex-col ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'} ${showMobileConversation ? 'hidden md:flex' : 'flex'}`}>
            {/* Conversations Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h1 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Messages
                </h1>
                {totalUnread > 0 && (
                  <p className={`text-sm mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    {totalUnread} unread message{totalUnread !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowNewConversation(true)}
                className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                title="New message"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                    No messages yet
                  </h3>
                  <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    Start a conversation with someone from your network!
                  </p>
                  <Link
                    href="/network"
                    className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Find People
                  </Link>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                      activeConversationId === conv.id
                        ? isDarkTheme
                          ? 'bg-slate-800'
                          : 'bg-red-50'
                        : isDarkTheme
                          ? 'hover:bg-slate-900'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      {conv.participant?.image ? (
                        <img
                          src={conv.participant.image}
                          alt={conv.participant.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-600'}`}>
                            {conv.participant?.name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                      {/* Online indicator */}
                      {conv.participant && onlineUsers.has(conv.participant.email) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                          {conv.participant?.name || "Unknown"}
                        </span>
                        <span className={`text-xs flex-shrink-0 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                          {conv.lastMessage && formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0
                            ? isDarkTheme
                              ? 'text-white font-medium'
                              : 'text-slate-900 font-medium'
                            : isDarkTheme
                              ? 'text-slate-400'
                              : 'text-slate-500'
                        }`}>
                          {conv.lastMessage
                            ? conv.lastMessage.sender_email === session.user.email
                              ? `You: ${conv.lastMessage.content}`
                              : conv.lastMessage.content
                            : "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Panel (Right Side) */}
          <div className={`flex-1 flex flex-col ${!showMobileConversation ? 'hidden md:flex' : 'flex'}`}>
            {activeConversationId && activeConversation ? (
              <>
                {/* Conversation Header */}
                <div className={`p-4 border-b flex items-center gap-3 ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                  {/* Back button (mobile) */}
                  <button
                    onClick={handleBackToList}
                    className={`md:hidden p-2 -ml-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    <svg className={`w-5 h-5 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* User Info */}
                  <Link
                    href={`/u/${activeConversation.participant?.username || activeConversation.participant?.email.split("@")[0]}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="relative flex-shrink-0">
                      {activeConversation.participant?.image ? (
                        <img
                          src={activeConversation.participant.image}
                          alt={activeConversation.participant.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-600'}`}>
                            {activeConversation.participant?.name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                      {activeConversation.participant && onlineUsers.has(activeConversation.participant.email) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className={`font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {activeConversation.participant?.name || "Unknown"}
                      </h2>
                      <p className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        {activeConversation.participant && onlineUsers.has(activeConversation.participant.email)
                          ? "Online"
                          : activeConversation.participant?.school || ""}
                      </p>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkTheme ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <svg className={`w-8 h-8 ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        No messages yet. Say hello!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwn = msg.sender_email === session.user.email;
                      const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_email !== msg.sender_email);

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && (
                              <div className="w-8 flex-shrink-0">
                                {showAvatar && activeConversation.participant && (
                                  activeConversation.participant.image ? (
                                    <img
                                      src={activeConversation.participant.image}
                                      alt=""
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-300'}`}>
                                      {activeConversation.participant.name?.charAt(0) || "?"}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? 'bg-red-600 text-white rounded-tr-md'
                                  : isDarkTheme
                                    ? 'bg-slate-800 text-white rounded-tl-md'
                                    : 'bg-white text-slate-900 rounded-tl-md shadow-sm'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-red-200' : isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className={`p-4 border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <button className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Write a message..."
                      className={`flex-1 px-4 py-2 rounded-full border ${
                        isDarkTheme
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500'
                          : 'bg-white border-slate-200 placeholder-slate-400 focus:border-red-500'
                      } outline-none transition-colors`}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className={`p-3 rounded-full transition-colors ${
                        newMessage.trim()
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : isDarkTheme
                            ? 'bg-slate-800 text-slate-500'
                            : 'bg-slate-100 text-slate-400'
                      } disabled:opacity-50`}
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <svg className={`w-12 h-12 ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className={`text-xl font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  Your Messages
                </h2>
                <p className={`text-center max-w-sm ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                  Select a conversation from the list to start messaging, or find new people to connect with.
                </p>
                <Link
                  href="/network"
                  className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Start a Conversation
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${isDarkTheme ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} ${showMobileConversation ? 'hidden' : ''}`}>
        <div className="flex items-center justify-around py-2">
          <Link href="/home" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link href="/jobs" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
          <Link href="/interview" className="p-3 -mt-4">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Link>
          <Link href="/network" className={`p-3 ${isDarkTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          <Link href="/messages" className="p-3 text-red-600 relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowNewConversation(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
          />

          {/* Modal */}
          <div className={`relative w-full max-w-md rounded-2xl shadow-xl ${isDarkTheme ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
              <h2 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                New Message
              </h2>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkTheme ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4">
              <div className="relative">
                <svg
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    isDarkTheme
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-red-500'
                      : 'bg-slate-50 border-slate-200 placeholder-slate-400 focus:border-red-500'
                  } outline-none transition-colors`}
                />
              </div>
            </div>

            {/* Results */}
            <div className={`max-h-80 overflow-y-auto border-t ${isDarkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
              {searchingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={`${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                    {searchQuery
                      ? "No users found. Try a different search."
                      : "Search for people to message"}
                  </p>
                </div>
              ) : (
                searchResults.map(user => (
                  <button
                    key={user.email}
                    onClick={() => startConversation(user)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                      isDarkTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                    }`}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkTheme ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <span className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-600'}`}>
                          {user.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                        {user.name}
                      </p>
                      <p className={`text-sm truncate ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
                        {user.username ? `@${user.username}` : user.school || user.email}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
