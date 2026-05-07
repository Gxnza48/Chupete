"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Listing } from "@/types/database";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

interface ListingCardProps {
  listing: Listing;
  onBuy?: (listing: Listing) => void;
  currentUserId?: string;
}

export default function ListingCard({
  listing,
  onBuy,
  currentUserId,
}: ListingCardProps) {
  const [hovered, setHovered] = useState(false);
  const item = listing.inventory?.item;
  if (!item) return null;

  const rarity = item.rarity as RarityKey;
  const config = RARITIES[rarity];
  const glowColor = config.gradient
    ? config.gradient[0]
    : (config.color ?? "#3a3a3a");
  const condition = listing.inventory
    ? getConditionLabel(listing.inventory.float_value)
    : "";
  const isMine = listing.seller_id === currentUserId;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={!isMine && onBuy ? () => onBuy(listing) : undefined}
      className="relative rounded-xl overflow-hidden flex flex-col"
      style={{
        width: 160,
        height: 240,
        background: "#060606",
        border: `1px solid ${hovered && !isMine ? glowColor + "60" : "rgba(255,255,255,0.05)"}`,
        boxShadow: hovered && !isMine ? `0 0 20px ${glowColor}20` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        cursor: !isMine && onBuy ? "pointer" : "default",
      }}
    >
      {/* Image */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 110,
          background: `linear-gradient(135deg, ${glowColor}0a 0%, #080808 100%)`,
        }}
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            width={90}
            height={90}
            className="object-contain"
            style={{ maxHeight: 90, mixBlendMode: "screen" }}
          />
        ) : (
          <span className="text-5xl">🎁</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p
          className="text-xs font-semibold leading-tight line-clamp-2"
          style={{
            color: "#efefef",
            fontFamily: "var(--font-syne), Syne, sans-serif",
          }}
        >
          {item.name}
        </p>
        <RarityText rarity={rarity} className="text-[10px] font-medium" />

        {listing.inventory && (
          <span
            className="text-[10px]"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              color: "#3a3a3a",
            }}
          >
            {listing.inventory.float_value.toFixed(8)}
          </span>
        )}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded inline-block w-fit"
          style={{ background: "rgba(255,255,255,0.04)", color: "#404040" }}
        >
          {condition}
        </span>

        {listing.seller && (
          <p className="text-[10px]" style={{ color: "#2a2a2a" }}>
            por{" "}
            <a
              href={`/perfil/${listing.seller.username}`}
              style={{ color: "#404040", textDecoration: "none" }}
            >
              {listing.seller.username}
            </a>
          </p>
        )}

        <div className="mt-auto pt-2 flex flex-col gap-2">
          <p
            className="font-bold text-sm"
            style={{
              color: "#efefef",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {(listing.price_credits ?? listing.price_ars).toLocaleString("es-AR")} cr.
          </p>

          {isMine ? (
            <div
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                color: "#404040",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              Tu publicación
            </div>
          ) : (
            onBuy && (
              <button
                onClick={(e) => { e.stopPropagation(); onBuy(listing); }}
                className="w-full py-2 rounded-lg text-[11px] font-bold transition-all duration-150"
                style={{
                  background: hovered ? "#efefef" : "rgba(239,239,239,0.12)",
                  color: hovered ? "#000000" : "#efefef",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-syne), Syne, sans-serif",
                }}
              >
                Comprar
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
