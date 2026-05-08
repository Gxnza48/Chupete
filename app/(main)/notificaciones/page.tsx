"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatNum } from "@/lib/format";
import { RARITIES } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";

type NotifEntry = {
  id: string;
  type: "sold" | "bought" | "case" | "credit";
  title: string;
  subtitle: string;
  amount: number;
  amountSign: "+" | "-";
  date: string;
  rarity?: RarityKey;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function rarityColor(rarity?: RarityKey): string {
  if (!rarity) return "#404040";
  const cfg = RARITIES[rarity];
  return cfg.gradient ? cfg.gradient[0] : (cfg.color ?? "#404040");
}

export default function NotificacionesPage() {
  const [entries, setEntries] = useState<NotifEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sold" | "bought" | "case">("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/user-trades");
      if (!res.ok) { setLoading(false); return; }
      const { sold, bought, credits } = await res.json() as {
        sold: { id: string; price_credits: number; date: string; item: { name: string; rarity: string } }[];
        bought: { id: string; price_credits: number; date: string; item: { name: string; rarity: string } }[];
        credits: { id: string; amount: number; reason: string; created_at: string }[];
      };

      const all: NotifEntry[] = [];

      for (const s of sold) {
        const net = Math.floor((s.price_credits ?? 0) * 0.95);
        all.push({
          id: `sold-${s.id}`,
          type: "sold",
          title: `Vendiste ${s.item?.name ?? "un item"}`,
          subtitle: `+${formatNum(net)} cr. (después de comisión 5%)`,
          amount: net,
          amountSign: "+",
          date: s.date,
          rarity: s.item?.rarity as RarityKey | undefined,
        });
      }

      for (const b of bought) {
        all.push({
          id: `bought-${b.id}`,
          type: "bought",
          title: `Compraste ${b.item?.name ?? "un item"}`,
          subtitle: `-${formatNum(b.price_credits ?? 0)} cr.`,
          amount: b.price_credits ?? 0,
          amountSign: "-",
          date: b.date,
          rarity: b.item?.rarity as RarityKey | undefined,
        });
      }

      for (const c of credits) {
        const isCase = c.reason?.includes("case");
        all.push({
          id: `cr-${c.id}`,
          type: isCase ? "case" : "credit",
          title: c.reason === "open_case" ? "Abriste una caja"
            : c.reason === "daily_case" ? "Caja diaria"
            : c.reason === "shop_purchase" ? "Compra en tienda"
            : "Movimiento de créditos",
          subtitle: `${c.amount > 0 ? "+" : ""}${formatNum(c.amount)} cr.`,
          amount: Math.abs(c.amount),
          amountSign: c.amount >= 0 ? "+" : "-",
          date: c.created_at,
        });
      }

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(all);
      setLoading(false);
      localStorage.setItem("notif_last_seen", new Date().toISOString());
    }
    load();
  }, []);

  const filtered = filter === "all" ? entries : entries.filter((e) =>
    filter === "case" ? (e.type === "case" || e.type === "credit") : e.type === filter
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Notificaciones
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Historial de tus compras, ventas y cajas</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "sold", "bought", "case"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f ? "#efefef" : "rgba(255,255,255,0.04)",
              color: filter === f ? "#000" : "#404040",
              border: `1px solid ${filter === f ? "transparent" : "rgba(255,255,255,0.07)"}`,
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}>
            {f === "all" ? "Todo" : f === "sold" ? "Ventas" : f === "bought" ? "Compras" : "Cajas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#efefef" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <p className="text-sm" style={{ color: "#404040" }}>Sin actividad todavía</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry, i) => {
            const color = rarityColor(entry.rarity);
            return (
              <motion.div key={entry.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                style={{ background: "#060606", border: `1px solid ${entry.rarity ? color + "20" : "rgba(255,255,255,0.05)"}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: entry.rarity ? color + "15" : "rgba(255,255,255,0.05)", color: entry.amountSign === "+" ? "#4a9a4a" : "#ff6b6b" }}>
                  {entry.type === "sold" ? "↑" : entry.type === "bought" ? "↓" : entry.type === "case" ? "⊡" : "◎"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    {entry.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#404040" }}>{entry.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: entry.amountSign === "+" ? "#4a9a4a" : "#ff6b6b", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {entry.amountSign}{formatNum(entry.amount)} cr.
                  </p>
                  <p className="text-[10px]" style={{ color: "#2a2a2a" }}>{timeAgo(entry.date)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
