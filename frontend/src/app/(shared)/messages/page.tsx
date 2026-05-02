"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import api from "@/lib/api";

type Conversation = {
  _id: string;
  participant: { _id: string; name: string; role: string };
  lastMessage: string;
  updatedAt: string;
  unread: number;
};

type Message = {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/messages/conversations");
        setConversations(data || []);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    const fetch = async () => {
      try {
        const { data } = await api.get(`/messages/${activeConvo}`);
        setMessages(data || []);
      } catch {
        setMessages([]);
      }
    };
    fetch();
  }, [activeConvo]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo) return;
    try {
      const { data } = await api.post(`/messages/${activeConvo}`, { content: newMsg.trim() });
      setMessages((prev) => [...prev, data]);
      setNewMsg("");
    } catch { /* silent */ }
  };

  const activeParticipant = conversations.find((c) => c._id === activeConvo)?.participant;

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-display">Messages</h1>
        </div>

        <div className="card !p-0 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div
              className={`w-full md:w-80 border-r flex flex-col ${!showList && activeConvo ? "hidden md:flex" : "flex"}`}
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-sm font-bold">{conversations.length} Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-surface)" }} />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <span className="text-3xl block mb-2">💬</span>
                    <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => { setActiveConvo(c._id); setShowList(false); }}
                      className="w-full text-left p-4 flex items-center gap-3 transition-colors"
                      style={{
                        backgroundColor: activeConvo === c._id ? "var(--color-primary-lt)" : "transparent",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {c.participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm truncate">{c.participant.name}</p>
                          <span className="text-[10px] flex-shrink-0" style={{ color: "var(--color-ink-3)" }}>
                            {timeAgo(c.updatedAt)}
                          </span>
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-ink-3)" }}>
                          {c.lastMessage}
                        </p>
                      </div>
                      {c.unread > 0 && (
                        <span
                          className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          {c.unread}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${showList && !activeConvo ? "hidden md:flex" : "flex"}`}>
              {!activeConvo ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-4xl block mb-3">📨</span>
                    <p className="font-semibold mb-1">Select a conversation</p>
                    <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>Choose from the list to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
                    <button className="md:hidden p-1" onClick={() => { setShowList(true); setActiveConvo(null); }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {activeParticipant?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{activeParticipant?.name}</p>
                      <p className="text-[10px] uppercase" style={{ color: "var(--color-ink-3)" }}>{activeParticipant?.role}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: "var(--color-surface)" }}>
                    {messages.length === 0 ? (
                      <p className="text-center text-sm py-8" style={{ color: "var(--color-ink-3)" }}>No messages yet. Say hello!</p>
                    ) : (
                      messages.map((m) => {
                        const isMine = m.sender !== activeParticipant?._id;
                        return (
                          <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div
                              className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm"
                              style={{
                                backgroundColor: isMine ? "var(--color-primary)" : "white",
                                color: isMine ? "white" : "var(--color-ink)",
                                borderBottomRightRadius: isMine ? "4px" : "16px",
                                borderBottomLeftRadius: isMine ? "16px" : "4px",
                              }}
                            >
                              <p>{m.content}</p>
                              <p className="text-[10px] mt-1" style={{ opacity: 0.6 }}>
                                {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEnd} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        className="input-field flex-1 !text-sm"
                      />
                      <button onClick={sendMessage} className="btn-primary !px-4" disabled={!newMsg.trim()}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
