"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatNum } from "@/lib/format";
import { RARITIES } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

type Trade = {
  id: string;
  price_credits: number;
  sold_at: string;
  item: { name: string; rarity: string; image_url: string };
  seller: { username: string };
  buyer: { username: string };
  float_value: number;
};

type DayVolume = { day: string; volume: number; count: number };

function MiniBarChart({ data }: { data: DayVolume[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.volume), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: `${Math.max(4, (d.volume / max) * 56)}px`,
              background: `linear-gradient(180deg, #efefef30 0%, #efefef15 100%)`,
              cursor: "default",
            }}
          />
          <span className="text-[8px] absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
            style={{ color: "#2a2a2a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}

function timeAgo(str: string) {
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [chart, setChart] = useState<DayVolume[]>([]);
  const [stats, setStats] = useState({ total: 0, volume: 0, avg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("listings")
        .select(`
          id, price_credits, sold_at,
          inventory:inventory(float_value, item:items(name,rarity,image_url)),
          seller:profiles!listings_seller_id_fkey(username),
          buyer_profile:transactions!inner(buyer:profiles!transactions_buyer_id_fkey(username))
        `)
        .eq("status", "sold")
        .order("sold_at", { ascending: false })
        .limit(100);

      if (!data) { setLoading(false); return; }

      const parsed: Trade[] = data.map((row: unknown) => {
        const r = row as {
          id: string; price_credits: number; sold_at: string;
          inventory: { float_value: number; item: { name: string; rarity: string; image_url: string } } | null;
          seller: { username: string } | null;
          buyer_profile: { buyer: { username: string } }[];
        };
        return {
          id: r.id,
          price_credits: r.price_credits ?? 0,
          sold_at: r.sold_at ?? "",
          item: r.inventory?.item ?? { name: "Item", rarity: "comun", image_url: "" },
          seller: r.seller ?? { username: "?" },
          buyer: r.buyer_profile?.[0]?.buyer ?? { username: "?" },
          float_value: r.inventory?.float_value ?? 0,
        };
      });

      setTrades(parsed);

      // Build 14-day chart
      const days: Record<string, DayVolume> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
        days[key] = { day: key, volume: 0, count: 0 };
      }
      for (const t of parsed) {
        if (!t.sold_at) continue;
        const key = new Date(t.sold_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
        if (days[key]) { days[key].volume += t.price_credits; days[key].count++; }
      }
      setChart(Object.values(days));

      const totalVol = parsed.reduce((s, t) => s + t.price_credits, 0);
      setStats({ total: parsed.length, volume: totalVol, avg: parsed.length ? Math.floor(totalVol / parsed.length) : 0 });
      setLoading(false);
    }

    load();

    // Realtime for new sales
    const ch = supabase
      .channel("trades-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "listings" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Trades
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Todas las transacciones del mercado en tiempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total trades", value: formatNum(stats.total) },
          { label: "Volumen total", value: `${formatNum(stats.volume)} cr.` },
          { label: "Precio promedio", value: `${formatNum(stats.avg)} cr.` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-lg font-bold mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "#404040" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl px-5 pt-5 pb-8 mb-6" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-xs uppercase tracking-widest mb-4 font-semibold" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Volumen últimos 14 días
        </p>
        <MiniBarChart data={chart} />
      </div>

      {/* Trade feed */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#efefef" }} />
        </div>
      ) : trades.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: "#404040" }}>Sin trades todavía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {trades.map((t, i) => {
            const rarity = t.item.rarity as RarityKey;
            const cfg = RARITIES[rarity];
            const color = cfg.gradient ? cfg.gradient[0] : (cfg.color ?? "#404040");
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: "#060606", border: `1px solid ${color}18` }}
              >
                {/* Item image */}
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: color + "10" }}>
                  {t.item.image_url ? (
                    <Image src={t.item.image_url} alt={t.item.name} width={40} height={40} className="object-contain"
                      style={{ mixBlendMode: "screen", maskImage: "radial-gradient(circle, black 50%, transparent 78%)", WebkitMaskImage: "radial-gradient(circle, black 50%, transparent 78%)" }} />
                  ) : <span className="text-lg">🎁</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold truncate" style={{ color: "#efefef" }}>{t.item.name}</p>
                    <RarityText rarity={rarity} className="text-[9px] flex-shrink-0" />
                  </div>
                  <p className="text-[10px]" style={{ color: "#404040" }}>
                    <span style={{ color: "#606060" }}>{t.seller.username}</span>
                    {" → "}
                    <span style={{ color: "#606060" }}>{t.buyer.username}</span>
                  </p>
                </div>

                {/* Price + time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {formatNum(t.price_credits)} cr.
                  </p>
                  <p className="text-[10px]" style={{ color: "#2a2a2a" }}>{timeAgo(t.sold_at)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
