export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────
type LeaderEntry = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  [key: string]: unknown;
};

type CosmeticRow = {
  user_id: string;
  shop_item: { key: string; type: string; icon: string; name: string } | null;
};

type UserCosmetics = {
  frame: string | null;  // frame key
  charms: string[];      // charm icons
};

// ── Frame styling (mirrors ProfileHeader) ─────────────────────────────────────
const FRAME_STYLES: Record<string, React.CSSProperties> = {
  gold:  { border: "2px solid #ffaa00", boxShadow: "0 0 10px #ffaa0060" },
  neon:  { border: "2px solid #4a9a4a", boxShadow: "0 0 10px #4a9a4a60" },
  void:  { border: "2px solid #8050d0", boxShadow: "0 0 14px #8050d070" },
};
const FRAME_CLASSES: Record<string, string> = {
  plasma:  "frame-plasma frame-glint",
  blood:   "frame-blood frame-glint",
  rainbow: "frame-rainbow frame-glint",
};

function getLevelBorderStyle(level: number): React.CSSProperties {
  if (level >= 100) return { border: "2px solid #ff4444", boxShadow: "0 0 12px #ff444460" };
  if (level >= 50)  return { border: "2px solid #8050d0", boxShadow: "0 0 10px #8050d060" };
  if (level >= 25)  return { border: "2px solid #c8952a", boxShadow: "0 0 8px #c8952a60"  };
  if (level >= 10)  return { border: "2px solid #4a9a4a", boxShadow: "0 0 6px #4a9a4a50"  };
  return { border: "2px solid rgba(255,255,255,0.1)" };
}
function getLevelFrameClass(level: number): string {
  if (level >= 100) return "frame-rainbow frame-glint";
  if (level >= 50)  return "frame-plasma";
  return "";
}
function getLevelBadgeStyle(level: number): React.CSSProperties {
  if (level >= 100) return { background: "linear-gradient(135deg,#ff4444,#ff8800)", color: "#fff", fontWeight: "bold" };
  if (level >= 50)  return { background: "#8050d0", color: "#fff", boxShadow: "0 0 6px #8050d060" };
  if (level >= 25)  return { background: "#c8952a", color: "#fff" };
  if (level >= 10)  return { background: "#4a9a4a", color: "#fff" };
  return { background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)", color: "#efefef" };
}

// ── Avatar with frame + charm ─────────────────────────────────────────────────
function LeaderAvatar({
  username,
  avatar_url,
  level,
  cosmetics,
}: {
  username: string;
  avatar_url: string | null;
  level: number;
  cosmetics: UserCosmetics;
}) {
  const hasFrame = !!cosmetics.frame;

  // Frame overrides level border
  const frameStyle  = hasFrame ? (FRAME_STYLES[cosmetics.frame!] ?? {})  : getLevelBorderStyle(level);
  const frameClass  = hasFrame ? (FRAME_CLASSES[cosmetics.frame!] ?? "")  : getLevelFrameClass(level);
  const badgeStyle  = getLevelBadgeStyle(level);
  const firstCharm  = cosmetics.charms[0] ?? null;

  return (
    <div className="relative flex-shrink-0">
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center${frameClass ? ` ${frameClass}` : ""}`}
        style={{ background: "#0a0a0a", ...frameStyle }}
      >
        {avatar_url ? (
          <Image src={avatar_url} alt={username} width={40} height={40} className="object-cover w-full h-full" />
        ) : (
          <span className="text-lg font-bold" style={{ color: "#404040" }}>
            {username[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Level badge */}
      <div
        className="absolute -bottom-1.5 -right-1.5 px-1.5 py-px rounded-md text-[9px] font-bold leading-none"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace", ...badgeStyle }}
      >
        {level}
      </div>

      {/* First charm */}
      {firstCharm && (
        <div
          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
        >
          {firstCharm}
        </div>
      )}
    </div>
  );
}

// ── Tab labels ────────────────────────────────────────────────────────────────
const TAB_LABELS: Record<string, string> = {
  clickers:   "Top Clickers",
  collectors: "Top Coleccionistas",
  traders:    "Top Traders",
};

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────
interface LeaderboardPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { tab = "clickers" } = await searchParams;
  const activeTab = ["clickers", "collectors", "traders"].includes(tab) ? tab : "clickers";

  const supabase = await createClient();

  let entries: LeaderEntry[] = [];
  let metricKey   = "total_clicks";
  let metricLabel = "Clicks";
  let metricFormat: (v: number) => string = (v) => v.toLocaleString("es-AR");

  if (activeTab === "clickers") {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, level, total_clicks")
      .order("total_clicks", { ascending: false })
      .limit(10);
    entries = (data ?? []).map((p) => ({ ...p, user_id: p.id }));
    metricKey   = "total_clicks";
    metricLabel = "Clicks";
  } else if (activeTab === "collectors") {
    const { data } = await supabase.rpc("get_top_collectors", { lim: 10 });
    entries     = data ?? [];
    metricKey   = "total_value";
    metricLabel = "Valor inventario";
    metricFormat = (v) => `${v.toLocaleString("es-AR")} cr.`;
  } else {
    const { data } = await supabase.rpc("get_top_traders", { lim: 10 });
    entries     = data ?? [];
    metricKey   = "trade_count";
    metricLabel = "Trades";
    metricFormat = (v) => String(v);
  }

  // Fetch cosmetics for all users in one query
  const userIds = entries.map((e) => e.user_id);
  let cosmeticsByUser: Record<string, UserCosmetics> = {};

  if (userIds.length > 0) {
    const { data: cosmetics } = await supabase
      .from("profile_cosmetics")
      .select("user_id, shop_item:shop_items(key, type, icon, name)")
      .in("user_id", userIds)
      .eq("equipped", true);

    const rows = (cosmetics ?? []) as unknown as CosmeticRow[];

    for (const uid of userIds) {
      const userRows = rows.filter((r) => r.user_id === uid);
      const frameRow = userRows.find((r) => r.shop_item?.type === "frame");
      const charmRows = userRows.filter((r) => r.shop_item?.type === "charm");
      cosmeticsByUser[uid] = {
        frame:  frameRow?.shop_item?.key ?? null,
        charms: charmRows.map((r) => r.shop_item?.icon ?? "").filter(Boolean),
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" style={{ background: "#000000" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Leaderboard
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Los mejores jugadores de ChupeteClicker.</p>
      </div>

      {/* Tabs */}
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
          const rank  = idx + 1;
          const med   = medal(rank);
          const value = entry[metricKey] as number ?? 0;
          const cosmetics = cosmeticsByUser[entry.user_id] ?? { frame: null, charms: [] };

          const rankBorderColor =
            rank === 1 ? "rgba(255,215,0,0.25)"
            : rank === 2 ? "rgba(192,192,192,0.2)"
            : rank === 3 ? "rgba(205,127,50,0.2)"
            : "rgba(255,255,255,0.04)";

          return (
            <Link
              key={entry.user_id}
              href={`/perfil/${entry.username}`}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all"
              style={{
                background: rank <= 3 ? "rgba(255,255,255,0.03)" : "#060606",
                border: `1px solid ${rankBorderColor}`,
                textDecoration: "none",
              }}
            >
              {/* Rank */}
              <div
                className="w-8 text-center flex-shrink-0"
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                {med
                  ? <span className="text-lg">{med}</span>
                  : <span className="text-xs" style={{ color: "#2a2a2a" }}>#{rank}</span>}
              </div>

              {/* Avatar with frame + charm + level badge */}
              <LeaderAvatar
                username={entry.username}
                avatar_url={entry.avatar_url}
                level={entry.level}
                cosmetics={cosmetics}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {entry.username}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px]" style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    Nv.{entry.level}
                  </span>
                  {/* Extra charms */}
                  {cosmetics.charms.slice(0, 3).map((icon, i) => (
                    <span key={i} className="text-[11px]" title="charm">{icon}</span>
                  ))}
                </div>
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
