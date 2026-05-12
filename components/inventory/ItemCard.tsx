"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { InventoryItem } from "@/types/database";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

interface ItemCardProps {
  inventoryItem: InventoryItem;
  onPreview?: (inventoryItem: InventoryItem) => void;
}

export default function ItemCard({ inventoryItem, onPreview }: ItemCardProps) {
  const [hovered, setHovered] = useState(false);
  const item = inventoryItem.item;
  if (!item) return null;

  const rarity = item.rarity as RarityKey;
  const config = RARITIES[rarity];
  const glowColor = config.gradient ? config.gradient[0] : (config.color ?? "#3a3a3a");
  const condition = getConditionLabel(inventoryItem.float_value);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onPreview?.(inventoryItem)}
      className="relative rounded-xl overflow-hidden flex flex-col cursor-pointer"
      style={{
        width: 160,
        height: 240,
        background: "#060606",
        border: `1px solid ${hovered ? glowColor + "55" : "rgba(255,255,255,0.05)"}`,
        boxShadow: hovered ? `0 0 20px ${glowColor}20` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Listed badge */}
      {inventoryItem.is_listed && (
        <div
          className="absolute top-2 right-2 z-10 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
          style={{ background: "rgba(255,170,0,0.15)", color: "#ffaa00", border: "1px solid rgba(255,170,0,0.3)" }}
        >
          En venta
        </div>
      )}

      {/* Profile visibility dot */}
      {inventoryItem.show_in_profile && (
        <div
          className="absolute top-2 left-2 z-10 w-3 h-3 rounded-full"
          style={{ background: "#4a9a4a", boxShadow: "0 0 5px #4a9a4a80" }}
        />
      )}

      {/* Image */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ height: 130, background: `linear-gradient(135deg, ${glowColor}0a 0%, #080808 100%)` }}
      >
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} width={110} height={110} className="object-contain" style={{ maxHeight: 110, mixBlendMode: "screen" }} />
        ) : (
          <span className="text-5xl">🎁</span>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-2.5 pb-2 flex flex-col flex-1">
        {/* Nickname (if set) */}
        {inventoryItem.nickname && (
          <p
            className="text-[10px] mb-1 truncate"
            style={{
              color: inventoryItem.nickname_color ?? "#606060",
              fontWeight: inventoryItem.nickname_bold ? "bold" : "normal",
              fontStyle: inventoryItem.nickname_italic ? "italic" : "normal",
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
            {inventoryItem.nickname}
          </p>
        )}

        <p className="text-xs font-semibold leading-tight line-clamp-2 mb-1.5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          {item.name}
        </p>

        <RarityText rarity={rarity} className="text-[10px] font-medium" />

        <div className="mt-auto pt-2">
          <span className="text-[10px] px-2 py-0.5 rounded-md inline-block" style={{ background: "rgba(255,255,255,0.05)", color: "#505050", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            {condition}
          </span>
          {inventoryItem.durability != null && inventoryItem.max_durability != null && (
            <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(0, (inventoryItem.durability / inventoryItem.max_durability) * 100)}%`,
                  background: inventoryItem.durability / inventoryItem.max_durability > 0.5
                    ? "#4a9a4a"
                    : inventoryItem.durability / inventoryItem.max_durability > 0.2
                    ? "#ffaa00"
                    : "#ff6b6b",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
