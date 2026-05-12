"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { RARITIES, type RarityKey } from "@/lib/rarities";
import { RARITY_RANK, getUpgradeOdds, getUpgradeOddsPct, getRarityColor } from "@/lib/upgrade";
import RarityText from "@/components/ui/RarityText";
import type { InventoryItem } from "@/types/database";
import { getConditionLabel } from "@/lib/rarities";

const RARITY_KEYS = Object.keys(RARITIES) as RarityKey[];
const CELL_W = 80;
const VISIBLE_CELLS = 7;
const WINNER_IDX = 46;
const TOTAL_CELLS = 56;

function buildStrip(winner: RarityKey, from: RarityKey): RarityKey[] {
  const losers = RARITY_KEYS.filter((r) => RARITY_RANK[r] < RARITY_RANK[winner] || r === from);
  const result: RarityKey[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (i === WINNER_IDX) result.push(winner);
    else result.push(losers[Math.floor(Math.random() * losers.length)]);
  }
  return result;
}

type UpgradeResult = {
  success: boolean;
  target_rarity: RarityKey;
  item?: { name: string; rarity: string; image_url: string; float_value: number };
};

export default function UpgradePage() {
  const { items, isLoading, refetch } = useInventory();
  const { refetch: refetchProfile } = useProfile();
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [targetRarity, setTargetRarity] = useState<RarityKey | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [strip, setStrip] = useState<RarityKey[]>([]);
  const [stripX, setStripX] = useState(0);
  const [result, setResult] = useState<UpgradeResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [search, setSearch] = useState("");

  const fromRarity = selected?.item?.rarity as RarityKey | undefined;
  const validTargets = fromRarity
    ? RARITY_KEYS.filter((r) => RARITY_RANK[r] > RARITY_RANK[fromRarity])
    : [];
  const odds = fromRarity && targetRarity ? getUpgradeOdds(fromRarity, targetRarity) : 0;

  const filtered = items.filter((i) =>
    !i.is_listed && (!search || i.item?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSpin = useCallback(async () => {
    if (!selected || !targetRarity || !fromRarity) return;
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    const res = await fetch("/api/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_id: selected.id, target_rarity: targetRarity }),
    });
    const data = await res.json() as UpgradeResult;

    // Build strip where winner = targetRarity if success, else a loser rarity
    const winnerInStrip = data.success ? targetRarity : fromRarity;
    const newStrip = buildStrip(winnerInStrip, fromRarity);
    setStrip(newStrip);

    const containerCenter = (VISIBLE_CELLS * CELL_W) / 2;
    const target = -(WINNER_IDX * CELL_W - containerCenter + CELL_W / 2);
    setStripX(0);

    // Small delay to let strip render before animating
    await new Promise((r) => setTimeout(r, 80));
    setStripX(target);
    setResult(data);

    // Show result after animation
    setTimeout(() => {
      setShowResult(true);
      setSpinning(false);
      setSelected(null);
      setTargetRarity(null);
      refetch();
      refetchProfile();
    }, 5000);
  }, [selected, targetRarity, fromRarity, refetch, refetchProfile]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#000000" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Upgrade
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>
          Apostá tu chupete contra cualquier rareza. Ganás o perdés todo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory selector */}
        <div className="rounded-2xl p-4" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            Seleccioná tu apuesta
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item..."
            className="w-full px-3 py-2 rounded-xl text-xs mb-3 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}
          />
          <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
            {isLoading && <p className="text-xs w-full text-center py-4" style={{ color: "#2a2a2a" }}>Cargando...</p>}
            {!isLoading && filtered.length === 0 && <p className="text-xs w-full text-center py-4" style={{ color: "#2a2a2a" }}>Sin items disponibles.</p>}
            {filtered.map((inv) => {
              const rarity = inv.item?.rarity as RarityKey;
              const cfg = RARITIES[rarity];
              const glow = cfg?.gradient ? cfg.gradient[0] : (cfg?.color ?? "#3a3a3a");
              const isActive = selected?.id === inv.id;
              return (
                <button
                  key={inv.id}
                  onClick={() => { setSelected(isActive ? null : inv); setTargetRarity(null); }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
                  style={{
                    width: 72, flexShrink: 0,
                    background: isActive ? `${glow}18` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? glow + "50" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: isActive ? `0 0 12px ${glow}20` : "none",
                  }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {inv.item?.image_url
                      ? <Image src={inv.item.image_url} alt={inv.item.name} width={40} height={40} className="object-contain" style={{ mixBlendMode: "screen" }} />
                      : <span className="text-xl">🎁</span>}
                  </div>
                  <p className="text-[9px] leading-tight truncate w-full" style={{ color: "#a0a0a0", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    {inv.item?.name}
                  </p>
                  <RarityText rarity={rarity} className="text-[8px]" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Config + roulette */}
        <div className="flex flex-col gap-4">
          {/* Selected item */}
          {selected && (
            <div className="rounded-2xl p-4" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Tu apuesta</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {selected.item?.image_url
                    ? <Image src={selected.item.image_url} alt={selected.item.name ?? ""} width={48} height={48} className="object-contain" style={{ mixBlendMode: "screen" }} />
                    : <span className="text-2xl">🎁</span>}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{selected.item?.name}</p>
                  <RarityText rarity={selected.item?.rarity as RarityKey} className="text-xs" />
                  <p className="text-[10px] mt-0.5" style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {getConditionLabel(selected.float_value)}
                  </p>
                </div>
              </div>

              {/* Target rarity */}
              <p className="text-xs uppercase tracking-widest mt-4 mb-2" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Objetivo</p>
              <div className="flex flex-wrap gap-2">
                {validTargets.map((r) => {
                  const cfg = RARITIES[r];
                  const color = cfg.gradient ? cfg.gradient[0] : (cfg.color ?? "#3a3a3a");
                  const isActive = targetRarity === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setTargetRarity(isActive ? null : r)}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: isActive ? `${color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isActive ? color + "60" : "rgba(255,255,255,0.08)"}`,
                        color: isActive ? color : "#404040",
                        fontFamily: "var(--font-syne), Syne, sans-serif",
                      }}
                    >
                      {RARITIES[r].label}
                    </button>
                  );
                })}
              </div>

              {/* Odds */}
              {targetRarity && (
                <div className="mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs" style={{ color: "#3a3a3a" }}>
                    Probabilidad de éxito:{" "}
                    <span className="font-bold" style={{ color: odds >= 0.1 ? "#4a9a4a" : odds >= 0.01 ? "#ffaa00" : "#ff6b6b" }}>
                      {getUpgradeOddsPct(fromRarity!, targetRarity)}
                    </span>
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#2a2a2a" }}>Si perdés, tu item desaparece.</p>
                </div>
              )}
            </div>
          )}

          {/* Spin button */}
          {selected && targetRarity && !spinning && !showResult && (
            <button
              onClick={handleSpin}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: "#efefef",
                color: "#000000",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
            >
              Tirar
            </button>
          )}

          {/* Roulette */}
          {spinning && strip.length > 0 && (
            <div className="rounded-2xl overflow-hidden relative" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Center pointer */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px z-10 w-0.5" style={{ background: "rgba(255,255,255,0.5)" }} />
              <div style={{ width: VISIBLE_CELLS * CELL_W, overflow: "hidden", margin: "0 auto", height: 90 }}>
                <motion.div
                  className="flex"
                  initial={{ x: 0 }}
                  animate={{ x: stripX }}
                  transition={{ duration: 4.5, ease: [0.18, 0.89, 0.35, 1.0] }}
                >
                  {strip.map((rarity, i) => {
                    const color = getRarityColor(rarity);
                    return (
                      <div
                        key={i}
                        className="flex-shrink-0 flex flex-col items-center justify-center"
                        style={{
                          width: CELL_W,
                          height: 90,
                          background: i === WINNER_IDX ? `${color}30` : `${color}10`,
                          borderRight: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div className="w-3 h-3 rounded-full mb-1" style={{ background: color }} />
                        <p className="text-[9px] text-center px-1" style={{ color: "#606060", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                          {RARITIES[rarity].label}
                        </p>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: result.success ? "rgba(74,154,74,0.08)" : "rgba(255,50,50,0.08)",
                  border: `1px solid ${result.success ? "rgba(74,154,74,0.3)" : "rgba(255,50,50,0.2)"}`,
                }}
              >
                <p className="text-2xl mb-2">{result.success ? "💥" : "💨"}</p>
                <p className="text-base font-bold mb-1" style={{ color: result.success ? "#4a9a4a" : "#ff6b6b", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {result.success ? "¡Éxito!" : "Mala suerte"}
                </p>
                {result.success && result.item && (
                  <div className="mt-2">
                    <p className="text-sm" style={{ color: "#efefef" }}>{result.item.name}</p>
                    <RarityText rarity={result.item.rarity as RarityKey} className="text-xs mt-0.5 block" />
                  </div>
                )}
                {!result.success && (
                  <p className="text-xs mt-1" style={{ color: "#3a3a3a" }}>Tu item fue destruido.</p>
                )}
                <button
                  onClick={() => { setShowResult(false); setResult(null); setStrip([]); }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#efefef", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                >
                  Volver a jugar
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!selected && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="text-4xl mb-3">🎰</p>
              <p className="text-sm" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                Seleccioná un item de tu inventario para apostar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
