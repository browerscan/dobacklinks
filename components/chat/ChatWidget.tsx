"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, MessageCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "How do I evaluate a site for guest posting?",
  "What's a good DA/DR for backlinks?",
  "How much should I pay for a guest post?",
];

const TIPS = [
  "Ask me about any website's backlink potential!",
  "I can help analyze if a site is worth pursuing",
  "Need help with outreach pricing? Just ask!",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show hint bubble after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowHint(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = { role: "user", content: content.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await response.json();

        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Sorry, I encountered an error: ${data.error}` },
          ]);
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't connect. Please try again." },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowHint(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary to-primary/80",
          "shadow-lg shadow-primary/25",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out",
          "hover:scale-110 hover:shadow-xl hover:shadow-primary/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          isOpen && "scale-0 opacity-0",
        )}
        aria-label="Open chat"
      >
        <div className="relative">
          <Image src="/logo.svg" alt="DoBacklinks" width={28} height={28} className="rounded-md" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </button>

      {/* Hint Bubble */}
      {showHint && !isOpen && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50",
            "max-w-[240px] p-3 rounded-xl",
            "bg-background/95 backdrop-blur-xl",
            "border border-primary/20",
            "shadow-xl shadow-primary/10",
            "animate-in fade-in slide-in-from-bottom-2 duration-300",
          )}
        >
          <button
            onClick={() => setShowHint(false)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/90">{TIPS[currentTip]}</p>
          </div>
          {/* Arrow pointer */}
          <div className="absolute -bottom-2 right-8 w-4 h-4 bg-background/95 border-r border-b border-primary/20 rotate-45" />
        </div>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={toggleChat}
          />

          {/* Chat Panel */}
          <div
            className={cn(
              "relative w-full max-w-[420px]",
              "bg-background/95 backdrop-blur-xl",
              "rounded-2xl border border-border/50",
              "shadow-2xl shadow-primary/10",
              "flex flex-col overflow-hidden",
              "animate-in zoom-in-95 fade-in duration-200",
            )}
            style={{ maxHeight: "min(600px, 85vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <Image
                      src="/logo.svg"
                      alt="DoBacklinks"
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Outreach Expert</h3>
                  <p className="text-xs text-muted-foreground">AI-powered analysis</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Backlink Analysis Expert</h4>
                  <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
                    I can help you evaluate websites for guest posting opportunities and backlink
                    value.
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    {QUICK_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(question)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl text-sm",
                          "bg-muted/50 hover:bg-muted",
                          "border border-border/50 hover:border-primary/30",
                          "text-foreground/80 hover:text-foreground",
                          "transition-all duration-200",
                        )}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md",
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1.5">
                          <span
                            className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about any website..."
                  disabled={isLoading}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-xl text-sm",
                    "bg-muted/50 border border-border/50",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200",
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-10 h-10 rounded-xl",
                    "bg-primary text-primary-foreground",
                    "flex items-center justify-center",
                    "hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200",
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Powered by AI | Browse{" "}
                <a href="/" className="text-primary hover:underline">
                  9,700+ vetted sites
                </a>
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
