"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserBadge } from "@/types/database";

interface BadgeRowProps {
  badges: UserBadge[];
}

type BadgeStyle = {
  color?: string;
  gradient?: readonly string[];
  glint?: boolean;
  border?: string;
};

const BADGE_STYLES: Record<string, BadgeStyle> = {
  primer_click:      { color: "#505050",                                         border: "rgba(80,80,80,0.3)" },
  click_100:         { color: "#707070",                                         border: "rgba(112,112,112,0.3)" },
  click_1000:        { color: "#a0a0a0",                                         border: "rgba(160,160,160,0.3)" },
  click_10000:       { color: "#d0d0d0",                                         border: "rgba(208,208,208,0.3)" },
  nivel_5:           { color: "#4a9a4a",                                         border: "rgba(74,154,74,0.3)" },
  nivel_10:          { color: "#8050d0",                                         border: "rgba(128,80,208,0.3)" },
  nivel_25:          { gradient: ["#ff6600", "#ffaa00"], glint: true,            border: "rgba(255,102,0,0.3)" },
  primer_raro:       { color: "#8050d0",                                         border: "rgba(128,80,208,0.3)" },
  primer_legendario: { gradient: ["#ff6600", "#ffaa00"], glint: true,            border: "rgba(255,102,0,0.3)" },
  primer_ort:        { gradient: ["#ff1493", "#ff6600", "#ff1493"], glint: true, border: "rgba(255,20,147,0.3)" },
};

const DEFAULT_STYLE: BadgeStyle = { color: "#505050", border: "rgba(80,80,80,0.3)" };

function BadgeChip({ userBadge }: { userBadge: UserBadge }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const badge = userBadge.badge;
  if (!badge) return null;

  const style = BADGE_STYLES[badge.key] ?? DEFAULT_STYLE;
  const borderColor = style.border ?? "rgba(255,255,255,0.1)";

  const textStyle: React.CSSProperties = style.gradient
    ? {
        backgroundImage: `linear-gradient(90deg, ${[...style.gradient, style.gradient[0]].join(", ")})`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }
    : { color: style.color };

  return (
    <div className="relative">
      <motion.div
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        whileHover={{ scale: 1.05 }}
        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-default select-none${style.glint ? " glint-text" : ""}`}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${borderColor}`,
          ...textStyle,
          fontFamily: "var(--font-syne), Syne, sans-serif",
        }}
      >
        {badge.name}
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
            style={{ minWidth: "160px" }}
          >
            <div
              className="rounded-xl px-3 py-2 text-center"
              style={{
                background: "#0e0e0e",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <p
                className="text-xs font-bold mb-0.5 whitespace-nowrap"
                style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}
              >
                {badge.name}
              </p>
              {badge.description && (
                <p className="text-[10px]" style={{ color: "#404040" }}>
                  {badge.description}
                </p>
              )}
              <p className="text-[9px] mt-1" style={{ color: "#2a2a2a" }}>
                {new Date(userBadge.earned_at).toLocaleDateString("es-AR")}
              </p>
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full"
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid rgba(255,255,255,0.1)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BadgeRow({ badges }: BadgeRowProps) {
  if (!badges || badges.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-xs" style={{ color: "#2a2a2a" }}>
          Sin badges todavía
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((ub) => (
        <BadgeChip key={ub.badge_id} userBadge={ub} />
      ))}
    </div>
  );
}
