export const dynamic = "force-dynamic";

import ClickerGame from "@/components/clicker/ClickerGame";

export default async function Home() {
  return (
    <div
      className="flex flex-col items-center min-h-[calc(100vh-56px)] px-4 py-12"
      style={{ background: "#000000" }}
    >
      {/* Logo */}
      <div className="text-center mb-10">
        <h1
          className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1"
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            color: "#efefef",
          }}
        >
          ChupeteClicker
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>
          Clickeá · Coleccioná · Vendé
        </p>
      </div>

      {/* Clicker Game (Area, Feed, StatsBar) */}
      <ClickerGame />
    </div>
  );
}
