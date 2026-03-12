import { Footer } from "@/components/public/layout/Footer";
import { Header } from "@/components/public/layout/Header";
import { TopBar } from "@/components/public/layout/TopBar";
import { ChatBotLoader } from "@/components/chatbot/ChatBotLoader";
import { getRequestLocale } from "@/lib/i18n/request";

export const PublicPageShell = async ({ children, testId }: { children: React.ReactNode; testId: string }) => {
  const locale = await getRequestLocale();

  return (
    <main className="min-h-screen flex flex-col bg-white" data-testid={testId}>
      <TopBar initialLocale={locale} />
      <Header />
      {children}
      <Footer />
      <ChatBotLoader />
    </main>
  );
};