"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { CreditCard, X, CheckCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Listing } from "@/types/database";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";

function formatCredits(n: number) {
  return n.toLocaleString("es-AR") + " cr.";
}

interface BuyModalProps {
  listing: Listing | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuyModal({ listing, onClose, onSuccess }: BuyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bought, setBought] = useState(false);
  const { profile, refetch } = useProfile();
  const { addToast } = useToast();
  const router = useRouter();

  async function handleBuy() {
    if (!listing) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/market-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listing.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al comprar.");
      await refetch();
      onSuccess();
      setBought(true);

      // Drop toast — same as clicker drop notification
      const item = listing.inventory?.item;
      if (item) {
        addToast({
          variant: "drop",
          drop: {
            item,
            float_value: listing.inventory?.float_value ?? 0,
            rarity: item.rarity,
            isNewRecord: false,
            inventory_id: listing.inventory_id,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setBought(false);
    onClose();
  }

  const item = listing?.inventory?.item;
  const rarity = item?.rarity as RarityKey | undefined;
  const config = rarity ? RARITIES[rarity] : null;
  const glowColor = config?.gradient ? config.gradient[0] : (config?.color ?? "#3a3a3a");
  const price = listing?.price_credits ?? listing?.price_ars ?? 0;
  const fee = Math.ceil(price * 0.05);
  const sellerReceives = price - fee;
  const canAfford = (profile?.credits ?? 0) >= price;

  return (
    <AnimatePresence>
      {listing && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.8)" }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4 rounded-2xl p-6"
            style={{
              background: "#0a0a0a",
              border: `1px solid ${bought ? "rgba(74,154,74,0.4)" : glowColor + "30"}`,
              boxShadow: `0 0 40px ${bought ? "rgba(74,154,74,0.1)" : glowColor + "15"}, 0 20px 60px rgba(0,0,0,0.8)`,
            }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.05)", color: "#404040" }}
            >
              <X size={14} />
            </button>

            {/* Success screen */}
            {bought && (
              <div className="flex flex-col items-center text-center py-4 gap-4">
                <CheckCircle size={40} style={{ color: "#4a9a4a" }} />
                <div>
                  <p className="text-base font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    ¡Compra exitosa!
                  </p>
                  <p className="text-sm" style={{ color: "#404040" }}>
                    El item ya está en tu inventario.
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#404040", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                  >
                    Seguir
                  </button>
                  <button
                    onClick={() => { handleClose(); router.push("/inventario"); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                  >
                    <Package size={14} /> Ver inventario
                  </button>
                </div>
              </div>
            )}

            {!bought && (<>

            <h2 className="text-lg font-bold mb-4" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
              Confirmar compra
            </h2>

            {item && (
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${glowColor}15, #080808)`, border: `1px solid ${glowColor}30` }}
                >
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.name} width={64} height={64} className="object-contain" style={{ mixBlendMode: "screen" }} />
                  ) : (
                    <span className="text-3xl">🎁</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-0.5" style={{ color: "#efefef" }}>{item.name}</p>
                  {rarity && <RarityText rarity={rarity} className="text-xs mb-1" />}
                  {listing?.inventory && (
                    <p className="text-xs" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#3a3a3a" }}>
                      {listing.inventory.float_value.toFixed(8)}<br />
                      <span style={{ color: "#404040" }}>{getConditionLabel(listing.inventory.float_value)}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Price breakdown */}
            <div className="rounded-xl p-4 mb-4 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#404040" }}>Precio</span>
                <span style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{formatCredits(price)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#2a2a2a" }}>Comisión (5%)</span>
                <span style={{ color: "#2a2a2a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>−{formatCredits(fee)}</span>
              </div>
              <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
              <div className="flex justify-between font-bold text-sm">
                <span style={{ color: "#efefef" }}>Vendedor recibe</span>
                <span style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{formatCredits(sellerReceives)}</span>
              </div>
            </div>

            {/* Buyer balance */}
            <div className="flex justify-between text-xs mb-4 px-1">
              <span style={{ color: "#2a2a2a" }}>Tus créditos</span>
              <span style={{ color: canAfford ? "#4a9a4a" : "#ff6b6b", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                {formatCredits(profile?.credits ?? 0)}
              </span>
            </div>

            {(error || (!canAfford && !error)) && (
              <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: "rgba(255,50,50,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,50,50,0.2)" }}>
                {error ?? "No tenés suficientes créditos."}
              </p>
            )}

            <button
              onClick={handleBuy}
              disabled={loading || !canAfford}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: loading || !canAfford ? "rgba(255,255,255,0.06)" : "#efefef",
                color: loading || !canAfford ? "#404040" : "#000000",
                cursor: loading || !canAfford ? "not-allowed" : "pointer",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
            >
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#efefef" }} /> Procesando...</>
              ) : (
                <><CreditCard size={16} /> Comprar con créditos</>
              )}
            </button>
            </>)}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
