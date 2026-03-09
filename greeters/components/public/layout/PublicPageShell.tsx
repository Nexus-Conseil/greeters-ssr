import { Footer } from "@/components/public/layout/Footer";
import { Header } from "@/components/public/layout/Header";
import { TopBar } from "@/components/public/layout/TopBar";

export const PublicPageShell = async ({ children, testId }: { children: React.ReactNode; testId: string }) => {
  return (
    <main className="site-page" data-testid={testId}>
      <TopBar />
      <Header />
      {children}
      <Footer />
    </main>
  );
};