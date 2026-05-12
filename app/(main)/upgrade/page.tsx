"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { RARITIES, type RarityKey, getConditionLabel } from "@/lib/rarities";
import { RARITY_RANK, getUpgradeOdds, getUpgradeOddsPct, getRarityColor, getWheelTarget } from "@/lib/upgrade";
import { playUpgradeSpin, playUpgradeWin, playUpgradeLose } from "@/lib/sounds";
import RarityText from "@/components/ui/RarityText";
import type { InventoryItem } from "@/types/database";

// ── Wheel geometry ────────────────────────────────────────────────────────────
const CX = 150;
const CY = 150;
const R  = 108;
const SW = 28;                          // stroke width
const C  = 2 * Math.PI * R;            // circumference ≈ 679

const MIN_VISUAL_DEG = 4;              // minimum visible arc so it's never invisible

// ── Wheel component ───────────────────────────────────────────────────────────
function UpgradeWheel({
  odds,
  targetRotation,
  spinning,
  winColor,
}: {
  odds: number;
  targetRotation: number;
  spinning: boolean;
  winColor: string;
}) {
  const visualOdds = Math.max(odds, MIN_VISUAL_DEG / 360);
  const winDash = visualOdds * C;

  return (
    <div className="relative select-none" style={{ width: 300, height: 300 }}>
      {/* Pointer at top-center */}
      <div
        className="absolute z-20"
        style={{
          top: 4,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: `14px solid rgba(255,255,255,0.9)`,
          filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))",
        }}
      />

      {/* Rotating ring */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: targetRotation }}
        initial={{ rotate: 0 }}
        transition={{
          duration: spinning ? 5 : 0,
          ease: spinning ? [0.15, 0.85, 0.25, 1.0] : "linear",
        }}
        style={{ transformOrigin: "center" }}
      >
        <svg width={300} height={300} viewBox="0 0 300 300">
          {/* Outer glow ring */}
          <circle cx={CX} cy={CY} r={R + SW / 2 + 4} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={2} />
          {/* Background ring */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#111111" strokeWidth={SW} />
          {/* Lose zone (slightly lighter than bg) */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1c1c1c" strokeWidth={SW} />
          {/* Win zone arc — starts at 12 o'clock via rotate(-90) */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={winColor}
            strokeWidth={SW}
            strokeDasharray={`${winDash} ${C}`}
            strokeLinecap="butt"
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{ filter: `drop-shadow(0 0 8px ${winColor}80)` }}
          />
          {/* Inner glow ring */}
          <circle cx={CX} cy={CY} r={R - SW / 2 - 4} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
        </svg>
      </motion.div>

    </div>
  );
}

// ── Item mini card ────────────────────────────────────────────────────────────
function ItemMini({ inv, selected, onClick }: { inv: InventoryItem; selected: boolean; onClick: () => void }) {
  const rarity = inv.item?.rarity as RarityKey;
  const cfg = RARITIES[rarity];
  const color = cfg?.gradient ? cfg.gradient[0] : (cfg?.color ?? "#3a3a3a");
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-shrink-0"
      style={{
        width: 72,
        background: selected ? `${color}18` : "rgba(255,255,255,0.03)",
        border: `1px solid ${selected ? color + "60" : "rgba(255,255,255,0.06)"}`,
        boxShadow: selected ? `0 0 12px ${color}25` : "none",
      }}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        {inv.item?.image_url
          ? <Image src={inv.item.image_url} alt={inv.item.name} width={40} height={40} className="object-contain" style={{ mixBlendMode: "screen" }} />
          : <span className="text-xl">🎁</span>}
      </div>
      <p className="text-[9px] truncate w-full text-center leading-tight" style={{ color: "#909090", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{inv.item?.name}</p>
      <RarityText rarity={rarity} className="text-[8px]" />
    </button>
  );
}

// ── Result overlay ────────────────────────────────────────────────────────────
type UpgradeResult = {
  success: boolean;
  target_rarity: RarityKey;
  item?: { name: string; rarity: string; image_url: string; float_value: number };
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UpgradePage() {
  const { items, isLoading, refetch } = useInventory();
  const { refetch: refetchProfile } = useProfile();

  const [selected, setSelected]       = useState<InventoryItem | null>(null);
  const [targetRarity, setTarget]     = useState<RarityKey | null>(null);
  const [spinning, setSpinning]       = useState(false);
  const [wheelAngle, setWheelAngle]   = useState(0);
  const [result, setResult]           = useState<UpgradeResult | null>(null);
  const [showResult, setShowResult]   = useState(false);
  const [search, setSearch]           = useState("");

  const fromRarity  = selected?.item?.rarity as RarityKey | undefined;
  const validTargets = fromRarity ? Object.keys(RARITIES).filter(r => RARITY_RANK[r as RarityKey] > RARITY_RANK[fromRarity]) as RarityKey[] : [];
  const odds        = fromRarity && targetRarity ? getUpgradeOdds(fromRarity, targetRarity) : 0;
  const winColor    = targetRarity ? getRarityColor(targetRarity) : "#3a3a3a";

  const available = items.filter(i => !i.is_listed);
  const filtered  = available.filter(i => !search || i.item?.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSpin = useCallback(async () => {
    if (!selected || !targetRarity || !fromRarity || spinning) return;
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    const res  = await fetch("/api/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_id: selected.id, target_rarity: targetRarity }),
    });
    const data = await res.json() as UpgradeResult;

    playUpgradeSpin();
    const target = getWheelTarget(wheelAngle, odds, data.success);
    setWheelAngle(target);
    setResult(data);

    setTimeout(() => {
      if (data.success) playUpgradeWin(); else playUpgradeLose();
      setShowResult(true);
      setSpinning(false);
      setSelected(null);
      setTarget(null);
      refetch();
      refetchProfile();
    }, 5500);
  }, [selected, targetRarity, fromRarity, odds, spinning, refetch, refetchProfile]);

  const reset = () => { setShowResult(false); setResult(null); };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ background: "#000000" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Upgrade</h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>Apostá tu chupete contra cualquier rareza. Todo o nada.</p>
      </div>

      {/* Main 3-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-6 mb-8">

        {/* LEFT — Bet item display */}
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Tu apuesta</p>
          {selected && selected.item ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 flex flex-col items-center gap-3 w-full max-w-[180px]"
              style={{
                background: `${getRarityColor(selected.item.rarity as RarityKey)}10`,
                border: `1px solid ${getRarityColor(selected.item.rarity as RarityKey)}30`,
              }}
            >
              <div className="w-20 h-20 flex items-center justify-center rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                {selected.item.image_url
                  ? <Image src={selected.item.image_url} alt={selected.item.name} width={80} height={80} className="object-contain" style={{ mixBlendMode: "screen" }} />
                  : <span className="text-4xl">🎁</span>}
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{selected.item.name}</p>
                <RarityText rarity={selected.item.rarity as RarityKey} className="text-[10px]" />
                <p className="text-[9px] mt-0.5" style={{ color: "#3a3a3a" }}>{getConditionLabel(selected.float_value)}</p>
              </div>
              <button onClick={() => { setSelected(null); setTarget(null); }} className="text-[9px] px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#404040", border: "1px solid rgba(255,255,255,0.08)" }}>
                cambiar
              </button>
            </motion.div>
          ) : (
            <div className="rounded-2xl p-8 w-full max-w-[180px] flex flex-col items-center gap-2" style={{ background: "#060606", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <span className="text-4xl opacity-30">🎁</span>
              <p className="text-xs text-center" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Seleccioná un item abajo</p>
            </div>
          )}
        </div>

        {/* CENTER — Wheel */}
        <div className="flex flex-col items-center gap-5">
          {/* Wheel */}
          <div className="relative">
            <UpgradeWheel
              odds={odds}
              targetRotation={wheelAngle}
              spinning={spinning}
              winColor={winColor}
            />
            {/* Custom odds text inside wheel (replaces the helper) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-0.5">
                <p
                  className="text-3xl font-bold"
                  style={{
                    color: odds > 0 ? winColor : "#2a2a2a",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    textShadow: odds > 0 ? `0 0 20px ${winColor}60` : "none",
                    lineHeight: 1,
                  }}
                >
                  {odds > 0 ? getUpgradeOddsPct(fromRarity!, targetRarity!) : "—"}
                </p>
                <p className="text-[9px] uppercase tracking-widest" style={{ color: "#2a2a2a" }}>probabilidad</p>
              </div>
            </div>
          </div>

          {/* Spin button */}
          {!spinning && !showResult && (
            <button
              onClick={handleSpin}
              disabled={!selected || !targetRarity}
              className="px-10 py-3 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: selected && targetRarity ? winColor : "rgba(255,255,255,0.06)",
                color: selected && targetRarity ? "#000" : "#2a2a2a",
                fontFamily: "var(--font-syne), Syne, sans-serif",
                boxShadow: selected && targetRarity ? `0 0 24px ${winColor}40` : "none",
                cursor: !selected || !targetRarity ? "not-allowed" : "pointer",
              }}
            >
              {!selected ? "Seleccioná un item" : !targetRarity ? "Elegí una rareza" : "TIRAR"}
            </button>
          )}
          {spinning && (
            <p className="text-xs animate-pulse" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Girando...</p>
          )}

          {/* Result */}
          <AnimatePresence>
            {showResult && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-5 text-center w-full"
                style={{
                  background: result.success ? "rgba(74,154,74,0.08)" : "rgba(255,50,50,0.06)",
                  border: `1px solid ${result.success ? "rgba(74,154,74,0.3)" : "rgba(255,50,50,0.15)"}`,
                }}
              >
                <p className="text-2xl mb-1">{result.success ? "💥" : "💨"}</p>
                <p className="text-sm font-bold" style={{ color: result.success ? "#4a9a4a" : "#ff6b6b", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {result.success ? "¡Éxito!" : "Sin suerte"}
                </p>
                {result.success && result.item && (
                  <div className="mt-2">
                    <p className="text-xs" style={{ color: "#efefef" }}>{result.item.name}</p>
                    <RarityText rarity={result.item.rarity as RarityKey} className="text-[10px] mt-0.5 block" />
                  </div>
                )}
                <button onClick={reset} className="mt-3 px-4 py-1.5 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "#efefef", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  Volver a jugar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Target rarity */}
        <div className="flex flex-col items-center justify-center gap-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Objetivo</p>
          {validTargets.length > 0 ? (
            <div className="flex flex-col gap-2 w-full max-w-[180px]">
              {validTargets.map((r) => {
                const color = getRarityColor(r);
                const isActive = targetRarity === r;
                const stepOdds = fromRarity ? getUpgradeOdds(fromRarity, r) : 0;
                return (
                  <button
                    key={r}
                    onClick={() => setTarget(isActive ? null : r)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${color}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? color + "50" : "rgba(255,255,255,0.06)"}`,
                      boxShadow: isActive ? `0 0 12px ${color}20` : "none",
                    }}
                  >
                    <span className="text-xs font-semibold" style={{ color: isActive ? color : "#505050", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                      {RARITIES[r].label}
                    </span>
                    <span className="text-[10px]" style={{
                      color: stepOdds >= 0.1 ? "#4a9a4a" : stepOdds >= 0.01 ? "#ffaa00" : "#ff5555",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                    }}>
                      {getUpgradeOddsPct(fromRarity!, r)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl p-6 w-full max-w-[180px] flex flex-col items-center gap-2" style={{ background: "#060606", border: "1px dashed rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-center" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Primero elegí tu apuesta</p>
            </div>
          )}
        </div>
      </div>

      {/* Inventory selector */}
      <div className="rounded-2xl p-4" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Inventario</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="ml-auto px-3 py-1.5 rounded-xl text-xs outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif", width: 160 }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {isLoading && <p className="text-xs w-full text-center py-6" style={{ color: "#2a2a2a" }}>Cargando...</p>}
          {!isLoading && filtered.length === 0 && <p className="text-xs w-full text-center py-6" style={{ color: "#2a2a2a" }}>Sin items disponibles.</p>}
          {filtered.map(inv => (
            <ItemMini
              key={inv.id}
              inv={inv}
              selected={selected?.id === inv.id}
              onClick={() => {
                setSelected(selected?.id === inv.id ? null : inv);
                setTarget(null);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
