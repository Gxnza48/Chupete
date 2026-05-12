export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type LeaderEntry = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  [key: string]: unknown;
};

const TAB_LABELS: Record<string, string> = {
  clickers:    "Top Clickers",
  collectors:  "Top Coleccionistas",
  traders:     "Top Traders",
};

interface LeaderboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { tab = "clickers" } = await searchParams;
  const activeTab = ["clickers", "collectors", "traders"].includes(tab) ? tab : "clickers";

  const supabase = await createClient();

  let entries: LeaderEntry[] = [];
  let metricKey = "total_clicks";
  let metricLabel = "Clicks";
  let metricFormat = (v: number) => v.toLocaleString("es-AR");

  if (activeTab === "clickers") {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, level, total_clicks")
      .order("total_clicks", { ascending: false })
      .limit(10);
    entries = (data ?? []).map((p) => ({ ...p, user_id: p.id }));
    metricKey = "total_clicks";
    metricLabel = "Clicks";
  } else if (activeTab === "collectors") {
    const { data } = await supabase.rpc("get_top_collectors", { lim: 10 });
    entries = data ?? [];
    metricKey = "total_value";
    metricLabel = "Valor inventario";
    metricFormat = (v: number) => `${v.toLocaleString("es-AR")} cr.`;
  } else {
    const { data } = await supabase.rpc("get_top_traders", { lim: 10 });
    entries = data ?? [];
    metricKey = "trade_count";
    metricLabel = "Trades realizados";
    metricFormat = (v: number) => String(v);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" style={{ background: "#000000" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Leaderboard
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Los mejores jugadores de ChupeteClicker.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8">
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/leaderboard?tab=${key}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: activeTab === key ? "rgba(255,255,255,0.09)" : "transparent",
              color: activeTab === key ? "#efefef" : "#3a3a3a",
              border: activeTab === key ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
              fontFamily: "var(--font-syne), Syne, sans-serif",
              textDecoration: "none",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {entries.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: "#2a2a2a" }}>Aún no hay datos.</p>
        )}
        {entries.map((entry, idx) => {
          const rank = idx + 1;
          const med = medal(rank);
          const value = entry[metricKey] as number ?? 0;

          return (
            <Link
              key={entry.user_id}
              href={`/perfil/${entry.username}`}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
              style={{
                background: rank <= 3 ? "rgba(255,255,255,0.04)" : "#060606",
                border: rank === 1 ? "1px solid rgba(255,215,0,0.2)" : rank === 2 ? "1px solid rgba(192,192,192,0.15)" : rank === 3 ? "1px solid rgba(205,127,50,0.15)" : "1px solid rgba(255,255,255,0.04)",
                textDecoration: "none",
              }}
            >
              {/* Rank */}
              <div
                className="w-8 text-center font-bold text-sm flex-shrink-0"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: med ? "transparent" : "#2a2a2a",
                }}
              >
                {med ?? `#${rank}`}
              </div>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: "#606060" }}
              >
                {entry.username.slice(0, 1).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {entry.username}
                </p>
                <p className="text-[10px]" style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  Nv. {entry.level}
                </p>
              </div>

              {/* Metric */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {metricFormat(value)}
                </p>
                <p className="text-[10px]" style={{ color: "#2a2a2a" }}>{metricLabel}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
