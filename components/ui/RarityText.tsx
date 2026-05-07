"use client";

import { RARITIES, type RarityKey } from "@/lib/rarities";

interface RarityTextProps {
  rarity: RarityKey;
  className?: string;
  children?: React.ReactNode;
}

export default function RarityText({
  rarity,
  className = "",
  children,
}: RarityTextProps) {
  const config = RARITIES[rarity];
  const text = children ?? config.label;

  const baseStyle: React.CSSProperties = {
    fontStyle: config.italic ? "italic" : "normal",
    fontFamily: "var(--font-syne), Syne, sans-serif",
  };

  if (config.glint && config.gradient) {
    const gradientStr = `linear-gradient(90deg, ${config.gradient.join(", ")}, ${config.gradient[0]})`;
    return (
      <span
        className={`glint-text ${className}`}
        style={{
          ...baseStyle,
          backgroundImage: gradientStr,
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        ...baseStyle,
        color: config.color ?? "#efefef",
      }}
    >
      {text}
    </span>
  );
}
