"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { useInventory } from "@/hooks/useInventory";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { playCraftSuccess, playCraftFail } from "@/lib/sounds";
import type { RarityType } from "@/types/database";
import { RARITIES, type RarityKey } from "@/lib/rarities";
import { getCraftOutcome } from "@/lib/craft";
import RarityText from "@/components/ui/RarityText";
import type { InventoryItem } from "@/types/database";

type CraftResult = {
  success: boolean;
  result_rarity: RarityKey;
  total_value: number;
  item: { name: string; rarity: string; image_url: string; float_value: number; inventory_id?: string };
};

function getRarityColor(rarity: RarityKey): string {
  const cfg = RARITIES[rarity];
  return cfg.gradient ? cfg.gradient[0] : (cfg.color ?? "#3a3a3a");
}

export default function CrafteoPage() {
  const { items, isLoading, refetch } = useInventory();
  const { refetch: refetchProfile } = useProfile();
  const { addToast } = useToast();
  const [selected, setSelected] = useState<InventoryItem[]>([]);
  const [crafting, setCrafting] = useState(false);
  const [result, setResult] = useState<CraftResult | null>(null);
  const [search, setSearch] = useState("");

  const available = items.filter((i) => !i.is_listed && !selected.find((s) => s.id === i.id));
  const filtered = available.filter((i) => !search || i.item?.name?.toLowerCase().includes(search.toLowerCase()));

  const totalValue = selected.reduce((s, inv) => s + (inv.item?.base_price_ars ?? 0), 0);
  const outcome = selected.length >= 2 ? getCraftOutcome(totalValue) : null;

  function toggleSelect(inv: InventoryItem) {
    if (selected.find((s) => s.id === inv.id)) {
      setSelected(selected.filter((s) => s.id !== inv.id));
    } else if (selected.length < 5) {
      setSelected([...selected, inv]);
    }
  }

  async function handleCraft() {
    if (selected.length < 2 || crafting) return;
    setCrafting(true);
    setResult(null);

    const res = await fetch("/api/craft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_ids: selected.map((i) => i.id) }),
    });
    const data = await res.json() as CraftResult;

    setTimeout(() => {
      setCrafting(false);
      setResult(data);
      setSelected([]);
      if (data.success && data.item) {
        playCraftSuccess();
        addToast({
          variant: "drop",
          drop: {
            item: {
              id: "",
              name: data.item.name,
              rarity: data.item.rarity as RarityType,
              description: null,
              image_url: data.item.image_url,
              base_price_ars: 0,
              created_at: "",
            },
            float_value: data.item.float_value,
            rarity: data.item.rarity as RarityType,
            isNewRecord: false,
            inventory_id: data.item.inventory_id ?? "",
          },
        });
      } else {
        playCraftFail();
      }
      refetch();
      refetchProfile();
    }, 1500);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#000000" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
          Crafteo
        </h1>
        <p className="text-sm" style={{ color: "#2a2a2a" }}>
          Combiná 2 a 5 chupetes para intentar obtener uno mejor. Nunca garantizado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory */}
        <div className="rounded-2xl p-4" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            Tu inventario ({selected.length}/5 seleccionados)
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full px-3 py-2 rounded-xl text-xs mb-3 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}
          />
          <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
            {isLoading && <p className="text-xs w-full text-center py-4" style={{ color: "#2a2a2a" }}>Cargando...</p>}
            {!isLoading && filtered.length === 0 && <p className="text-xs w-full text-center py-4" style={{ color: "#2a2a2a" }}>Sin items disponibles.</p>}
            {filtered.map((inv) => {
              const rarity = inv.item?.rarity as RarityKey;
              const color = getRarityColor(rarity);
              const canSelect = selected.length < 5;
              return (
                <button
                  key={inv.id}
                  onClick={() => canSelect ? toggleSelect(inv) : undefined}
                  disabled={!canSelect}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all"
                  style={{
                    width: 72, flexShrink: 0,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    opacity: !canSelect ? 0.4 : 1,
                    cursor: !canSelect ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {inv.item?.image_url
                      ? <Image src={inv.item.image_url} alt={inv.item.name} width={40} height={40} className="object-contain" style={{ mixBlendMode: "screen" }} />
                      : <span className="text-xl">🎁</span>}
                  </div>
                  <p className="text-[9px] leading-tight truncate w-full" style={{ color: "#a0a0a0", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                    {inv.item?.name}
                  </p>
                  <RarityText rarity={rarity} className="text-[8px]" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipe + result */}
        <div className="flex flex-col gap-4">
          {/* Selected items */}
          <div className="rounded-2xl p-4" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Combo</p>
            <div className="flex gap-2 flex-wrap min-h-[72px]">
              {selected.map((inv) => {
                const rarity = inv.item?.rarity as RarityKey;
                const color = getRarityColor(rarity);
                return (
                  <div key={inv.id} className="relative">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ width: 68, background: `${color}12`, border: `1px solid ${color}30` }}>
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        {inv.item?.image_url
                          ? <Image src={inv.item.image_url} alt={inv.item.name} width={36} height={36} className="object-contain" style={{ mixBlendMode: "screen" }} />
                          : <span className="text-lg">🎁</span>}
                      </div>
                      <p className="text-[9px] truncate w-full text-center" style={{ color: "#a0a0a0" }}>{inv.item?.name}</p>
                    </div>
                    <button
                      onClick={() => setSelected(selected.filter((s) => s.id !== inv.id))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#606060" }}
                    >
                      <X size={9} />
                    </button>
                  </div>
                );
              })}
              {selected.length === 0 && (
                <p className="text-xs self-center w-full text-center" style={{ color: "#2a2a2a" }}>
                  Seleccioná items del inventario
                </p>
              )}
            </div>

            {/* Outcome prediction */}
            {outcome && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs mb-1" style={{ color: "#3a3a3a" }}>
                  Valor combinado:{" "}
                  <span style={{ color: "#efefef", fontFamily: "var(--font-jetbrains-mono), monospace" }}>{totalValue.toLocaleString("es-AR")} cr.</span>
                </p>
                <p className="text-xs" style={{ color: "#3a3a3a" }}>
                  Posible resultado:{" "}
                  <span style={{ color: getRarityColor(outcome.floorRarity) }}>{RARITIES[outcome.floorRarity].label}</span>
                  {" → "}
                  <span style={{ color: getRarityColor(outcome.targetRarity) }}>{RARITIES[outcome.targetRarity].label}</span>
                </p>
                <p className="text-xs mt-1" style={{ color: "#3a3a3a" }}>
                  Éxito: <span className="font-bold" style={{ color: "#ffaa00" }}>{(outcome.successRate * 100).toFixed(0)}%</span>
                  <span className="ml-2" style={{ color: "#2a2a2a" }}>— siempre hay azar.</span>
                </p>
              </div>
            )}
          </div>

          {/* Craft button */}
          {selected.length >= 2 && !crafting && !result && (
            <button
              onClick={handleCraft}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
              style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif" }}
            >
              Craftear
            </button>
          )}

          {crafting && (
            <div className="rounded-2xl p-8 flex flex-col items-center gap-3" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "#efefef" }} />
              <p className="text-sm" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>Crafteando...</p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: result.success ? "rgba(74,154,74,0.08)" : "rgba(255,170,0,0.06)",
                  border: `1px solid ${result.success ? "rgba(74,154,74,0.3)" : "rgba(255,170,0,0.2)"}`,
                }}
              >
                <p className="text-3xl mb-2">{result.success ? "✨" : "🌀"}</p>
                <p className="text-base font-bold mb-1" style={{ color: result.success ? "#4a9a4a" : "#ffaa00", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                  {result.success ? "¡Craft exitoso!" : "Craft terminado"}
                </p>
                <p className="text-sm" style={{ color: "#efefef" }}>{result.item.name}</p>
                <RarityText rarity={result.item.rarity as RarityKey} className="text-xs mt-0.5 block" />
                <button
                  onClick={() => setResult(null)}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#efefef", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-syne), Syne, sans-serif" }}
                >
                  Volver a craftear
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!selected.length && !result && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="text-4xl mb-3">🔨</p>
              <p className="text-sm" style={{ color: "#2a2a2a", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
                Seleccioná 2 a 5 items para combinar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
