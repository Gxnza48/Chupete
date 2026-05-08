"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Check, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ShopItem, ProfileCosmetic } from "@/types/database";
import { useProfile } from "@/hooks/useProfile";

const FRAME_STYLES: Record<string, React.CSSProperties> = {
  gold:    { border: "2px solid #ffaa00", boxShadow: "0 0 12px #ffaa0060" },
  neon:    { border: "2px solid #4a9a4a", boxShadow: "0 0 12px #4a9a4a60" },
  void:    { border: "2px solid #8050d0", boxShadow: "0 0 16px #8050d080" },
  plasma:  {},
  blood:   {},
  rainbow: {},
};

const FRAME_CLASSES: Record<string, string> = {
  plasma:  "frame-plasma frame-glint",
  blood:   "frame-blood frame-glint",
  rainbow: "frame-rainbow frame-glint",
};

const FRAME_ICONS: Record<string, string> = {
  gold: "★", neon: "◈", void: "◆", plasma: "◉", blood: "◆", rainbow: "◈",
};

const EFFECT_ICONS: Record<string, string> = {
  effect_stars: "✦", effect_fire: "◈", effect_bubbles: "○",
};

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<ProfileCosmetic[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [tab, setTab] = useState<"charm" | "frame" | "effect">("charm");
  const { profile, refetch } = useProfile();
  const supabase = createClient();

  const fetchShop = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: shopData }, { data: ownedData }] = await Promise.all([
      supabase.from("shop_items").select("*").order("price_credits"),
      supabase.from("profile_cosmetics").select("*, shop_item:shop_items(*)").eq("user_id", user.id),
    ]);

    if (shopData) setItems(shopData as ShopItem[]);
    if (ownedData) setOwned(ownedData as ProfileCosmetic[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isOpen) fetchShop();
  }, [isOpen, fetchShop]);

  const ownedIds = new Set(owned.map((o) => o.shop_item_id));
  const equippedIds = new Set(owned.filter((o) => o.equipped).map((o) => o.shop_item_id));

  async function handleBuy(item: ShopItem) {
    if (!profile) return;
    if ((profile.credits ?? 0) < item.price_credits) return;
    setBuying(item.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBuying(null); return; }

    await supabase.from("profile_cosmetics").insert({ user_id: user.id, shop_item_id: item.id, equipped: false });
    await supabase.from("profiles").update({ credits: (profile.credits ?? 0) - item.price_credits }).eq("id", user.id);
    await supabase.from("credit_transactions").insert({ user_id: user.id, amount: -item.price_credits, reason: "shop_purchase", ref_id: item.key });

    setBuying(null);
    fetchShop();
    refetch();
  }

  async function handleEquip(cosmetic: ProfileCosmetic) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEquipping(cosmetic.shop_item_id);

    const shopItem = items.find((i) => i.id === cosmetic.shop_item_id);
    if (!shopItem) { setEquipping(null); return; }

    if (shopItem.type === "frame") {
      // Unequip all frames first
      const frameIds = owned.filter((o) => {
        const si = items.find((i) => i.id === o.shop_item_id);
        return si?.type === "frame";
      }).map((o) => o.shop_item_id);

      for (const fid of frameIds) {
        await supabase.from("profile_cosmetics").update({ equipped: false }).eq("user_id", user.id).eq("shop_item_id", fid);
      }

      const isCurrentlyEquipped = equippedIds.has(cosmetic.shop_item_id);
      await supabase.from("profile_cosmetics").update({ equipped: !isCurrentlyEquipped }).eq("user_id", user.id).eq("shop_item_id", cosmetic.shop_item_id);
    } else {
      // Charms: max 3 equipped
      const equippedCharms = owned.filter((o) => {
        const si = items.find((i) => i.id === o.shop_item_id);
        return si?.type === "charm" && o.equipped;
      });
      const isCurrentlyEquipped = equippedIds.has(cosmetic.shop_item_id);

      if (!isCurrentlyEquipped && equippedCharms.length >= 3) {
        setEquipping(null);
        return;
      }
      await supabase.from("profile_cosmetics").update({ equipped: !isCurrentlyEquipped }).eq("user_id", user.id).eq("shop_item_id", cosmetic.shop_item_id);
    }

    setEquipping(null);
    fetchShop();
  }

  const filtered = items.filter((i) => {
    if (tab === "effect") return i.type === "charm" && i.key.startsWith("effect_");
    if (tab === "charm")  return i.type === "charm" && !i.key.startsWith("effect_");
    return i.type === "frame";
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="shop-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.85)" }} />
          <motion.div
            key="shop-modal"
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 80px rgba(0,0,0,0.95)", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  Tienda
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {(profile?.credits ?? 0).toLocaleString("es-AR")} cr. disponibles
                </p>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#404040" }}>
                <X size={14} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex mx-5 mb-4 rounded-lg p-0.5 flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
              {(["charm", "frame", "effect"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{ background: tab === t ? "#efefef" : "transparent", color: tab === t ? "#000" : "#404040", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                >
                  {t === "charm" ? "Charms" : t === "frame" ? "Marcos" : "Efectos"}
                </button>
              ))}
            </div>

            {tab === "charm" && (
              <p className="text-[10px] text-center mb-3 flex-shrink-0" style={{ color: "#2a2a2a" }}>
                Máx. {3 - owned.filter((o) => { const si = items.find((i) => i.id === o.shop_item_id); return si?.type === "charm" && !si.key.startsWith("effect_") && o.equipped; }).length}/3 equipados
              </p>
            )}

            {/* Items grid */}
            <div className="overflow-y-auto px-5 pb-5 flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#efefef" }} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((shopItem) => {
                    const isOwned = ownedIds.has(shopItem.id);
                    const isEquipped = equippedIds.has(shopItem.id);
                    const canAfford = (profile?.credits ?? 0) >= shopItem.price_credits;
                    const ownedCosmetic = owned.find((o) => o.shop_item_id === shopItem.id);

                    return (
                      <div
                        key={shopItem.id}
                        className="rounded-xl p-3 flex flex-col gap-2"
                        style={{
                          background: isEquipped ? "rgba(74,154,74,0.08)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isEquipped ? "rgba(74,154,74,0.3)" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        {/* Icon preview */}
                        <div className="flex items-center justify-center h-14">
                          {shopItem.type === "frame" ? (
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold${FRAME_CLASSES[shopItem.icon] ? ` ${FRAME_CLASSES[shopItem.icon]}` : ""}`}
                              style={{ background: "#1a1a1a", ...(FRAME_STYLES[shopItem.icon] ?? {}), color: "#efefef" }}
                            >
                              {FRAME_ICONS[shopItem.icon] ?? "◆"}
                            </div>
                          ) : shopItem.key.startsWith("effect_") ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-2xl">{EFFECT_ICONS[shopItem.key] ?? shopItem.icon}</span>
                              <span className="text-[8px] uppercase tracking-wider" style={{ color: "#404040" }}>Partículas</span>
                            </div>
                          ) : (
                            <span className="text-3xl">{shopItem.icon}</span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-center" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                          {shopItem.name}
                        </p>

                        <p className="text-[9px] text-center leading-relaxed" style={{ color: "#2a2a2a" }}>
                          {shopItem.description}
                        </p>

                        {isOwned ? (
                          <button
                            onClick={() => ownedCosmetic && handleEquip(ownedCosmetic)}
                            disabled={equipping === shopItem.id}
                            className="w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"
                            style={{
                              background: isEquipped ? "rgba(74,154,74,0.15)" : "rgba(255,255,255,0.06)",
                              color: isEquipped ? "#4a9a4a" : "#efefef",
                              border: `1px solid ${isEquipped ? "rgba(74,154,74,0.3)" : "rgba(255,255,255,0.1)"}`,
                              fontFamily: "var(--font-syne), Syne, sans-serif",
                            }}
                          >
                            {isEquipped ? <><Check size={10} /> Equipado</> : "Equipar"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuy(shopItem)}
                            disabled={buying === shopItem.id || !canAfford}
                            className="w-full py-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"
                            style={{
                              background: canAfford ? "rgba(255,255,255,0.08)" : "transparent",
                              color: canAfford ? "#efefef" : "#2a2a2a",
                              border: `1px solid ${canAfford ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                              fontFamily: "var(--font-jetbrains-mono), monospace",
                              cursor: canAfford ? "pointer" : "not-allowed",
                            }}
                          >
                            {buying === shopItem.id ? "..." : !canAfford ? <><Lock size={9} /> {shopItem.price_credits.toLocaleString("es-AR")}</> : <><ShoppingBag size={10} /> {shopItem.price_credits.toLocaleString("es-AR")} cr.</>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
