"use client";

import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((module) => module.ChatWidget),
  { ssr: false }
);

export function LazyChatWidget() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) return <ChatWidget initialOpen />;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setLoaded(true)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-xl transition-transform hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
        aria-label="Open chat"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
