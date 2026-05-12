"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useClickerContext } from "@/components/clicker/ClickerContext";
import { calculateLevel } from "@/lib/xp";
import { formatNum } from "@/lib/format";

const NAV_LINKS = [
  { href: "/", label: "Clickear" },
  { href: "/cases", label: "Cajas" },
  { href: "/inventario", label: "Inventario" },
  { href: "/mercado", label: "Mercado" },
  { href: "/upgrade", label: "Upgrade" },
  { href: "/crafteo", label: "Crafteo" },
  { href: "/subastas", label: "Subastas" },
  { href: "/leaderboard", label: "Ranking" },
  { href: "/trades", label: "Trades" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const supabase = createClient();

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
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  color: isActive ? "#efefef" : "#404040",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          {/* Notifications bell */}
          <Link
            href="/notificaciones"
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: pathname === "/notificaciones" ? "rgba(255,255,255,0.08)" : "transparent",
              color: "#404040",
            }}
          >
            <Bell size={16} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#4a9a4a" }} />
            )}
          </Link>

          {profile ? (
            <>
              {/* Profile — direct link, no dropdown */}
              <Link
                href={`/perfil/${profile.username}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150"
                style={{
                  background: pathname.startsWith("/perfil")
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#efefef",
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  textDecoration: "none",
                }}
              >
                <span className="font-medium truncate max-w-[70px] sm:max-w-[120px]">
                  {profile.username}
                </span>
                {profile.credits !== undefined && (
                  <span
                    className="hidden sm:inline text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(74,154,74,0.12)",
                      color: "#4a9a4a",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      border: "1px solid rgba(74,154,74,0.2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatNum(profile.credits ?? 0)} cr
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
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: "#404040", background: "transparent" }}
                title="Cerrar sesión"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,50,50,0.08)";
                  e.currentTarget.style.color = "#ff4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#404040";
                }}
              >
                <LogOut size={14} />
              </button>
            </>
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

          {/* Mobile hamburger — separate state */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: "#404040" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  color: isActive ? "#efefef" : "#404040",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          {profile && (
            <>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
              <Link
                href={`/perfil/${profile.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium"
                style={{
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                  color: "#efefef",
                  textDecoration: "none",
                }}
              >
                Mi Perfil
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="px-3 py-2 rounded-md text-sm font-medium text-left"
                style={{ fontFamily: "var(--font-syne), Syne, sans-serif", color: "#ff4444" }}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
