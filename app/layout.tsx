import type { Metadata } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const APP_URL = "https://chupete-chi.vercel.app";

export const metadata: Metadata = {
  title: "ChupeteClicker — Coleccionables Argentinos",
  description:
    "Clickeá el chupete, abrí cajas y coleccioná items únicos con rarezas exclusivas. Vendé en el mercado interno.",
  keywords: ["coleccionables", "argentina", "clicker", "items", "rarezas", "juego"],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "ChupeteClicker — Coleccionables Argentinos",
    description:
      "Clickeá el chupete, abrí cajas y coleccioná items únicos con rarezas exclusivas.",
    url: APP_URL,
    siteName: "ChupeteClicker",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "ChupeteClicker" }],
    type: "website",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChupeteClicker — Coleccionables Argentinos",
    description:
      "Clickeá el chupete, abrí cajas y coleccioná items únicos con rarezas exclusivas.",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body
        suppressHydrationWarning
        className="antialiased"
        style={{
          fontFamily: "var(--font-syne), Syne, sans-serif",
          background: "#000000",
          color: "#efefef",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
