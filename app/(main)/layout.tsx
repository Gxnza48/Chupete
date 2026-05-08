export const dynamic = "force-dynamic";

import Navbar from "@/components/ui/Navbar";
import { ClickerProvider } from "@/components/clicker/ClickerContext";
import { ToastProvider } from "@/components/ui/Toast";
import SessionRefresher from "@/components/auth/SessionRefresher";
import NotificationWatcher from "@/components/auth/NotificationWatcher";
import WelcomeModal from "@/components/ui/WelcomeModal";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ClickerProvider>
        <div style={{ background: "#000000", minHeight: "100vh" }}>
          <SessionRefresher />
          <NotificationWatcher />
          <WelcomeModal />
          <Navbar />
          <main>{children}</main>
        </div>
      </ClickerProvider>
    </ToastProvider>
  );
}
