"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, User, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useClickerContext } from "@/components/clicker/ClickerContext";
import { calculateLevel } from "@/lib/xp";

const NAV_LINKS = [
  { href: "/", label: "Clickear" },
  { href: "/cases", label: "Cajas" },
  { href: "/inventario", label: "Inventario" },
  { href: "/mercado", label: "Mercado" },
  { href: "/trades", label: "Trades" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const supabase = createClient();

  // Check for unread notifications
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const lastSeen = localStorage.getItem("notif_last_seen");
      const since = lastSeen ?? new Date(0).toISOString();
      const { count } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
        .gt("completed_at", since);
      setHasUnread((count ?? 0) > 0);
    }
    check();
  }, [supabase, pathname]);
  const { profile } = useProfile();
  const { localClicks } = useClickerContext();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  // OPTIMISTIC LEVEL: Ensure the level in the navbar updates instantly while on the home page
  const displayLevel = profile 
    ? calculateLevel(profile.xp + Math.max(0, localClicks - profile.total_clicks) * 2).level
    : 1;

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: "#000000",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight select-none"
          style={{
            fontFamily: "var(--font-syne), Syne, sans-serif",
            color: "#efefef",
            textDecoration: "none",
          }}
        >
          <span className="text-xl">🍬</span>
          <span>ChupeteClicker</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  color: isActive ? "#efefef" : "#404040",
                  background: isActive
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <Link
            href="/notificaciones"
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: pathname === "/notificaciones" ? "rgba(255,255,255,0.08)" : "transparent", color: "#404040" }}
          >
            <Bell size={16} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#4a9a4a" }} />
            )}
          </Link>

          {profile ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150"
                style={{
                  background: menuOpen
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#efefef",
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                }}
              >
                <span className="font-medium">{profile.username}</span>
                {profile.credits !== undefined && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(74,154,74,0.12)",
                      color: "#4a9a4a",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      border: "1px solid rgba(74,154,74,0.2)",
                    }}
                  >
                    {(profile.credits ?? 0).toLocaleString("es-AR")} cr.
                  </span>
                )}
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#404040",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  Nv.{displayLevel}
                </span>
                <svg
                  className="w-3 h-3 transition-transform"
                  style={{
                    transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: "#404040",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-50"
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <Link
                    href={`/perfil/${profile.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                    style={{
                      color: "#efefef",
                      fontFamily: "var(--font-syne), Syne, sans-serif",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <User size={14} className="inline-block" /> Mi Perfil
                  </Link>
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.05)",
                      margin: "4px 0",
                    }}
                  />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors"
                    style={{
                      color: "#ff4444",
                      fontFamily: "var(--font-syne), Syne, sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,50,50,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <LogOut size={14} className="inline-block" /> Salir
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "#efefef",
                color: "#000000",
                fontFamily: "var(--font-syne), Syne, sans-serif",
                textDecoration: "none",
              }}
            >
              Ingresar
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: "#404040" }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  color: isActive ? "#efefef" : "#404040",
                  background: isActive
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
