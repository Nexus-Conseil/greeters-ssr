"use client";

import dynamic from "next/dynamic";

const ChatBot = dynamic(() => import("@/components/chatbot/ChatBot"), { ssr: false });

const CHAT_ENABLED = Boolean(process.env.NEXT_PUBLIC_CHAT_API_URL);

export const ChatBotLoader = () => {
  if (!CHAT_ENABLED) {
    return null;
  }

  return <ChatBot />;
};
