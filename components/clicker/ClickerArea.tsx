"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useClickerContext } from "./ClickerContext";
import Image from "next/image";
import type { RarityKey } from "@/lib/rarities";
import { RARITIES } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

function ClickerContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const supabase = createClient();

  const { handleClick, isAnimating, lastDrop, localClicks, xpParticles } =
    useClickerContext();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  function onClickHandler(e: React.MouseEvent) {
    if (!isAuthenticated) return;
    setPulseKey((k) => k + 1);
    handleClick(e);
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Click area */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 240, height: 240 }}
      >
        {/* Pulse rings on click */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              key={pulseKey}
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* XP Particles */}
        <AnimatePresence>
          {xpParticles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute pointer-events-none font-bold text-sm select-none z-10"
              initial={{ opacity: 1, y: 0, x: p.x - 120 }}
              animate={{ opacity: 0, y: -50 }}
              exit={{}}
              transition={{ duration: 0.9, ease: "easeOut" }}
              style={{
                top: p.y,
                left: 0,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: "#efefef",
                textShadow: "0 0 8px rgba(255,255,255,0.6)",
              }}
            >
              +2 XP
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Chupete */}
        <motion.div
          onClick={!isAuthenticated ? undefined : onClickHandler}
          animate={isAnimating ? { scale: [1, 0.88, 1.04, 1] } : {}}
          transition={{ duration: 0.25, ease: "easeOut" }}
          whileHover={!isAuthenticated ? {} : { scale: 1.04 }}
          className={isAuthenticated ? "float-bob select-none" : "select-none"}
          style={{
            cursor: !isAuthenticated ? "not-allowed" : "pointer",
            opacity: !isAuthenticated ? 0.4 : 1,
            filter: !isAuthenticated
              ? "grayscale(1)"
              : isAnimating
              ? "drop-shadow(0 0 18px rgba(255,255,255,0.35))"
              : "drop-shadow(0 4px 24px rgba(255,255,255,0.12))",
            transition: "filter 0.2s",
          }}
        >
          <Image
            src="/items/chupete-basico.svg"
            alt="Chupete Básico"
            width={220}
            height={220}
            priority
            draggable={false}
          />
        </motion.div>

        {/* Overlay for unauthenticated */}
        {!isAuthenticated && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: "rgba(0,0,0,0.75)" }}
          >
            <span className="text-2xl mb-2">🔒</span>
            <p
              className="text-sm font-semibold text-center px-4"
              style={{ color: "#efefef" }}
            >
              Registrate para empezar
            </p>
            <a
              href="/auth"
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: "#efefef",
                color: "#000000",
                fontFamily: "var(--font-syne), Syne, sans-serif",
                textDecoration: "none",
              }}
            >
              Crear cuenta
            </a>
          </div>
        )}

      </div>

      {/* Click counter */}
      <div
        className="text-center"
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          color: "#404040",
          fontSize: "13px",
        }}
      >
        {localClicks.toLocaleString("es-AR")}{" "}
        <span style={{ color: "#2a2a2a" }}>clicks</span>
      </div>

      {/* Recent drops mini-strip */}
      {lastDrop && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a" }}>
            Último drop
          </p>
          <RecentDropStrip rarity={lastDrop.rarity as RarityKey} name={lastDrop.item.name} imageUrl={lastDrop.item.image_url} float={lastDrop.float_value} />
        </div>
      )}
    </div>
  );
}

function RecentDropStrip({
  rarity,
  name,
  imageUrl,
  float,
}: {
  rarity: RarityKey;
  name: string;
  imageUrl: string;
  float: number;
}) {
  const config = RARITIES[rarity];
  const glowColor = config.gradient ? config.gradient[0] : (config.color ?? "#404040");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{
        background: "#060606",
        border: `1px solid ${glowColor}30`,
        boxShadow: `0 0 12px ${glowColor}15`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={name} width={32} height={32} className="object-cover" style={{ mixBlendMode: "screen" }} />
        ) : (
          <span className="text-lg">🎁</span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium truncate max-w-[160px]" style={{ color: "#efefef" }}>{name}</p>
        <div className="flex items-center gap-2">
          <RarityText rarity={rarity} className="text-[10px]" />
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#2a2a2a" }}>
            {float.toFixed(6)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClickerArea() {
  return <ClickerContent />;
}
