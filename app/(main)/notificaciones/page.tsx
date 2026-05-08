"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
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
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [
        { data: sold },
        { data: bought },
        { data: credits },
      ] = await Promise.all([
        // Items I sold
        supabase
          .from("transactions")
          .select("id, price_ars, completed_at, listing:listings(inventory:inventory(item:items(name,rarity)))")
          .eq("seller_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50),
        // Items I bought
        supabase
          .from("transactions")
          .select("id, price_ars, completed_at, listing:listings(inventory:inventory(item:items(name,rarity)))")
          .eq("buyer_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50),
        // Credit transactions (cases, etc.)
        supabase
          .from("credit_transactions")
          .select("id, amount, reason, created_at")
          .eq("user_id", user.id)
          .not("reason", "in", '("purchase","sale")')
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const all: NotifEntry[] = [];

      for (const s of sold ?? []) {
        const tx = s as unknown as { id: string; price_ars: number; completed_at: string; listing: { inventory: { item: { name: string; rarity: string } } } | null };
        const item = tx.listing?.inventory?.item;
        const fee = Math.ceil((tx.price_ars ?? 0) * 0.05);
        all.push({
          id: `sold-${tx.id}`,
          type: "sold",
          title: `Vendiste ${item?.name ?? "un item"}`,
          subtitle: `Ingresaron ${formatNum((tx.price_ars ?? 0) - fee)} cr. (después de comisión)`,
          amount: (tx.price_ars ?? 0) - fee,
          amountSign: "+",
          date: tx.completed_at,
          rarity: item?.rarity as RarityKey | undefined,
        });
      }

      for (const b of bought ?? []) {
        const tx = b as unknown as { id: string; price_ars: number; completed_at: string; listing: { inventory: { item: { name: string; rarity: string } } } | null };
        const item = tx.listing?.inventory?.item;
        all.push({
          id: `bought-${tx.id}`,
          type: "bought",
          title: `Compraste ${item?.name ?? "un item"}`,
          subtitle: `Gastaste ${formatNum(tx.price_ars ?? 0)} cr.`,
          amount: tx.price_ars ?? 0,
          amountSign: "-",
          date: tx.completed_at,
          rarity: item?.rarity as RarityKey | undefined,
        });
      }

      for (const c of credits ?? []) {
        const cr = c as { id: string; amount: number; reason: string; created_at: string };
        const isCase = cr.reason?.includes("case") || cr.amount < 0;
        all.push({
          id: `cr-${cr.id}`,
          type: isCase ? "case" : "credit",
          title: cr.reason === "open_case" ? "Abriste una caja"
            : cr.reason === "daily_case" ? "Caja diaria"
            : cr.reason === "shop_purchase" ? "Compra en tienda"
            : "Movimiento de créditos",
          subtitle: `${cr.amount > 0 ? "+" : ""}${formatNum(cr.amount)} cr.`,
          amount: Math.abs(cr.amount),
          amountSign: cr.amount >= 0 ? "+" : "-",
          date: cr.created_at,
        });
      }

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(all);
      setLoading(false);

      // Mark as seen
      localStorage.setItem("notif_last_seen", new Date().toISOString());
    }
    load();
  }, []);

  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter || (filter === "case" && e.type === "credit"));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Notificaciones
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Historial de tus compras, ventas y cajas</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "sold", "bought", "case"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f ? "#efefef" : "rgba(255,255,255,0.04)",
              color: filter === f ? "#000" : "#404040",
              border: `1px solid ${filter === f ? "transparent" : "rgba(255,255,255,0.07)"}`,
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
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
          <p className="text-4xl" style={{ filter: "grayscale(1) opacity(0.3)" }}>🔔</p>
          <p className="text-sm" style={{ color: "#404040" }}>Sin actividad todavía</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((entry, i) => {
            const color = rarityColor(entry.rarity);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                style={{
                  background: "#060606",
                  border: `1px solid ${entry.rarity ? color + "20" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: entry.rarity ? color + "15" : "rgba(255,255,255,0.05)",
                    color: entry.rarity ? color : (entry.amountSign === "+" ? "#4a9a4a" : "#ff6b6b"),
                  }}
                >
                  {entry.type === "sold" ? "↑" : entry.type === "bought" ? "↓" : entry.type === "case" ? "⊡" : "◎"}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    {entry.title}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#404040" }}>
                    {entry.subtitle}
                  </p>
                </div>

                {/* Amount + time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{
                    color: entry.amountSign === "+" ? "#4a9a4a" : "#ff6b6b",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}>
                    {entry.amountSign}{formatNum(entry.amount)} cr.
                  </p>
                  <p className="text-[10px]" style={{ color: "#2a2a2a" }}>
                    {timeAgo(entry.date)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
