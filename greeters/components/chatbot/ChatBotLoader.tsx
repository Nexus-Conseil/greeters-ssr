"use client";

import dynamic from "next/dynamic";

const ChatBot = dynamic(() => import("@/components/chatbot/ChatBot"), { ssr: false });

export const ChatBotLoader = () => <ChatBot />;
