"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { InventoryItem } from "@/types/database";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";
import ItemSVG from "@/components/ui/ItemSVG";
interface SellModalProps {
  inventoryItem: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SellModal({
  inventoryItem,
  onClose,
  onSuccess,
}: SellModalProps) {
  const item = inventoryItem?.item ?? null;
  const [price, setPrice] = useState(
    item ? String(item.base_price_ars) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rarity = (item?.rarity ?? "comun") as RarityKey;
  const config = RARITIES[rarity];
  const glowColor = config.gradient
    ? config.gradient[0]
    : (config.color ?? "#3a3a3a");
  const condition = inventoryItem ? getConditionLabel(inventoryItem.float_value) : "";
  const priceNum = parseInt(price.replace(/\D/g, ""), 10) || 0;

  async function handleSell() {
    if (!inventoryItem) return;
    if (priceNum < 1) {
      setError("Ingresá un precio válido.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/create-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_id: inventoryItem.id, price_credits: priceNum }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al publicar.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <AnimatePresence>
      {inventoryItem && item && (
        <>
        {/* Backdrop */}
        <motion.div
          key="sell-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.8)" }}
        />

        {/* Modal */}
        <motion.div
          key="sell-modal"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-6"
          style={{
            background: "#0a0a0a",
            border: `1px solid ${glowColor}30`,
            boxShadow: `0 0 40px ${glowColor}15, 0 20px 60px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-sm"
            style={{ background: "rgba(255,255,255,0.05)", color: "#404040" }}
          >
            <X size={14} className="inline-block" />
          </button>

          <h2
            className="text-lg font-bold mb-4"
            style={{
              color: "#efefef",
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
            Publicar en el Mercado
          </h2>

          {/* Item preview */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${glowColor}15, #080808)`,
                border: `1px solid ${glowColor}30`,
              }}
            >
              <ItemSVG name={item.name} rarity={item.rarity} size={56} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: "#efefef" }}>
                {item.name}
              </p>
              <RarityText rarity={rarity} className="text-xs mb-1" />
              <p
                className="text-[10px]"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: "#3a3a3a",
                }}
              >
                {inventoryItem.float_value.toFixed(8)} · {condition}
              </p>
            </div>
          </div>

          {/* Price input */}
          <div className="mb-4">
            <label className="block text-xs mb-1.5" style={{ color: "#404040" }}>
              Precio en créditos
            </label>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                style={{ color: "#4a9a4a" }}
              >
                cr.
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                placeholder={String(item.base_price_ars)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#efefef",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              />
            </div>
            {priceNum > 0 && (
              <p className="text-xs mt-1" style={{ color: "#2a2a2a" }}>
                Recibís:{" "}
                <span style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {Math.floor(priceNum * 0.95).toLocaleString("es-AR")} cr.
                </span>{" "}
                (tras 5% de comisión)
              </p>
            )}
          </div>

          {error && (
            <p
              className="text-xs mb-4 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,50,50,0.1)",
                color: "#ff6b6b",
                border: "1px solid rgba(255,50,50,0.2)",
              }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#404040",
                border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSell}
              disabled={loading || priceNum < 1}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background:
                  loading || priceNum < 1
                    ? "rgba(239,239,239,0.3)"
                    : "#efefef",
                color: "#000000",
                fontFamily: "var(--font-syne), Syne, sans-serif",
                cursor: loading || priceNum < 1 ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
