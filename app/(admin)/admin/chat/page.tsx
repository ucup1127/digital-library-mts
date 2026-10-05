// app/(admin)/admin/chat/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  Send,
  MessageSquare,
  Users,
  Clock,
  Loader2,
} from "lucide-react";

interface ChatUser {
  id: string;
  name: string | null;
  username: string | null;
  role: string;
  schoolId: string | null;
  school: { id: string; name: string } | null;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  user: ChatUser;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ============================================
  // INIT — Cek user + fetch pesan
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.user) {
          setCurrentUser(meData.user);
        }

        const res = await fetch("/api/chat?limit=50");
        if (!res.ok) throw new Error("Gagal memuat chat");
        const data = await res.json();
        setMessages(data.messages || []);
        setLastFetchTime(data.serverTime);
      } catch (error) {
        console.error("Init error:", error);
        toast.error("Gagal memuat chat");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // ============================================
  // POLLING — Fetch pesan baru tiap 5 detik
  // ============================================
  useEffect(() => {
    if (loading || !lastFetchTime) return;

    const interval = setInterval(async () => {
      try {
        setIsPolling(true);
        const res = await fetch(
          `/api/chat?since=${encodeURIComponent(lastFetchTime)}&limit=50`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => {
            // Merge — buang duplikat by id
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.messages.filter(
              (m: ChatMessage) => !existingIds.has(m.id)
            );
            return [...prev, ...newMsgs];
          });
          setLastFetchTime(data.serverTime);
        }
      } catch (error) {
        console.error("Polling error:", error);
      } finally {
        setIsPolling(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, lastFetchTime]);

  // ============================================
  // AUTO-SCROLL — Scroll ke bawah saat pesan baru
  // ============================================
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // ============================================
  // KIRIM PESAN
  // ============================================
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengirim");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setInput("");
      inputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ============================================
  // UTILS
  // ============================================
  const getInitials = (user: ChatUser) => {
    const name = user.name || user.username || "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700";
      case "ADMIN":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      default:
        return "User";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) return "Hari Ini";
    if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Auto-link URL di pesan
  const renderMessage = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            {part}
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Chat Admin
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Forum komunikasi antar admin sekolah
            <span className="text-blue-600 ml-1">
              • {messages.length} pesan
            </span>
            {isPolling && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                sync...
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Chat Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                Belum ada pesan
              </p>
              <p className="text-gray-300 text-xs mt-1">
                Mulai percakapan dengan admin sekolah lain
              </p>
            </div>
          ) : (
            groupedMessages.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                {/* Date Header */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                {/* Messages */}
                {group.messages.map((msg) => {
                  const isOwn = currentUser?.userId === msg.userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                          isOwn
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                            : "bg-gradient-to-br from-gray-500 to-gray-600"
                        }`}
                      >
                        {getInitials(msg.user)}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`flex flex-col max-w-[75%] ${
                          isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        {/* User Info (cuma kalau bukan pesan sendiri) */}
                        {!isOwn && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {msg.user.name || msg.user.username || "Unknown"}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[8px] font-medium rounded-full ${getRoleBadge(
                                msg.user.role
                              )}`}
                            >
                              {getRoleText(msg.user.role)}
                            </span>
                            {msg.user.school && (
                              <span className="text-[9px] text-gray-400">
                                {msg.user.school.name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                            isOwn
                              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm"
                              : "bg-gray-100 text-gray-800 rounded-tl-sm"
                          }`}
                        >
                          {renderMessage(msg.message)}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[9px] text-gray-400 mt-1 px-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50/50">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none max-h-32"
              rows={1}
              maxLength={2000}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
              title="Kirim pesan"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5 px-1">
            {input.length}/2000 karakter
          </p>
        </div>
      </div>
    </div>
  );
}