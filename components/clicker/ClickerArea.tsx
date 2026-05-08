"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useClickerContext } from "./ClickerContext";
import { useProfile } from "@/hooks/useProfile";
import Image from "next/image";
import type { RarityKey } from "@/lib/rarities";
import { RARITIES } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

const LEGENDARY_RARITIES = ["legendario", "extraterrestre", "en_el_ort"];

type EquippedItem = {
  id: string;
  image_url: string;
  name: string;
  rarity: RarityKey;
};

function getRarityGlow(rarity: RarityKey): string {
  const config = RARITIES[rarity];
  return config.gradient ? config.gradient[0] : (config.color ?? "#efefef");
}

function getRarityXpColor(rarity: RarityKey | undefined): string {
  if (!rarity) return "#efefef";
  return getRarityGlow(rarity);
}

function ClickerContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [equippedItem, setEquippedItem] = useState<EquippedItem | null>(null);
  const bonusXpPending = useRef(0);
  const supabase = createClient();

  const { handleClick, isAnimating, lastDrop, localClicks, xpParticles } = useClickerContext();
  const { profile } = useProfile();

  // Fetch equipped item when profile changes
  useEffect(() => {
    async function fetchEquipped() {
      if (!profile?.equipped_chupete_id) { setEquippedItem(null); return; }
      const { data } = await supabase
        .from("inventory")
        .select("id, item:items(name, image_url, rarity)")
        .eq("id", profile.equipped_chupete_id)
        .single();
      if (data?.item) {
        const item = data.item as unknown as { name: string; image_url: string; rarity: string };
        setEquippedItem({ id: data.id, image_url: item.image_url, name: item.name, rarity: item.rarity as RarityKey });
      } else {
        setEquippedItem(null);
      }
    }
    fetchEquipped();
  }, [profile?.equipped_chupete_id, supabase]);

  // Send accumulated bonus XP every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (bonusXpPending.current <= 0) return;
      const toSend = Math.min(bonusXpPending.current, 13);
      bonusXpPending.current = 0;
      try {
        await fetch("/api/bonus-xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bonus_xp: toSend }),
        });
      } catch {}
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

  const isLegendaryPlus = equippedItem && LEGENDARY_RARITIES.includes(equippedItem.rarity);
  const glowColor = equippedItem ? getRarityGlow(equippedItem.rarity) : "rgba(255,255,255,0.3)";
  const xpColor = getRarityXpColor(equippedItem?.rarity);

  const onClickHandler = useCallback((e: React.MouseEvent) => {
    if (!isAuthenticated) return;
    setPulseKey((k) => k + 1);

    // Legendary+ XP bonus: 15% chance of bonus XP
    if (isLegendaryPlus && Math.random() < 0.15) {
      bonusXpPending.current += 13;
    }

    handleClick(e);
  }, [isAuthenticated, isLegendaryPlus, handleClick]);

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
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
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
      <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>

        {/* Rarity ambient glow (legendary+) */}
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
              style={{
                top: p.y,
                left: 0,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                color: xpColor,
                textShadow: `0 0 8px ${xpColor}80`,
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
              ? `drop-shadow(0 0 24px ${glowColor}80)`
              : `drop-shadow(0 4px 24px ${glowColor}30)`,
            transition: "filter 0.2s",
          }}
        >
          <Image
            src={imageUrl}
            alt={imageName}
            width={220}
            height={220}
            priority
            draggable={false}
            style={{
              mixBlendMode: "screen",
              maskImage: equippedItem
                ? "radial-gradient(circle at center, black 45%, transparent 72%)"
                : undefined,
              WebkitMaskImage: equippedItem
                ? "radial-gradient(circle at center, black 45%, transparent 72%)"
                : undefined,
            }}
          />
        </motion.div>

        {/* Overlay for unauthenticated */}
        {!isAuthenticated && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: "rgba(0,0,0,0.75)" }}
          >
            <span className="text-2xl mb-2">🔒</span>
            <p className="text-sm font-semibold text-center px-4" style={{ color: "#efefef" }}>
              Registrate para empezar
            </p>
            <a href="/auth" className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif", textDecoration: "none" }}>
              Crear cuenta
            </a>
          </div>
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
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#2a2a2a" }}>{float.toFixed(6)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ClickerArea() {
  return <ClickerContent />;
}
