"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { InventoryItem } from "@/types/database";
import ItemCard from "./ItemCard";

interface InventoryGridProps {
  items: InventoryItem[];
  isLoading?: boolean;
  onPreview?: (item: InventoryItem) => void;
}

export default function InventoryGrid({ items, isLoading = false, onPreview }: InventoryGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl animate-pulse" style={{ width: 160, height: 220, background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-6xl" style={{ filter: "grayscale(1) opacity(0.3)" }}>🎁</div>
        <div className="text-center">
          <p className="text-base font-semibold mb-1" style={{ color: "#efefef" }}>Tu inventario está vacío</p>
          <p className="text-sm" style={{ color: "#404040" }}>Empezá a clickear para conseguir items.</p>
        </div>
        <a href="/" className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: "#efefef", color: "#000000", fontFamily: "var(--font-syne), Syne, sans-serif", textDecoration: "none" }}>
          Clickear ahora
        </a>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.03, duration: 0.2 }}>
            <ItemCard inventoryItem={item} onPreview={onPreview} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
