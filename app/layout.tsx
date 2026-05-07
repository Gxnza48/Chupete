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

export const metadata: Metadata = {
  title: "ChupeteClicker — Coleccionables Argentinos",
  description:
    "Clickeá el chupete y conseguí items coleccionables con rarezas únicas. Vendé en el mercado interno con Mercado Pago.",
  keywords: [
    "coleccionables",
    "argentina",
    "clicker",
    "mercado pago",
    "items",
    "rarezas",
  ],
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
