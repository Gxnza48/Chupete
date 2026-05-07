"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInventory } from "@/hooks/useInventory";
import InventoryGrid from "@/components/inventory/InventoryGrid";
import { useToast } from "@/components/ui/Toast";
import type { InventoryItem } from "@/types/database";
import { RARITIES, type RarityKey } from "@/lib/rarities";
import ItemPreviewModal from "@/components/inventory/ItemPreviewModal";

const RARITY_FILTER_OPTIONS = [
  { value: "all", label: "Todas las rarezas" },
  { value: "en_el_ort", label: "En el Ort**" },
  { value: "extraterrestre", label: "Extraterrestre" },
  { value: "legendario", label: "Legendario" },
  { value: "ultra_raro", label: "Ultra Raro" },
  { value: "raro", label: "Raro" },
  { value: "medio_raro", label: "Medio Raro" },
  { value: "poco_comun", label: "Poco Común" },
  { value: "comun", label: "Común" },
];

function InventoryContent() {
  const { items, isLoading, refetch } = useInventory();
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);
  const { addToast } = useToast();

  const filtered =
    rarityFilter === "all"
      ? items
      : items.filter((i) => i.item?.rarity === rarityFilter);

  function handleRefetch() {
    refetch();
    addToast({ variant: "default", message: "Inventario actualizado." });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#efefef", fontFamily: "var(--font-syne), Syne, sans-serif" }}>
            Mi Inventario
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#2a2a2a" }}>
            {isLoading ? "Cargando..." : `${items.length} item${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Rarity filter */}
        <div className="relative">
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="appearance-none px-4 pr-8 py-2 rounded-xl text-sm outline-none cursor-pointer"
            style={{
              background: "#060606",
              border: "1px solid rgba(255,255,255,0.08)",
              color: rarityFilter === "all" ? "#404040" : (() => {
                const config = RARITIES[rarityFilter as RarityKey];
                return config.gradient ? config.gradient[0] : (config.color ?? "#efefef");
              })(),
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
          >
            {RARITY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#404040" }}>▾</div>
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "2rem" }} />

      <InventoryGrid items={filtered} isLoading={isLoading} onPreview={setPreviewItem} />

      <ItemPreviewModal
        inventoryItem={previewItem}
        onClose={() => setPreviewItem(null)}
        onRefetch={handleRefetch}
      />
    </div>
  );
}

export default function InventarioPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <InventoryContent />
    </motion.div>
  );
}
