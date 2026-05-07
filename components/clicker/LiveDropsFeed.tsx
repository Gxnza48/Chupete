"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { RARITIES } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

interface LiveDropRaw {
  id: string;
  float_value: number;
  rarity: string;
  dropped_at: string;
  profile: { id: string; username: string }[];
  item: { name: string }[];
}

interface LiveDrop {
  id: string;
  float_value: number;
  rarity: string;
  dropped_at: string;
  profile: { id: string; username: string } | null;
  item: { name: string } | null;
}

function normalizeDrop(raw: LiveDropRaw): LiveDrop {
  return {
    ...raw,
    profile: raw.profile?.[0] ?? null,
    item: raw.item?.[0] ?? null,
  };
}

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

export default function LiveDropsFeed() {
  const [drops, setDrops] = useState<LiveDrop[]>([]);
  const supabase = createClient();

  const fetchDrops = useCallback(async () => {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("drops")
      .select(
        "id, float_value, rarity, dropped_at, profile:profiles!drops_user_id_fkey(id, username), item:items!drops_item_id_fkey(name)"
      )
      .gte("dropped_at", since)
      .order("dropped_at", { ascending: false })
      .limit(20);

    if (data) {
      setDrops((data as unknown as LiveDropRaw[]).map(normalizeDrop));
    }
  }, [supabase]);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  // Remove stale entries every 30 seconds
  useEffect(() => {
    const t = setInterval(() => {
      const cutoff = Date.now() - 10 * 60 * 1000;
      setDrops((prev) =>
        prev.filter((d) => new Date(d.dropped_at).getTime() > cutoff)
      );
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  // Realtime
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    channel = supabase
      .channel("live-drops-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "drops" },
        () => fetchDrops()
      )
      .subscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchDrops]);

  if (drops.length === 0) return null;

  return (
    <div className="w-full max-w-sm mt-8">
      <p
        className="text-[10px] uppercase tracking-widest mb-3 text-center"
        style={{
          color: "#2a2a2a",
          fontFamily: "var(--font-syne), Syne, sans-serif",
        }}
      >
        Drops globales · últimos 10 min
      </p>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#060606",
          border: "1px solid rgba(255,255,255,0.05)",
          maxHeight: 260,
          overflowY: "auto",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {drops.map((drop) => {
            const rarity = drop.rarity as RarityKey;
            const config = RARITIES[rarity];
            const dot = config.gradient
              ? config.gradient[0]
              : (config.color ?? "#3a3a3a");

            return (
              <motion.div
                key={drop.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: dot,
                    boxShadow: `0 0 5px ${dot}`,
                  }}
                />
                <p className="flex-1 text-xs truncate" style={{ color: "#efefef" }}>
                  {drop.profile ? (
                    <Link
                      href={`/perfil/${drop.profile.username}`}
                      className="font-semibold hover:underline"
                      style={{ color: "#efefef" }}
                    >
                      {drop.profile.username}
                    </Link>
                  ) : (
                    <span style={{ color: "#404040" }}>alguien</span>
                  )}{" "}
                  <span style={{ color: "#2a2a2a" }}>consiguió</span>{" "}
                  <RarityText rarity={rarity} className="font-medium">
                    {drop.item?.name ?? "un item"}
                  </RarityText>
                </p>
                <span
                  className="text-[10px] flex-shrink-0 tabular-nums"
                  style={{
                    color: "#2a2a2a",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  {timeAgo(drop.dropped_at)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
