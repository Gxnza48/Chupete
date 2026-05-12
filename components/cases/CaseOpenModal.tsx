"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import { rollRarity, RARITY_COLOR, type CaseRarityEntry } from "@/lib/cases";
import RarityText from "@/components/ui/RarityText";
import { useToast } from "@/components/ui/Toast";
import { playCaseOpenSpin, playCaseResult } from "@/lib/sounds";

const CARD_W = typeof window !== "undefined" && window.innerWidth < 480 ? 110 : 148;
const CARD_GAP = 8;
const STRIDE = CARD_W + CARD_GAP;
const STRIP_SIZE = 32;
const WINNER_IDX = 24;

// Rarity-based effect config
const RARITY_EFFECTS: Record<string, { bgOpacity: number; particles: number; shake: boolean; rings: number; lightningBolts: number }> = {
  comun:          { bgOpacity: 0.04, particles: 0,  shake: false, rings: 0, lightningBolts: 0 },
  poco_comun:     { bgOpacity: 0.07, particles: 10, shake: false, rings: 0, lightningBolts: 0 },
  medio_raro:     { bgOpacity: 0.10, particles: 16, shake: false, rings: 1, lightningBolts: 0 },
  raro:           { bgOpacity: 0.14, particles: 22, shake: false, rings: 1, lightningBolts: 0 },
  ultra_raro:     { bgOpacity: 0.18, particles: 30, shake: true,  rings: 2, lightningBolts: 0 },
  legendario:     { bgOpacity: 0.22, particles: 40, shake: true,  rings: 2, lightningBolts: 0 },
  extraterrestre: { bgOpacity: 0.20, particles: 36, shake: true,  rings: 3, lightningBolts: 2 },
  en_el_ort:      { bgOpacity: 0.28, particles: 55, shake: true,  rings: 4, lightningBolts: 5 },
};

type StripCard = {
  rarity: RarityKey;
  isWinner: boolean;
  itemName?: string;
  imageUrl?: string;
  credits?: number;
};

export type CaseResult =
  | { type: "item"; item: { id: string; name: string; rarity: string; image_url: string; float_value: number; inventory_id: string } }
  | { type: "credits"; credits_won: number };

export type ItemsByRarity = Record<string, { id: string; name: string; image_url: string }[]>;

interface Props {
  result: CaseResult | null;
  caseRarities: CaseRarityEntry[];
  itemsByRarity: ItemsByRarity;
  onClose: () => void;
  onOpenAnother?: () => void;
}

function pickItem(rarity: RarityKey, itemsByRarity: ItemsByRarity) {
  const pool = itemsByRarity[rarity] ?? [];
  if (!pool.length) return { name: undefined, imageUrl: undefined };
  const item = pool[Math.floor(Math.random() * pool.length)];
  return { name: item.name, imageUrl: item.image_url };
}

function buildStrip(result: CaseResult, rarities: CaseRarityEntry[], itemsByRarity: ItemsByRarity): StripCard[] {
  return Array.from({ length: STRIP_SIZE }, (_, i) => {
    if (i === WINNER_IDX) {
      if (result.type === "item") {
        return { rarity: result.item.rarity as RarityKey, isWinner: true, itemName: result.item.name, imageUrl: result.item.image_url };
      }
      return { rarity: "comun", isWinner: true, credits: result.credits_won };
    }
    const rarity = rollRarity(rarities);
    const { name, imageUrl } = pickItem(rarity, itemsByRarity);
    return { rarity, isWinner: false, itemName: name, imageUrl };
  });
}

function StripCardEl({ card, phase }: { card: StripCard; phase: string }) {
  const color = RARITY_COLOR(card.rarity);
  const config = RARITIES[card.rarity];
  const isWinner = card.isWinner;
  const highlight = isWinner && phase === "result";

  return (
    <motion.div
      animate={highlight ? { scale: 1.06, y: -6 } : { scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{
        width: CARD_W, height: 200,
        background: "#0a0a0a",
        border: `1px solid ${highlight ? color + "80" : color + "25"}`,
        boxShadow: highlight ? `0 0 28px ${color}40, 0 0 60px ${color}15` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      <div
        className="relative flex items-center justify-center flex-1"
        style={{
          background: config.gradient
            ? `linear-gradient(135deg, ${config.gradient[0]}18 0%, ${config.gradient[1] ?? config.gradient[0]}08 100%)`
            : `${color}10`,
        }}
      >
        {card.credits ? (
          <span className="text-2xl font-bold" style={{ color, fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {card.credits.toLocaleString("es-AR")}<span className="text-xs ml-0.5">cr.</span>
          </span>
        ) : (
          <Image
            src={card.imageUrl ?? "/items/chupete-basico.svg"}
            alt={card.itemName ?? card.rarity}
            width={100} height={100}
            className="object-contain"
            style={{ mixBlendMode: "screen", filter: `drop-shadow(0 0 8px ${color}50)`, maskImage: "radial-gradient(circle at center, black 48%, transparent 74%)", WebkitMaskImage: "radial-gradient(circle at center, black 48%, transparent 74%)" }}
          />
        )}
        {highlight && (
          <motion.div className="absolute inset-0"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }}
          />
        )}
      </div>
      <div className="px-2 py-2 flex flex-col gap-0.5" style={{ borderTop: `1px solid ${color}15` }}>
        <RarityText rarity={card.rarity} className="text-[10px] font-bold" />
        {card.itemName && <p className="text-[9px] leading-tight line-clamp-1" style={{ color: "#404040" }}>{card.itemName}</p>}
      </div>
    </motion.div>
  );
}

// ── Particle effect ───────────────────────────────────────────────────────────
function Particles({ count, color, active }: { count: number; color: string; active: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
      const dist = 80 + Math.random() * 180;
      const size = 4 + Math.random() * 6;
      const delay = Math.random() * 0.4;
      return { angle, dist, size, delay };
    }),
    [count]
  );

  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{ duration: 0.8 + Math.random() * 0.6, delay: p.delay, ease: "easeOut" }}
          style={{ width: p.size, height: p.size, background: color, boxShadow: `0 0 ${p.size * 2}px ${color}` }}
        />
      ))}
    </div>
  );
}

// ── Ring effect ───────────────────────────────────────────────────────────────
function Rings({ count, color, active }: { count: number; color: string; active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          initial={{ width: 80, height: 80, opacity: 0.8 }}
          animate={{ width: 400 + i * 80, height: 400 + i * 80, opacity: 0 }}
          transition={{ duration: 1.0 + i * 0.3, delay: i * 0.2, ease: "easeOut" }}
          style={{ borderColor: color, boxShadow: `0 0 12px ${color}60` }}
        />
      ))}
    </div>
  );
}

// ── Lightning bolt ────────────────────────────────────────────────────────────
function LightningBolts({ count, color, active }: { count: number; color: string; active: boolean }) {
  const bolts = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * 360 + Math.random() * 30,
      delay: i * 0.1,
      length: 120 + Math.random() * 80,
    })),
    [count]
  );

  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {bolts.map((bolt, i) => (
        <motion.svg
          key={i}
          className="absolute"
          width={300} height={300}
          viewBox="-150 -150 300 300"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 0.5, delay: bolt.delay, times: [0, 0.1, 0.5, 1] }}
        >
          <motion.line
            x1={0} y1={0}
            x2={Math.cos((bolt.angle * Math.PI) / 180) * bolt.length}
            y2={Math.sin((bolt.angle * Math.PI) / 180) * bolt.length}
            stroke={color}
            strokeWidth={2 + Math.random() * 2}
            strokeLinecap="round"
            filter={`drop-shadow(0 0 4px ${color})`}
          />
        </motion.svg>
      ))}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function CaseOpenModal({ result, caseRarities, itemsByRarity, onClose, onOpenAnother }: Props) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [strip, setStrip] = useState<StripCard[]>([]);
  const [winnerCard, setWinnerCard] = useState<StripCard | null>(null);
  const [effectActive, setEffectActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stripX = useMotionValue(0);
  const router = useRouter();
  const { addToast } = useToast();
  const toastedResult = useRef<string | null>(null);

  const runStrip = useCallback((res: CaseResult) => {
    const newStrip = buildStrip(res, caseRarities, itemsByRarity);
    setStrip(newStrip);
    setWinnerCard(newStrip[WINNER_IDX]);
    setEffectActive(false);
    stripX.set(0);
    setPhase("spinning");
    playCaseOpenSpin();

    requestAnimationFrame(() => {
      const containerW = containerRef.current?.clientWidth ?? 600;
      const jitter = (Math.random() - 0.5) * 20;
      const targetX = -(WINNER_IDX * STRIDE) + (containerW / 2 - CARD_W / 2) + jitter;

      animate(stripX, targetX, {
        duration: 4.8,
        ease: [0.12, 0.005, 0.055, 1.0],
        onComplete: () => {
          setPhase("result");
          setEffectActive(true);
          const rarity = newStrip[WINNER_IDX]?.rarity ?? "comun";
          playCaseResult(rarity);
        },
      });
    });
  }, [caseRarities, stripX, itemsByRarity]);

  useEffect(() => {
    if (!result) { setPhase("idle"); setStrip([]); toastedResult.current = null; return; }
    runStrip(result);
  }, [result, runStrip]);

  useEffect(() => {
    if (phase !== "result" || !result || result.type !== "item") return;
    if (toastedResult.current === result.item.inventory_id) return;
    toastedResult.current = result.item.inventory_id;
    addToast({
      variant: "drop",
      drop: {
        item: { id: result.item.id, name: result.item.name, image_url: result.item.image_url, rarity: result.item.rarity as import("@/types/database").RarityType, description: null, base_price_ars: 0, created_at: "" },
        float_value: result.item.float_value,
        rarity: result.item.rarity as import("@/types/database").RarityType,
        isNewRecord: false,
        inventory_id: result.item.inventory_id,
      },
    });
  }, [phase, result, addToast]);

  if (!result) return null;

  const isItem = result.type === "item";
  const winnerRarity = winnerCard?.rarity ?? "comun";
  const winnerColor = RARITY_COLOR(winnerRarity);
  const isLegendaryPlus = ["legendario", "extraterrestre", "en_el_ort"].includes(winnerRarity);
  const fx = RARITY_EFFECTS[winnerRarity] ?? RARITY_EFFECTS.comun;

  return (
    <AnimatePresence>
      {/* Dark backdrop */}
      <motion.div key="case-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50" style={{ background: "rgba(0,0,0,0.97)" }}
      />

      {/* Rarity color background (shown on result) */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            key="rarity-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: fx.bgOpacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${winnerColor} 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* Screen shake wrapper for legendary+ */}
      <motion.div
        key="shake-wrapper"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 gap-8"
        animate={effectActive && fx.shake ? {
          x: [0, -6, 6, -4, 4, -2, 2, 0],
          y: [0, 3, -3, 2, -2, 0],
        } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#606060" }}>
          <X size={16} />
        </button>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs uppercase tracking-widest font-semibold"
          style={{ color: phase === "result" ? winnerColor : "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif", textShadow: phase === "result" ? `0 0 20px ${winnerColor}80` : "none", transition: "color 0.4s" }}
        >
          {phase === "result" && isItem ? "Drop obtenido" : phase === "result" ? "Créditos obtenidos" : "Abriendo caja..."}
        </motion.p>

        {/* Strip */}
        <div className="w-full max-w-2xl relative">
          {/* Center indicator */}
          <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: "50%", transform: "translateX(-50%)", width: CARD_W + 4, border: `2px solid ${phase === "result" ? winnerColor : "rgba(255,255,255,0.3)"}`, borderRadius: 14, boxShadow: phase === "result" ? `0 0 20px ${winnerColor}40` : "none", transition: "border-color 0.5s, box-shadow 0.5s" }} />
          {/* Arrow */}
          <div className="absolute z-20 pointer-events-none" style={{ left: "50%", top: -10, transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `10px solid ${phase === "result" ? winnerColor : "rgba(255,255,255,0.4)"}`, transition: "border-top-color 0.5s" }} />
          {/* Fades */}
          <div className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none" style={{ width: 80, background: "linear-gradient(to right, #000000, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none" style={{ width: 80, background: "linear-gradient(to left, #000000, transparent)" }} />

          {/* Effect layer (particles/rings centered on strip center) */}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-visible flex items-center justify-center">
            <Particles count={fx.particles} color={winnerColor} active={effectActive} />
            <Rings count={fx.rings} color={winnerColor} active={effectActive} />
            <LightningBolts count={fx.lightningBolts} color={winnerColor} active={effectActive} />
          </div>

          <div ref={containerRef} className="overflow-hidden" style={{ borderRadius: 14 }}>
            <motion.div className="flex" style={{ x: stripX, gap: CARD_GAP }}>
              {strip.map((card, i) => <StripCardEl key={i} card={card} phase={phase} />)}
            </motion.div>
          </div>
        </div>

        {/* Result info */}
        <AnimatePresence>
          {phase === "result" && (
            <motion.div
              key="result-info"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs"
            >
              {isLegendaryPlus && (
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xs uppercase tracking-widest font-bold"
                  style={{ color: winnerColor, fontFamily: "var(--font-syne), Syne, sans-serif", textShadow: `0 0 12px ${winnerColor}` }}
                >
                  ✦ Drop extraordinario ✦
                </motion.p>
              )}

              {isItem ? (
                <div className="text-center">
                  <p className="font-bold text-lg mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>{result.item.name}</p>
                  <RarityText rarity={result.item.rarity as RarityKey} className="text-sm block mb-1" />
                  <p className="text-xs" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#2a2a2a" }}>
                    {result.item.float_value.toFixed(8)} · {getConditionLabel(result.item.float_value)}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold mb-1" style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>+{result.credits_won.toLocaleString("es-AR")} cr.</p>
                </div>
              )}

              <div className="flex gap-3 w-full">
                {onOpenAnother && (
                  <button onClick={() => { setPhase("idle"); setEffectActive(false); onOpenAnother(); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#efefef", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    Abrir otra
                  </button>
                )}
                {isItem ? (
                  <button onClick={() => { onClose(); router.push("/inventario"); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: "#efefef", color: "#000", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    <Package size={14} /> Inventario
                  </button>
                ) : (
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#efefef", color: "#000", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    Cerrar
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
