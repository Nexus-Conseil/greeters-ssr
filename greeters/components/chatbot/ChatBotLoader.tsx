"use client";

import dynamic from "next/dynamic";

const ChatBot = dynamic(() => import("@/components/chatbot/ChatBot"), { ssr: false });

const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_API_URL !== "disabled";

export const ChatBotLoader = () => {
  if (!CHAT_ENABLED) {
    return null;
  }

  return <ChatBot />;
};
