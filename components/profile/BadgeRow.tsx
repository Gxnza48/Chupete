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
  glow?: string;
  icon?: string;
  displayName?: string;
};

const BADGE_STYLES: Record<string, BadgeStyle> = {
  primer_click:      { color: "#606060",                                         border: "rgba(96,96,96,0.35)",   glow: "rgba(96,96,96,0.15)",   icon: "◎", displayName: "1er Click" },
  click_100:         { color: "#888888",                                         border: "rgba(136,136,136,0.35)", glow: "rgba(136,136,136,0.15)", icon: "◎", displayName: "100 Clicks" },
  click_1000:        { color: "#b0b0b0",                                         border: "rgba(176,176,176,0.35)", glow: "rgba(176,176,176,0.15)", icon: "◎", displayName: "1K Clicks" },
  click_10000:       { color: "#d8d8d8",                                         border: "rgba(216,216,216,0.35)", glow: "rgba(216,216,216,0.15)", icon: "◎", displayName: "10K Clicks" },
  nivel_5:           { color: "#4a9a4a",                                         border: "rgba(74,154,74,0.4)",   glow: "rgba(74,154,74,0.2)",   icon: "▲", displayName: "Nv. 5" },
  nivel_10:          { color: "#8050d0",                                         border: "rgba(128,80,208,0.4)",  glow: "rgba(128,80,208,0.2)",  icon: "▲", displayName: "Nv. 10" },
  nivel_25:          { gradient: ["#ff6600", "#ffaa00"], glint: true,            border: "rgba(255,102,0,0.4)",   glow: "rgba(255,102,0,0.2)",   icon: "★", displayName: "Nv. 25" },
  primer_raro:       { color: "#8050d0",                                         border: "rgba(128,80,208,0.4)",  glow: "rgba(128,80,208,0.2)",  icon: "◆", displayName: "Primer Raro" },
  primer_legendario: { gradient: ["#ff6600", "#ffaa00"], glint: true,            border: "rgba(255,102,0,0.4)",   glow: "rgba(255,170,0,0.25)",  icon: "◆", displayName: "1er Legendario" },
  primer_ort:        { gradient: ["#ff1493", "#ff6600", "#ff1493"], glint: true, border: "rgba(255,20,147,0.4)",  glow: "rgba(255,20,147,0.25)", icon: "◆", displayName: "1er En el Ort**" },
};

const DEFAULT_STYLE: BadgeStyle = { color: "#606060", border: "rgba(96,96,96,0.3)", glow: "rgba(96,96,96,0.1)", icon: "◎" };

function BadgeChip({ userBadge }: { userBadge: UserBadge }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const badge = userBadge.badge;
  if (!badge) return null;

  const style = BADGE_STYLES[badge.key] ?? DEFAULT_STYLE;
  const displayName = style.displayName ?? badge.name;

  const textStyle: React.CSSProperties = style.gradient
    ? {
        backgroundImage: `linear-gradient(90deg, ${[...style.gradient, style.gradient[0]].join(", ")})`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }
    : { color: style.color ?? "#efefef" };

  return (
    <div className="relative">
      <motion.div
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        whileHover={{ scale: 1.06, y: -2 }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-default select-none${style.glint ? " glint-text" : ""}`}
        style={{
          background: `rgba(255,255,255,0.04)`,
          border: `1px solid ${style.border ?? "rgba(255,255,255,0.1)"}`,
          boxShadow: showTooltip ? `0 0 12px ${style.glow ?? "transparent"}` : "none",
          transition: "box-shadow 0.2s",
          fontFamily: "var(--font-syne), Syne, sans-serif",
          ...(!style.gradient ? textStyle : {}),
        }}
      >
        <span
          className={style.glint ? "glint-text" : ""}
          style={{
            fontSize: "10px",
            opacity: 0.7,
            ...(style.glint ? textStyle : { color: style.color ?? "#606060" }),
            backgroundImage: style.gradient ? textStyle.backgroundImage : undefined,
            backgroundSize: style.gradient ? textStyle.backgroundSize : undefined,
            WebkitBackgroundClip: style.gradient ? textStyle.WebkitBackgroundClip : undefined,
            backgroundClip: style.gradient ? textStyle.backgroundClip : undefined,
            WebkitTextFillColor: style.gradient ? textStyle.WebkitTextFillColor : undefined,
          }}
        >
          {style.icon}
        </span>
        <span
          className={style.glint ? "glint-text" : ""}
          style={style.gradient ? textStyle : { color: style.color ?? "#efefef" }}
        >
          {displayName}
        </span>
      </motion.div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
            style={{ minWidth: 160 }}
          >
            <div
              className="rounded-xl px-3 py-2.5 text-center"
              style={{
                background: "#0d0d0d",
                border: `1px solid ${style.border ?? "rgba(255,255,255,0.1)"}`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 20px ${style.glow ?? "transparent"}`,
              }}
            >
              <p className="text-xs font-bold mb-0.5 whitespace-nowrap" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                {badge.name}
              </p>
              {badge.description && (
                <p className="text-[10px] leading-snug" style={{ color: "#505050" }}>
                  {badge.description}
                </p>
              )}
              <p className="text-[9px] mt-1.5" style={{ color: "#2a2a2a" }}>
                {new Date(userBadge.earned_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full" style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${style.border ?? "rgba(255,255,255,0.1)"}` }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BadgeRow({ badges }: BadgeRowProps) {
  if (!badges || badges.length === 0) {
    return (
      <p className="text-xs py-3" style={{ color: "#2a2a2a" }}>Sin badges todavía</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((ub) => <BadgeChip key={ub.badge_id} userBadge={ub} />)}
    </div>
  );
}
