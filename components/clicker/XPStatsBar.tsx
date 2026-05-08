"use client";

import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useClickerContext } from "./ClickerContext";
import { calculateLevel, levelProgress } from "@/lib/xp";

export default function XPStatsBar() {
  const { profile, isLoading } = useProfile();
  const { localClicks } = useClickerContext();

  if (isLoading || !profile) {
    return (
      <div className="mt-10 w-full max-w-sm h-32 rounded-2xl animate-pulse" 
           style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }} 
      />
    );
  }

  // OPTIMISTIC UI: Calculate XP based on local clicks to provide instant feedback
  // Clicks are worth 2 XP each.
  const additionalClicks = Math.max(0, localClicks - profile.total_clicks);
  const optimisticXp = profile.xp + additionalClicks * 2;

  const { level, xpInLevel, xpNeeded } = calculateLevel(optimisticXp);
  const progress = levelProgress(optimisticXp);

  return (
    <div
      className="mt-10 w-full sm:max-w-sm rounded-2xl px-4 sm:px-5 py-4"
      style={{
        background: "#060606",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-0.5"
            style={{ color: "#2a2a2a" }}
          >
            Nivel
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              color: "#efefef",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {level}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-xs uppercase tracking-widest mb-0.5"
            style={{ color: "#2a2a2a" }}
          >
            XP
          </p>
          <p
            className="text-sm"
            style={{
              color: "#404040",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            {xpInLevel.toLocaleString("es-AR")}{" "}
            <span style={{ color: "#2a2a2a" }}>
              / {xpNeeded.toLocaleString("es-AR")}
            </span>
          </p>
        </div>
      </div>

      {/* XP Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden mb-3"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{
            width: `${progress}%`,
            background: "rgba(255,255,255,0.35)",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>

      {/* Total clicks */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "#2a2a2a" }}>
          Total clicks
        </p>
        <p
          className="text-xs"
          style={{
            color: "#404040",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          {localClicks.toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  );
}
