"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, FlaskConical } from "lucide-react";
import type { ChatMessage, Lab } from "@/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I am Atryn, your research discovery assistant at U of T. I can help you find labs, professors, and research topics. Tell me about your interests or try asking something like \"find machine learning labs\".",
  timestamp: Date.now(),
};

export default function ChatPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("atryn-chat");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* ignore */ }
      }
    }
    return [WELCOME_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to sessionStorage so they survive navigation
  useEffect(() => {
    sessionStorage.setItem("atryn-chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: messageText, conversationHistory: history }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        labs: data.labs,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  const suggestions = [
    "Find machine learning labs",
    "Which labs accept undergrads?",
    "Robotics research at U of T",
    "Cybersecurity professors",
  ];

  const showSuggestions = messages.length <= 1;

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col bg-white">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-gray max-w-none [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-1 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mt-3 [&>h2]:mb-1 [&>ul]:my-1 [&>ol]:my-1 [&>p]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Lab cards */}
                  {msg.labs && msg.labs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.labs.map((lab: Lab) => (
                        <Link
                          key={lab.id}
                          href={`/labs/${lab.id}`}
                          className="block bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start gap-2">
                            <FlaskConical className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium text-primary text-sm">
                                {lab.labName}
                              </p>
                              {lab.professorName && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {lab.professorName} - {lab.department}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {lab.description?.slice(0, 120)}...
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs bg-accent text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 md:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMessages([WELCOME_MESSAGE]);
                sessionStorage.removeItem("atryn-chat");
              }}
              className="text-gray-300 hover:text-primary transition-colors p-2"
              title="New chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about research labs, professors, or topics..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-gray-300 text-center mt-2">
            Atryn is focused on research discovery. Results are for exploration - always verify details directly.
          </p>
        </div>
      </div>
    </div>
  );
}
