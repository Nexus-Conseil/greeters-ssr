"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, Loader2, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const BACKEND_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "";

const TRANSLATIONS: Record<string, { placeholder: string; welcome: string }> = {
  fr: { placeholder: "Posez votre question...", welcome: "Bonjour ! Comment puis-je vous aider ?" },
  en: { placeholder: "Ask your question...", welcome: "Hello! How can I help you?" },
  de: { placeholder: "Stellen Sie Ihre Frage...", welcome: "Hallo! Wie kann ich Ihnen helfen?" },
  es: { placeholder: "Haga su pregunta...", welcome: "¡Hola! ¿Cómo puedo ayudarte?" },
  it: { placeholder: "Fai la tua domanda...", welcome: "Ciao! Come posso aiutarti?" },
  pt: { placeholder: "Faça sua pergunta...", welcome: "Olá! Como posso ajudá-lo?" },
};

const BOOKING_TRIGGER = [/cliquez sur le bouton/i, /click the button/i, /klicken sie auf die schaltfläche/i, /haga clic en el botón/i];
const CONFIRMATION_PATTERNS = [/souhaitez-vous vous rendre sur le formulaire/i, /would you like to go to the booking form/i, /möchten sie zum buchungsformular/i, /¿le gustaría ir al formulario/i];

const QUICK_REPLIES: Record<string, { yes: string; no: string }> = {
  fr: { yes: "Oui, allons-y !", no: "Non, j'ai d'autres questions" },
  en: { yes: "Yes, let's go!", no: "No, I have more questions" },
  de: { yes: "Ja, los geht's!", no: "Nein, ich habe weitere Fragen" },
  es: { yes: "¡Sí, vamos!", no: "No, tengo más preguntas" },
  it: { yes: "Sì, andiamo!", no: "No, ho altre domande" },
  pt: { yes: "Sim, vamos!", no: "Não, tenho mais perguntas" },
};

const BOOKING_LABELS: Record<string, string> = {
  fr: "Réserver une balade", en: "Book a walk", de: "Einen Spaziergang buchen",
  es: "Reservar un paseo", it: "Prenota una passeggiata", pt: "Reservar um passeio",
};

type Message = { role: "user" | "assistant"; content: string };

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatWindow({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => generateId());
  const [language, setLanguage] = useState("fr");
  const endRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language] ?? TRANSLATIONS.fr;

  // Welcome message
  useEffect(() => {
    const w = TRANSLATIONS[language]?.welcome ?? TRANSLATIONS.fr.welcome;
    setMessages([{ role: "assistant", content: w }]);
  }, []);

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: msg, language }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Désolé, une erreur s'est produite." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, language]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(); };

  const lastAssistantMsg = messages.filter((m) => m.role === "assistant").pop()?.content ?? "";
  const isConfirmation = CONFIRMATION_PATTERNS.some((p) => p.test(lastAssistantMsg));
  const showBooking = BOOKING_TRIGGER.some((p) => p.test(lastAssistantMsg)) && !isConfirmation;
  const qr = QUICK_REPLIES[language] ?? QUICK_REPLIES.fr;
  const bookingUrl = `https://gestion.parisiendunjour.fr/visits/new?nt=pdj&locale=${language}`;

  return (
    <div
      className="fixed bottom-28 z-[10000] bg-white shadow-2xl flex flex-col border border-slate-200"
      style={{ width: "min(576px, 95vw)", height: "min(600px, 70vh)", borderRadius: 10, left: "50%", transform: "translateX(-50%)" }}
      data-testid="chat-window"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8bc34a] to-[#558b2f] text-white p-4 flex items-center justify-between" style={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-sm bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none cursor-pointer [&>option]:text-slate-800 [&>option]:bg-white"
          data-testid="chat-language-selector"
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
          <option value="de">DE</option>
          <option value="es">ES</option>
          <option value="it">IT</option>
          <option value="pt">PT</option>
        </select>
        <span className="font-semibold">Paris Greeters</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors" aria-label="Fermer" data-testid="chat-close-button">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" data-testid="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-gradient-to-br from-[#8bc34a] to-[#558b2f] text-white"
                : "bg-white text-slate-800 border border-slate-200 shadow-sm"
            }`} data-testid={`chat-message-${msg.role}`}>
              {msg.role === "assistant" ? (
                <ReactMarkdown components={{ p: ({children}) => <p className="mb-2 last:mb-0">{children}</p> }}>{msg.content}</ReactMarkdown>
              ) : msg.content}
            </div>
          </div>
        ))}

        {/* Quick replies */}
        {isConfirmation && !loading && (
          <div className="flex gap-2 flex-wrap" data-testid="chat-quick-replies">
            <button onClick={() => sendMessage(qr.yes)} className="px-4 py-2 text-sm bg-gradient-to-r from-[#8bc34a] to-[#558b2f] text-white rounded-lg hover:opacity-90 transition-opacity" data-testid="chat-quick-reply-yes">{qr.yes}</button>
            <button onClick={() => sendMessage(qr.no)} className="px-4 py-2 text-sm bg-white text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors" data-testid="chat-quick-reply-no">{qr.no}</button>
          </div>
        )}

        {/* Booking button */}
        {showBooking && (
          <div className="flex justify-center" data-testid="chat-booking-button-container">
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8bc34a] to-[#558b2f] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
              data-testid="chat-booking-button">
              {BOOKING_LABELS[language] ?? BOOKING_LABELS.fr} <ChevronDown size={16} className="rotate-[-90deg]" />
            </a>
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2" style={{ borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8bc34a] disabled:bg-slate-100"
          data-testid="chat-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-gradient-to-r from-[#8bc34a] to-[#558b2f] text-white rounded-xl disabled:opacity-50 transition-opacity"
          data-testid="chat-send-button"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
