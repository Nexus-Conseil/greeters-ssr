"use client";

import { useState, useCallback, lazy, Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import ChatButton from "./ChatButton";

const ChatWindow = lazy(() => import("./ChatWindow"));

const HIDDEN_PAGES = ["/admin"];

export default function ChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [ready, setReady] = useState(false);

  // Defer rendering until browser is idle — zero impact on PageSpeed
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const shouldHide = HIDDEN_PAGES.some((p) => pathname.startsWith(p));

  const toggle = useCallback(() => {
    setIsOpen((v) => {
      if (!v) setHasOpened(true);
      return !v;
    });
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  if (!ready || shouldHide) return null;

  return (
    <>
      <ChatButton onClick={toggle} isOpen={isOpen} />
      {hasOpened && (
        <Suspense fallback={
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10000] bg-white shadow-2xl flex items-center justify-center border border-slate-200"
            style={{ width: 576, maxWidth: "95vw", height: 600, borderRadius: 10 }}>
            <div className="animate-spin w-10 h-10 border-4 border-[#8bc34a] border-t-transparent rounded-full" />
          </div>
        }>
          {isOpen && <ChatWindow onClose={close} />}
        </Suspense>
      )}
    </>
  );
}
