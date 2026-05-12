"use client";

import { motion } from "framer-motion";
import type { DropResult } from "@/types/database";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";
import ItemSVG from "@/components/ui/ItemSVG";

interface DropToastProps {
  drop: DropResult;
  onDismiss: () => void;
}

export default function DropToast({ drop, onDismiss }: DropToastProps) {
  const condition = getConditionLabel(drop.float_value);
  const rarityConfig = RARITIES[drop.rarity as RarityKey];
  const glowColor = rarityConfig.gradient
    ? rarityConfig.gradient[0]
    : (rarityConfig.color ?? "#efefef");

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      onClick={onDismiss}
      className="relative overflow-hidden rounded-xl cursor-pointer select-none"
      style={{
        background: "#0a0a0a",
        border: `1px solid ${glowColor}40`,
        boxShadow: `0 0 20px ${glowColor}20, 0 8px 32px rgba(0,0,0,0.6)`,
        width: "300px",
        padding: "16px",
      }}
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          boxShadow: [
            `inset 0 0 20px ${glowColor}10`,
            `inset 0 0 30px ${glowColor}20`,
            `inset 0 0 20px ${glowColor}10`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex items-start gap-3">
        {/* Item thumbnail */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${glowColor}30`,
          }}
        >
          <ItemSVG name={drop.item.name} rarity={drop.item.rarity} size={56} glow={false} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#404040" }}>
            ¡Obtuviste!
          </p>
          <p
            className="font-bold text-sm truncate mb-0.5"
            style={{
              color: "#efefef",
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
            {drop.item.name}
          </p>
          <RarityText
            rarity={drop.rarity as RarityKey}
            className="text-xs font-semibold"
          />
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: "#606060",
              }}
            >
              {drop.float_value.toFixed(8)}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#606060",
              }}
            >
              {condition}
            </span>
          </div>
          {drop.isNewRecord && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block text-[10px] px-1.5 py-0.5 rounded mt-1.5 font-bold"
              style={{
                background: "rgba(255,170,0,0.15)",
                color: "#ffaa00",
                border: "1px solid rgba(255,170,0,0.3)",
              }}
            >
              ★ Mejor float
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
