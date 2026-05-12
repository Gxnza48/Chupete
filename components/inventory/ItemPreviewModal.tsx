"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, ShoppingBag, Trash2, Bold, Italic, Check, Zap, DollarSign } from "lucide-react";
import type { InventoryItem } from "@/types/database";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";
import ItemSVG from "@/components/ui/ItemSVG";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import SellModal from "./SellModal";
import { QUICK_SELL_PRICES } from "@/lib/quickSell";

const NICKNAME_COLORS = [
  "#efefef", "#4a9a4a", "#8050d0", "#ff6b6b",
  "#ffaa00", "#00aaff", "#ff1493", "#a0a0a0",
];

interface ItemPreviewModalProps {
  inventoryItem: InventoryItem | null;
  onClose: () => void;
  onRefetch: () => void;
  readOnly?: boolean;
}

export default function ItemPreviewModal({ inventoryItem, onClose, onRefetch, readOnly = false }: ItemPreviewModalProps) {
  const [showInProfile, setShowInProfile] = useState(false);
  const [togglingProfile, setTogglingProfile] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [confirmQuickSell, setConfirmQuickSell] = useState(false);
  const [quickSelling, setQuickSelling] = useState(false);
  const [cancellingListing, setCancellingListing] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const { profile, refetch: refetchProfile } = useProfile();

  // Nickname state
  const [nickname, setNickname] = useState("");
  const [nickBold, setNickBold] = useState(false);
  const [nickItalic, setNickItalic] = useState(false);
  const [nickColor, setNickColor] = useState("#efefef");
  const [savingNick, setSavingNick] = useState(false);
  const [nickSaved, setNickSaved] = useState(false);

  const supabase = createClient();

  const item = inventoryItem?.item ?? null;
  const rarity = (item?.rarity ?? "comun") as RarityKey;
  const config = RARITIES[rarity];
  const glowColor = config.gradient ? config.gradient[0] : (config.color ?? "#3a3a3a");
  const condition = inventoryItem ? getConditionLabel(inventoryItem.float_value) : "";

  useEffect(() => {
    if (!inventoryItem) return;
    setShowInProfile(inventoryItem.show_in_profile ?? false);
    setNickname(inventoryItem.nickname ?? "");
    setNickBold(inventoryItem.nickname_bold ?? false);
    setNickItalic(inventoryItem.nickname_italic ?? false);
    setNickColor(inventoryItem.nickname_color ?? "#efefef");
    setShowSell(false);
    setConfirmTrash(false);
    setConfirmQuickSell(false);
    setNickSaved(false);
  }, [inventoryItem?.id]);

  async function toggleShowInProfile() {
    if (!inventoryItem) return;
    setTogglingProfile(true);
    const newVal = !showInProfile;
    setShowInProfile(newVal);
    await supabase.from("inventory").update({ show_in_profile: newVal }).eq("id", inventoryItem.id);
    setTogglingProfile(false);
    onRefetch();
  }

  async function saveNickname() {
    if (!inventoryItem) return;
    setSavingNick(true);
    await supabase.from("inventory").update({
      nickname: nickname.trim() || null,
      nickname_bold: nickBold,
      nickname_italic: nickItalic,
      nickname_color: nickColor,
    }).eq("id", inventoryItem.id);
    setSavingNick(false);
    setNickSaved(true);
    setTimeout(() => setNickSaved(false), 1500);
    onRefetch();
  }

  const isEquipped = profile?.equipped_chupete_id === inventoryItem?.id;

  async function handleEquip() {
    if (!inventoryItem) return;
    setEquipping(true);
    await fetch("/api/equip-chupete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_id: isEquipped ? null : inventoryItem.id }),
    });
    setEquipping(false);
    refetchProfile();
  }

  async function handleCancelListing() {
    if (!inventoryItem) return;
    setCancellingListing(true);
    await supabase.from("listings").update({ status: "cancelled" }).eq("inventory_id", inventoryItem.id).eq("status", "active");
    await supabase.from("inventory").update({ is_listed: false }).eq("id", inventoryItem.id);
    setCancellingListing(false);
    onRefetch();
    onClose();
  }

  async function handleTrash() {
    if (!inventoryItem) return;
    await supabase.from("inventory").delete().eq("id", inventoryItem.id);
    onRefetch();
    onClose();
  }

  async function handleQuickSell() {
    if (!inventoryItem) return;
    setQuickSelling(true);
    await fetch("/api/quick-sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_id: inventoryItem.id }),
    });
    setQuickSelling(false);
    onRefetch();
    onClose();
  }

  const quickSellPrice = item ? (QUICK_SELL_PRICES[item.rarity] ?? 30) : 0;

  return (
    <>
      <AnimatePresence>
        {inventoryItem && item && !showSell && (
          <>
            <motion.div key="preview-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.88)" }} />
            <motion.div
              key="preview-modal"
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 24 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-xs rounded-2xl overflow-hidden"
              style={{ background: "#0a0a0a", border: `1px solid ${glowColor}35`, boxShadow: `0 0 60px ${glowColor}12, 0 24px 80px rgba(0,0,0,0.95)`, maxHeight: "90vh", overflowY: "auto" }}
            >
              {/* Image area */}
              <div className="relative flex items-center justify-center flex-shrink-0" style={{ height: 180, background: `linear-gradient(135deg, ${glowColor}12 0%, #050505 100%)` }}>
                <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full z-10" style={{ background: "rgba(0,0,0,0.5)", color: "#606060" }}>
                  <X size={14} />
                </button>
                {inventoryItem.is_listed && (
                  <div className="absolute top-3 left-3 text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider z-10" style={{ background: "rgba(255,170,0,0.15)", color: "#ffaa00", border: "1px solid rgba(255,170,0,0.3)" }}>
                    En venta
                  </div>
                )}
                <ItemSVG name={item.name} rarity={item.rarity} size={150} />
              </div>

              {/* Info + actions */}
              <div className="p-5">
                {/* Nickname preview */}
                {(inventoryItem.nickname || nickname) && (
                  <p className="text-xs mb-1" style={{ color: nickColor, fontWeight: nickBold ? "bold" : "normal", fontStyle: nickItalic ? "italic" : "normal", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    {nickname || inventoryItem.nickname}
                  </p>
                )}

                <h3 className="text-lg font-bold mb-0.5 leading-tight" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {item.name}
                </h3>
                <RarityText rarity={rarity} className="text-xs font-semibold mb-3 block" />

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#3a3a3a" }}>{inventoryItem.float_value.toFixed(8)}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#404040" }}>{condition}</span>
                </div>

                {/* Durability bar */}
                {inventoryItem.durability != null && inventoryItem.max_durability != null && (
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px]" style={{ color: "#3a3a3a" }}>Durabilidad</span>
                      <span className="text-[10px]" style={{ color: "#3a3a3a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                        {inventoryItem.durability}/{inventoryItem.max_durability}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(0, (inventoryItem.durability / inventoryItem.max_durability) * 100)}%`,
                          background: inventoryItem.durability / inventoryItem.max_durability > 0.5
                            ? "#4a9a4a"
                            : inventoryItem.durability / inventoryItem.max_durability > 0.2
                            ? "#ffaa00"
                            : "#ff6b6b",
                        }}
                      />
                    </div>
                  </div>
                )}

                {!readOnly && (
                  <div className="flex flex-col gap-2">
                    {/* Nickname editor */}
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Apodo</p>

                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                        placeholder="Poné un apodo..."
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none mb-2"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif", fontWeight: nickBold ? "bold" : "normal", fontStyle: nickItalic ? "italic" : "normal" }}
                      />

                      {/* Format toggles */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setNickBold(!nickBold)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                          style={{ background: nickBold ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${nickBold ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`, color: nickBold ? "#efefef" : "#404040" }}
                        >
                          <Bold size={12} />
                        </button>
                        <button
                          onClick={() => setNickItalic(!nickItalic)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                          style={{ background: nickItalic ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${nickItalic ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`, color: nickItalic ? "#efefef" : "#404040" }}
                        >
                          <Italic size={12} />
                        </button>
                        <div className="flex gap-1 ml-1 flex-wrap">
                          {NICKNAME_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setNickColor(c)}
                              className="w-4 h-4 rounded-full transition-all"
                              style={{ background: c, outline: nickColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px", opacity: nickColor === c ? 1 : 0.5 }}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={saveNickname}
                        disabled={savingNick}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: nickSaved ? "rgba(74,154,74,0.15)" : "rgba(255,255,255,0.06)", color: nickSaved ? "#4a9a4a" : "#efefef", border: `1px solid ${nickSaved ? "rgba(74,154,74,0.3)" : "rgba(255,255,255,0.1)"}`, fontFamily: "var(--font-syne), Syne, sans-serif" }}
                      >
                        {nickSaved ? <><Check size={11} /> Guardado</> : savingNick ? "Guardando..." : "Guardar apodo"}
                      </button>
                    </div>

                    {/* Show in profile toggle */}
                    <button
                      onClick={toggleShowInProfile}
                      disabled={togglingProfile}
                      className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all"
                      style={{ background: showInProfile ? "rgba(74,154,74,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${showInProfile ? "rgba(74,154,74,0.3)" : "rgba(255,255,255,0.07)"}` }}
                    >
                      <div className="flex items-center gap-2">
                        {showInProfile ? <Eye size={14} style={{ color: "#4a9a4a" }} /> : <EyeOff size={14} style={{ color: "#404040" }} />}
                        <span className="text-xs font-medium" style={{ color: showInProfile ? "#4a9a4a" : "#404040", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                          {showInProfile ? "Visible en perfil" : "Oculto en perfil"}
                        </span>
                      </div>
                      <div className="w-8 h-4 rounded-full relative transition-all" style={{ background: showInProfile ? "rgba(74,154,74,0.4)" : "rgba(255,255,255,0.1)" }}>
                        <div className="absolute top-0.5 w-3 h-3 rounded-full transition-all" style={{ background: showInProfile ? "#4a9a4a" : "#404040", left: showInProfile ? "17px" : "2px" }} />
                      </div>
                    </button>

                    {/* Equip as clicker */}
                    {!inventoryItem.is_listed && (
                      <button
                        onClick={handleEquip}
                        disabled={equipping}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: isEquipped ? "rgba(74,154,74,0.1)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isEquipped ? "rgba(74,154,74,0.35)" : "rgba(255,255,255,0.08)"}`,
                          color: isEquipped ? "#4a9a4a" : "#efefef",
                          fontFamily: "var(--font-syne), Syne, sans-serif",
                        }}
                      >
                        <Zap size={13} />
                        {equipping ? "..." : isEquipped ? "Desequipar clicker" : "Equipar como clicker"}
                      </button>
                    )}

                    {/* Quick sell */}
                    {!inventoryItem.is_listed && (
                      confirmQuickSell ? (
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmQuickSell(false)} className="flex-1 py-2 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "#404040", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Cancelar</button>
                          <button onClick={handleQuickSell} disabled={quickSelling} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(74,154,74,0.12)", color: "#4a9a4a", border: "1px solid rgba(74,154,74,0.3)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                            {quickSelling ? "..." : `Vender por ${quickSellPrice.toLocaleString("es-AR")} cr.`}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmQuickSell(true)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(74,154,74,0.07)", border: "1px solid rgba(74,154,74,0.2)", color: "#4a9a4a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                          <DollarSign size={13} /> Venta rápida — {quickSellPrice.toLocaleString("es-AR")} cr.
                        </button>
                      )
                    )}

                    {/* Sell / Cancel */}
                    {inventoryItem.is_listed ? (
                      <button onClick={handleCancelListing} disabled={cancellingListing} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)", color: "#ffaa00", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                        <ShoppingBag size={13} /> {cancellingListing ? "Cancelando..." : "Cancelar publicación"}
                      </button>
                    ) : (
                      <button onClick={() => setShowSell(true)} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                        <ShoppingBag size={13} /> Poner en venta
                      </button>
                    )}

                    {/* Trash */}
                    {!inventoryItem.is_listed && (
                      confirmTrash ? (
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmTrash(false)} className="flex-1 py-2 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "#404040", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Cancelar</button>
                          <button onClick={handleTrash} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(255,50,50,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.25)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Sí, tirar</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmTrash(true)} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs" style={{ color: "#2a2a2a", border: "1px solid rgba(255,255,255,0.04)", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                          <Trash2 size={12} /> Tirar
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!readOnly && (
        <SellModal inventoryItem={showSell ? inventoryItem : null} onClose={() => setShowSell(false)} onSuccess={() => { setShowSell(false); onRefetch(); onClose(); }} />
      )}
    </>
  );
}
