"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import Image from "next/image";

export default function ChatButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight;
      const pageH = document.documentElement.scrollHeight;
      setIsNearFooter(scrollPos >= pageH - 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseHide = isNearFooter ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0";

  if (isOpen) {
    return (
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${baseHide}`}>
        <button
          onClick={onClick}
          className="px-6 py-4 bg-gradient-to-r from-[#8bc34a] to-[#558b2f] text-white rounded-full shadow-2xl hover:shadow-[#8bc34a]/50 transition-all flex items-center space-x-3"
          aria-label="Fermer le chat"
          data-testid="chat-button-close"
        >
          <X size={24} />
          <span className="font-semibold">Fermer</span>
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed right-6 z-[90] w-12 h-12 rounded-full bg-[#689f38] hover:bg-[#558b2f] text-white shadow-lg flex items-center justify-center transition-all duration-300 ${baseHide}`}
        style={{ top: "50%", transform: "translateY(-50%)" }}
        aria-label="Ouvrir le chat"
        data-testid="chat-button-minimized"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center transition-all duration-300 ${baseHide}`}>
      <div className="relative flex items-center">
        <button
          onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
          className="absolute left-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Réduire le chat"
          data-testid="chat-minimize-button"
        >
          <X size={20} className="text-white" />
        </button>

        <button
          onClick={onClick}
          className="relative pl-14 pr-6 py-3 sm:py-4 bg-gradient-to-r from-[#8bc34a] to-[#558b2f] hover:from-[#7cb342] hover:to-[#4a7c29] text-white font-medium rounded-full shadow-lg hover:shadow-xl w-[calc(100vw-100px)] sm:w-auto sm:min-w-[340px] max-w-[400px] text-left"
          aria-label="Ouvrir le chat"
          data-testid="chat-button"
        >
          <span className="text-sm sm:text-base leading-tight">Des questions ? On vous répond 24h/24</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2" style={{ zIndex: 10, bottom: "100%", marginBottom: -25 }}>
          <Image
            src="/couple-greeters.png"
            alt="Greeters de Paris"
            width={200}
            height={220}
            className="drop-shadow-2xl w-[140px] sm:w-[200px] h-auto"
            loading="lazy"
            data-testid="chat-couple-image"
          />
        </div>
      </div>
    </div>
  );
}
