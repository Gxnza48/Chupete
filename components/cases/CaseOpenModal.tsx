"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { RARITIES, getConditionLabel } from "@/lib/rarities";
import type { RarityKey } from "@/lib/rarities";
import RarityText from "@/components/ui/RarityText";

export type CaseResult =
  | { type: "item"; item: { id: string; name: string; rarity: string; image_url: string; float_value: number } }
  | { type: "credits"; credits_won: number };

interface CaseOpenModalProps {
  result: CaseResult | null;
  onClose: () => void;
  onOpenAnother?: () => void;
}

export default function CaseOpenModal({ result, onClose, onOpenAnother }: CaseOpenModalProps) {
  const [revealed, setRevealed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!result) { setRevealed(false); return; }
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [result]);

  const isItem = result?.type === "item";
  const item = isItem ? result.item : null;
  const rarity = item?.rarity as RarityKey | undefined;
  const config = rarity ? RARITIES[rarity] : null;
  const glowColor = config?.gradient ? config.gradient[0] : (config?.color ?? "#efefef");
  const isLegendaryPlus = rarity && ["legendario", "extraterrestre", "en_el_ort"].includes(rarity);

  return (
    <AnimatePresence>
      {result && (
        <>
          <motion.div
            key="case-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.95)" }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              key="case-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              style={{
                background: "#080808",
                border: `1px solid ${isItem ? glowColor + "40" : "rgba(74,154,74,0.4)"}`,
                boxShadow: isItem
                  ? `0 0 60px ${glowColor}25, 0 0 120px ${glowColor}10`
                  : "0 0 60px rgba(74,154,74,0.15)",
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.08)", color: "#606060" }}
              >
                <X size={14} />
              </button>

              {/* Opening animation */}
              <AnimatePresence mode="wait">
                {!revealed ? (
                  <motion.div
                    key="opening"
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ rotate: { duration: 0.6, repeat: Infinity, ease: "linear" }, scale: { duration: 0.6, repeat: Infinity } }}
                      className="text-6xl"
                    >
                      📦
                    </motion.div>
                    <p className="text-sm" style={{ color: "#404040", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                      Abriendo...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center pb-6"
                  >
                    {/* Result display */}
                    {isItem && item ? (
                      <>
                        {/* Item image */}
                        <div
                          className="relative w-full flex items-center justify-center py-10"
                          style={{
                            background: `radial-gradient(ellipse at center, ${glowColor}20 0%, transparent 70%)`,
                            minHeight: 200,
                          }}
                        >
                          {isLegendaryPlus && (
                            <motion.div
                              className="absolute inset-0"
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              style={{
                                background: `radial-gradient(ellipse at center, ${glowColor}15 0%, transparent 60%)`,
                              }}
                            />
                          )}
                          {item.image_url ? (
                            <motion.div
                              initial={{ scale: 0.5, rotate: -10 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                            >
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                width={160}
                                height={160}
                                className="object-contain"
                                style={{ mixBlendMode: "screen", filter: `drop-shadow(0 0 20px ${glowColor}60)` }}
                              />
                            </motion.div>
                          ) : (
                            <span className="text-8xl">🎁</span>
                          )}
                        </div>

                        <div className="px-6 text-center">
                          {isLegendaryPlus && (
                            <motion.p
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs uppercase tracking-widest mb-2 font-bold"
                              style={{ color: glowColor }}
                            >
                              ¡Drop extraordinario!
                            </motion.p>
                          )}
                          <h2 className="text-xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                            {item.name}
                          </h2>
                          <RarityText rarity={rarity!} className="text-sm font-semibold mb-2 block" />
                          <p className="text-xs mb-6" style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "#3a3a3a" }}>
                            {item.float_value.toFixed(8)} · {getConditionLabel(item.float_value)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center py-12 px-6 text-center gap-4">
                        <motion.div
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 12 }}
                          className="text-7xl"
                        >
                          💰
                        </motion.div>
                        <div>
                          <p className="text-2xl font-bold mb-1" style={{ color: "#4a9a4a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                            +{(result as { type: "credits"; credits_won: number }).credits_won.toLocaleString("es-AR")} cr.
                          </p>
                          <p className="text-sm" style={{ color: "#404040" }}>¡Créditos recibidos!</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 px-6 w-full">
                      {onOpenAnother && (
                        <button
                          onClick={onOpenAnother}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#efefef", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                        >
                          Abrir otra
                        </button>
                      )}
                      {isItem && (
                        <button
                          onClick={() => { onClose(); router.push("/inventario"); }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                          style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                        >
                          <Package size={14} /> Ver inventario
                        </button>
                      )}
                      {!isItem && (
                        <button
                          onClick={onClose}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                          style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
