import { ChatWidget } from "@/components/chat/ChatWidget";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
