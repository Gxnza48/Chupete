"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import type { Profile, ProfileCosmetic, ShopItem } from "@/types/database";
import { calculateLevel, levelProgress } from "@/lib/xp";
import EditUsernameModal from "./EditUsernameModal";
import ProfileCustomizer from "./ProfileCustomizer";
import ShopModal from "./ShopModal";
import { createClient } from "@/lib/supabase/client";
import { formatNum } from "@/lib/format";

interface ProfileHeaderProps {
  profile: Profile;
  itemCount?: number;
  isOwner?: boolean;
}

const FRAME_STYLES: Record<string, React.CSSProperties> = {
  gold:    { border: "2px solid #ffaa00", boxShadow: "0 0 12px #ffaa0060" },
  neon:    { border: "2px solid #4a9a4a", boxShadow: "0 0 12px #4a9a4a60" },
  void:    { border: "2px solid #8050d0", boxShadow: "0 0 16px #8050d080" },
  // new frames applied via className — styles below are fallback
  plasma:  {},
  blood:   {},
  rainbow: {},
};

const FRAME_CLASSES: Record<string, string> = {
  plasma:  "frame-plasma frame-glint",
  blood:   "frame-blood frame-glint",
  rainbow: "frame-rainbow frame-glint",
};

function getLevelAvatarStyle(level: number, hasFrame: boolean): { borderStyle: React.CSSProperties; className: string } {
  if (hasFrame) return { borderStyle: {}, className: "" };
  if (level >= 100) return { borderStyle: {}, className: "frame-rainbow frame-glint" };
  if (level >= 50) return { borderStyle: {}, className: "frame-plasma" };
  if (level >= 25) return { borderStyle: { border: "2px solid #c8952a", boxShadow: "0 0 14px #c8952a70" }, className: "" };
  if (level >= 10) return { borderStyle: { border: "2px solid #4a9a4a", boxShadow: "0 0 10px #4a9a4a50" }, className: "" };
  return { borderStyle: { border: "2px solid rgba(255,255,255,0.1)" }, className: "" };
}

function getLevelBadgeStyle(level: number): React.CSSProperties {
  if (level >= 100) return { background: "linear-gradient(135deg, #ff4444, #ff8800)", color: "#fff", fontWeight: "bold" };
  if (level >= 50)  return { background: "#8050d0", color: "#fff", boxShadow: "0 0 8px #8050d060" };
  if (level >= 25)  return { background: "#c8952a", color: "#fff", boxShadow: "0 0 6px #c8952a60" };
  if (level >= 10)  return { background: "#4a9a4a", color: "#fff" };
  return { background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)", color: "#efefef" };
}

export default function ProfileHeader({ profile, itemCount = 0, isOwner = false }: ProfileHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [equippedCharms, setEquippedCharms] = useState<(ProfileCosmetic & { shop_item?: ShopItem })[]>([]);
  const [equippedFrame, setEquippedFrame] = useState<string | null>(null);
  const supabase = createClient();
  const { level, xpInLevel, xpNeeded } = calculateLevel(profile.xp);
  const progress = levelProgress(profile.xp);

  const fetchCosmetics = useCallback(async () => {
    const { data } = await supabase
      .from("profile_cosmetics")
      .select("*, shop_item:shop_items(*)")
      .eq("user_id", profile.id)
      .eq("equipped", true);
    if (!data) return;
    const charms = data.filter((c) => c.shop_item?.type === "charm");
    const frame = data.find((c) => c.shop_item?.type === "frame");
    setEquippedCharms(charms as (ProfileCosmetic & { shop_item?: ShopItem })[]);
    setEquippedFrame(frame?.shop_item?.icon ?? null);
  }, [supabase, profile.id]);

  useEffect(() => { fetchCosmetics(); }, [fetchCosmetics]);

  const bannerBg = profile.banner_color
    ? `linear-gradient(135deg, ${profile.banner_color} 0%, #060606 100%)`
    : "linear-gradient(135deg, #111 0%, #060606 100%)";

  const usernameColor = profile.username_color ?? "#efefef";

  const hasEquippedFrame = !!equippedFrame;
  const { borderStyle, className: levelClass } = getLevelAvatarStyle(level, hasEquippedFrame);
  const badgeStyle = getLevelBadgeStyle(level);
  const avatarClass = equippedFrame && FRAME_CLASSES[equippedFrame]
    ? FRAME_CLASSES[equippedFrame]
    : levelClass;
  const avatarBorderStyle = equippedFrame
    ? (FRAME_STYLES[equippedFrame] ?? {})
    : borderStyle;

  // Only non-effect charms shown on avatar (effects are particles)
  const decorCharms = equippedCharms.filter((c) => !c.shop_item?.key?.startsWith("effect_"));

  return (
    <div className="flex flex-col items-center gap-6 py-8" style={{ background: bannerBg, borderRadius: "inherit" }}>
      {/* Avatar */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <div
          className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center${avatarClass ? ` ${avatarClass}` : ""}`}
          style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #060606 100%)", ...avatarBorderStyle }}
        >
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl select-none" style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)", color: "#404040" }}>
              {profile.username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Level badge */}
        <div
          className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-xs font-bold"
          style={{ fontFamily: "var(--font-jetbrains-mono), monospace", ...badgeStyle }}
        >
          Nv.{level}
        </div>

        {/* First charm — top-right corner of avatar */}
        {decorCharms[0]?.shop_item?.icon && (
          <div
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-base"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            title={decorCharms[0].shop_item.name}
          >
            {decorCharms[0].shop_item.icon}
          </div>
        )}
      </motion.div>

      {/* Username */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-3xl font-bold" style={{ color: usernameColor, fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            {profile.username}
          </h1>
          {isOwner && (
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.05)", color: "#404040", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
            >
              editar
            </button>
          )}
        </div>
        <EditUsernameModal currentUsername={profile.username} isOpen={editOpen} onClose={() => setEditOpen(false)} />

        {/* Extra charms (2nd, 3rd) shown as small pills under username */}
        {decorCharms.length > 1 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {decorCharms.slice(1).map((c) => (
              <span key={c.shop_item_id} className="text-sm" title={c.shop_item?.name}>
                {c.shop_item?.icon}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs mt-1" style={{ color: "#404040" }}>
          Miembro desde {new Date(profile.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long" })}
        </p>
      </div>

      {/* XP Bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "#404040" }}>
          <span>XP</span>
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {xpInLevel.toLocaleString("es-AR")} / {xpNeeded.toLocaleString("es-AR")}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: profile.username_color ? `${profile.username_color}80` : "rgba(255,255,255,0.4)" }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6">
        <Stat label="Clicks" value={formatNum(profile.total_clicks)} />
        <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.07)" }} />
        <Stat label="Items" value={formatNum(itemCount)} />
        <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.07)" }} />
        <Stat label="Nivel" value={String(level)} />
        {isOwner && profile.credits !== undefined && (
          <>
            <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.07)" }} />
            <Stat label="Créditos" value={formatNum(profile.credits)} />
          </>
        )}
      </div>

      {/* Customizer + Shop (owner only) */}
      {isOwner && (
        <div className="w-full max-w-xs">
          <button
            onClick={() => setShopOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold mb-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}
          >
            <ShoppingBag size={13} /> Tienda de perfil
          </button>
          <ProfileCustomizer profile={profile} />
        </div>
      )}

      <ShopModal isOpen={shopOpen} onClose={() => { setShopOpen(false); fetchCosmetics(); }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold mb-0.5" style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest" style={{ color: "#606060" }}>{label}</p>
    </div>
  );
}
