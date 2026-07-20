"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ChatWidget({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    clearError();
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/5">
            <div>
              <p className="text-sm font-semibold">Patch Assistant</p>
              <p className="text-xs text-zinc-500">Sizing, care &amp; sourcing questions</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-500">
                Hi — ask me about sizing on a one-of-one piece, fabric care, or how the upcycling
                process works.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                )}
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            ))}
            {status === "submitted" && (
              <p className="text-xs text-zinc-400">Patch Assistant is typing…</p>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                {error.message || "Patch Assistant could not reply right now. Please try again in a moment."}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/5 p-3 dark:border-white/5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/10"
            />
            <button
              type="submit"
              disabled={status === "submitted" || status === "streaming"}
              className="rounded-full bg-zinc-900 p-2 text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl transition-transform hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
        aria-label="Open chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
