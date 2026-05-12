"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useClickerContext } from "./ClickerContext";
import { useProfile } from "@/hooks/useProfile";
import Image from "next/image";
import type { RarityKey } from "@/lib/rarities";
import { RARITIES } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";
import { playClick } from "@/lib/sounds";

const LEGENDARY_RARITIES = ["legendario", "extraterrestre", "en_el_ort"];

type EquippedItem = {
  id: string;
  image_url: string;
  name: string;
  rarity: RarityKey;
  durability: number | null;
  max_durability: number | null;
};

function getRarityGlow(rarity: RarityKey): string {
  const config = RARITIES[rarity];
  return config.gradient ? config.gradient[0] : (config.color ?? "#efefef");
}

// ── Durability bar ────────────────────────────────────────────────────────────
function DurabilityBar({ pct }: { pct: number }) {
  const color =
    pct > 0.65 ? "#4a9a4a"
    : pct > 0.40 ? "#a8c040"
    : pct > 0.25 ? "#ffaa00"
    : pct > 0.10 ? "#ff7700"
    : "#ff3333";

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      className="w-full max-w-[180px] mt-2"
    >
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${Math.max(0, pct * 100)}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ background: color, boxShadow: `0 0 4px ${color}80` }}
        />
      </div>
    </motion.div>
  );
}

// ── Rarity-specific click effects ─────────────────────────────────────────────
type Spark = { id: number; x: number; y: number; angle: number; dist: number };

function GoldSparkles({ sparks }: { sparks: Spark[] }) {
  return (
    <AnimatePresence>
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          className="absolute pointer-events-none rounded-full"
          initial={{ x: s.x, y: s.y, opacity: 1, scale: 1, width: 5, height: 5 }}
          animate={{ x: s.x + Math.cos(s.angle) * s.dist, y: s.y + Math.sin(s.angle) * s.dist, opacity: 0, scale: 0.2 }}
          exit={{}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: "#ffcc00", boxShadow: "0 0 6px #ffcc00", left: 0, top: 0 }}
        />
      ))}
    </AnimatePresence>
  );
}

function CyanZap({ sparks }: { sparks: Spark[] }) {
  return (
    <AnimatePresence>
      {sparks.map((s) => (
        <motion.svg
          key={s.id}
          className="absolute pointer-events-none"
          style={{ left: s.x, top: s.y, overflow: "visible" }}
          width={0} height={0}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{}}
          transition={{ duration: 0.4 }}
        >
          <line x1={0} y1={0} x2={Math.cos(s.angle) * s.dist * 0.6} y2={Math.sin(s.angle) * s.dist * 0.6}
            stroke="#00ccff" strokeWidth={1.5} strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 3px #00ccff)" }}
          />
        </motion.svg>
      ))}
    </AnimatePresence>
  );
}

function CosmicBolt({ sparks, color }: { sparks: Spark[]; color: string }) {
  return (
    <AnimatePresence>
      {sparks.map((s) => (
        <motion.svg
          key={s.id}
          className="absolute pointer-events-none"
          style={{ left: s.x, top: s.y, overflow: "visible" }}
          width={0} height={0}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{}}
          transition={{ duration: 0.5 }}
        >
          {/* Zigzag lightning path */}
          <polyline
            points={`0,0 ${Math.cos(s.angle) * s.dist * 0.35},${Math.sin(s.angle) * s.dist * 0.35 - 8} ${Math.cos(s.angle) * s.dist * 0.6},${Math.sin(s.angle) * s.dist * 0.6 + 6} ${Math.cos(s.angle) * s.dist},${Math.sin(s.angle) * s.dist}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
          {/* Tip flare */}
          <circle cx={Math.cos(s.angle) * s.dist} cy={Math.sin(s.angle) * s.dist} r={3} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        </motion.svg>
      ))}
    </AnimatePresence>
  );
}

// ── Main clicker ──────────────────────────────────────────────────────────────
function ClickerContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [equippedItem, setEquippedItem] = useState<EquippedItem | null>(null);
  const [localDurability, setLocalDurability] = useState<number | null>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [isHot, setIsHot] = useState(false);
  const sparkId = useRef(0);
  const bonusXpPending = useRef(0);
  const clickTimestamps = useRef<number[]>([]);
  const supabase = createClient();

  const { handleClick, isAnimating, lastDrop, localClicks, xpParticles, itemBroke } = useClickerContext();
  const { profile } = useProfile();

  useEffect(() => {
    async function fetchEquipped() {
      if (!profile?.equipped_chupete_id) { setEquippedItem(null); setLocalDurability(null); return; }

      // Always fetch basic item info
      const { data } = await supabase
        .from("inventory")
        .select("id, item:items(name, image_url, rarity)")
        .eq("id", profile.equipped_chupete_id)
        .maybeSingle();

      if (!data?.item) { setEquippedItem(null); setLocalDurability(null); return; }

      const item = data.item as unknown as { name: string; image_url: string; rarity: string };
      setEquippedItem({
        id: data.id,
        image_url: item.image_url,
        name: item.name,
        rarity: item.rarity as RarityKey,
        durability: null,
        max_durability: null,
      });

      // Try to fetch durability separately (requires migration 007 + 010)
      try {
        const { data: dur } = await supabase
          .from("inventory")
          .select("durability, max_durability, float_value")
          .eq("id", profile.equipped_chupete_id)
          .maybeSingle();

        // Use DB durability if available; fall back to float_value-derived max for untracked items
        function maxFromFloat(fv: number): number {
          if (fv < 0.07) return 5000;
          if (fv < 0.15) return 3000;
          if (fv < 0.38) return 1500;
          if (fv < 0.45) return 800;
          return 300;
        }

        if (dur) {
          const maxDur = dur.max_durability ?? maxFromFloat(dur.float_value ?? 0.5);
          const curDur = dur.durability ?? maxDur;
          setEquippedItem((prev) => prev ? { ...prev, durability: curDur, max_durability: maxDur } : prev);
          setLocalDurability(curDur);
        }
      } catch {}
    }
    fetchEquipped();
  }, [profile?.equipped_chupete_id, supabase]);

  // Clear equipped item display when it breaks
  useEffect(() => {
    if (itemBroke) {
      setEquippedItem(null);
      setLocalDurability(null);
    }
  }, [itemBroke]);

  // Racha: track click speed and update hot state
  useEffect(() => {
    const HOT_WINDOW_MS = 30000; // 30 seconds
    const HOT_THRESHOLD = 120;   // 120 clicks in that window
    const interval = setInterval(() => {
      const now = Date.now();
      clickTimestamps.current = clickTimestamps.current.filter(t => now - t < HOT_WINDOW_MS);
      setIsHot(clickTimestamps.current.length >= HOT_THRESHOLD);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Bonus XP flush
  useEffect(() => {
    const interval = setInterval(async () => {
      if (bonusXpPending.current <= 0) return;
      const toSend = Math.min(bonusXpPending.current, 13);
      bonusXpPending.current = 0;
      try { await fetch("/api/bonus-xp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bonus_xp: toSend }) }); } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    }
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const rarity = equippedItem?.rarity;
  const isLegendaryPlus = rarity && LEGENDARY_RARITIES.includes(rarity);
  const glowColor = rarity ? getRarityGlow(rarity) : "rgba(255,255,255,0.3)";
  const xpColor = glowColor;

  const addSparks = useCallback((cx: number, cy: number) => {
    if (!rarity || !isLegendaryPlus) return;
    const count = rarity === "en_el_ort" ? 6 : rarity === "extraterrestre" ? 5 : 4;
    const newSparks: Spark[] = Array.from({ length: count }, () => ({
      id: sparkId.current++,
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 40,
      angle: Math.random() * 2 * Math.PI,
      dist: 40 + Math.random() * 60,
    }));
    setSparks((prev) => [...prev.slice(-20), ...newSparks]);
    setTimeout(() => setSparks((prev) => prev.filter((s) => !newSparks.find((n) => n.id === s.id))), 650);
  }, [rarity, isLegendaryPlus]);

  const durPct = useMemo(() => {
    if (localDurability === null || !equippedItem?.max_durability) return null;
    return localDurability / equippedItem.max_durability;
  }, [localDurability, equippedItem?.max_durability]);

  const onClickHandler = useCallback((e: React.MouseEvent) => {
    if (!isAuthenticated) return;
    setPulseKey((k) => k + 1);
    playClick();

    // Track for racha system
    clickTimestamps.current.push(Date.now());

    if (isLegendaryPlus && Math.random() < 0.15) bonusXpPending.current += 13;

    // Optimistic durability decrement
    setLocalDurability((d) => d !== null ? Math.max(0, d - 1) : d);

    // Spawn sparks
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    addSparks(e.clientX - rect.left, e.clientY - rect.top);

    handleClick(e);
  }, [isAuthenticated, isLegendaryPlus, addSparks, handleClick]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const imageUrl = equippedItem?.image_url || "/items/chupete-basico.svg";
  const imageName = equippedItem?.name || "Chupete Básico";

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Equipped badge */}
      {equippedItem && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: glowColor + "12", border: `1px solid ${glowColor}30` }}
        >
          <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
            <Image src={imageUrl} alt={imageName} width={16} height={16} className="object-contain" style={{ mixBlendMode: "screen" }} />
          </div>
          <RarityText rarity={equippedItem.rarity} className="text-[10px]" />
          <span className="text-[10px]" style={{ color: "#2a2a2a" }}>{equippedItem.name}</span>
        </motion.div>
      )}

      {/* Click area */}
      <div className="relative flex flex-col items-center" style={{ width: "min(240px, 80vw)" }}>
        <div className="relative flex items-center justify-center" style={{ width: "min(240px, 80vw)", height: "min(240px, 80vw)" }}>
          {/* Ambient glow (legendary+) */}
          {isLegendaryPlus && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: `radial-gradient(circle, ${glowColor}25 0%, transparent 70%)` }}
            />
          )}

          {/* Pulse ring on click */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                key={pulseKey}
                className="absolute inset-0 rounded-full pointer-events-none"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ background: `radial-gradient(circle, ${glowColor}25 0%, transparent 70%)` }}
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
                style={{ top: p.y, left: 0, fontFamily: "var(--font-jetbrains-mono), monospace", color: xpColor, textShadow: `0 0 8px ${xpColor}80` }}
              >
                +2 XP
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Rarity-specific spark effects */}
          {rarity === "legendario" && <GoldSparkles sparks={sparks} />}
          {rarity === "extraterrestre" && <CyanZap sparks={sparks} />}
          {rarity === "en_el_ort" && <CosmicBolt sparks={sparks} color={glowColor} />}

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
              filter: !isAuthenticated ? "grayscale(1)" : isAnimating ? `drop-shadow(0 0 24px ${glowColor}80)` : `drop-shadow(0 4px 24px ${glowColor}30)`,
              transition: "filter 0.2s",
            }}
          >
            <Image
              src={imageUrl} alt={imageName} width={220} height={220} priority draggable={false}
              className="w-[min(220px,75vw)] h-[min(220px,75vw)]"
              style={{
                mixBlendMode: "screen",
                maskImage: equippedItem ? "radial-gradient(circle at center, black 45%, transparent 72%)" : undefined,
                WebkitMaskImage: equippedItem ? "radial-gradient(circle at center, black 45%, transparent 72%)" : undefined,
              }}
            />
          </motion.div>

          {/* Racha caliente overlay */}
          <AnimatePresence>
            {isHot && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl pointer-events-none z-10"
                style={{ background: "radial-gradient(circle, rgba(255,80,0,0.18) 0%, transparent 70%)" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-center px-3"
                >
                  <p className="text-xl font-black" style={{ color: "#ff5500", textShadow: "0 0 12px #ff550080", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    ¡Te chupetiaste! 🔥
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#ff8844", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    Seguí así 🔥🔥
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unauthenticated overlay */}
          {!isAuthenticated && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.75)" }}>
              <span className="text-2xl mb-2">🔒</span>
              <p className="text-sm font-semibold text-center px-4" style={{ color: "#efefef" }}>Registrate para empezar</p>
              <a href="/auth" className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif", textDecoration: "none" }}>Crear cuenta</a>
            </div>
          )}
        </div>

        {/* Durability bar */}
        {equippedItem && durPct !== null && (
          <DurabilityBar pct={durPct} />
        )}
      </div>

      {/* Click counter */}
      <div className="text-center" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#404040", fontSize: "13px" }}>
        {localClicks.toLocaleString("es-AR")} <span style={{ color: "#2a2a2a" }}>clicks</span>
      </div>

      {/* Recent drop */}
      {lastDrop && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#2a2a2a" }}>Último drop</p>
          <RecentDropStrip rarity={lastDrop.rarity as RarityKey} name={lastDrop.item.name} imageUrl={lastDrop.item.image_url} float={lastDrop.float_value} />
        </div>
      )}
    </div>
  );
}

function RecentDropStrip({ rarity, name, imageUrl, float }: { rarity: RarityKey; name: string; imageUrl: string; float: number }) {
  const config = RARITIES[rarity];
  const glowColor = config.gradient ? config.gradient[0] : (config.color ?? "#404040");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{ background: "#060606", border: `1px solid ${glowColor}30`, boxShadow: `0 0 12px ${glowColor}15` }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
        {imageUrl ? <Image src={imageUrl} alt={name} width={32} height={32} className="object-cover" style={{ mixBlendMode: "screen" }} /> : <span className="text-lg">🎁</span>}
      </div>
      <div>
        <p className="text-xs font-medium truncate max-w-[160px]" style={{ color: "#efefef" }}>{name}</p>
        <div className="flex items-center gap-2">
          <RarityText rarity={rarity} className="text-[10px]" />
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#2a2a2a" }}>{float.toFixed(6)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClickerArea() {
  return <ClickerContent />;
}
