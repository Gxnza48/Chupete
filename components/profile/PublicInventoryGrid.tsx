"use client";

import { useState } from "react";
import type { InventoryItem } from "@/types/database";
import InventoryGrid from "@/components/inventory/InventoryGrid";
import ItemPreviewModal from "@/components/inventory/ItemPreviewModal";

interface PublicInventoryGridProps {
  items: InventoryItem[];
}

export default function PublicInventoryGrid({ items }: PublicInventoryGridProps) {
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null);

  return (
    <>
      <InventoryGrid items={items} isLoading={false} onPreview={setPreviewItem} />
      <ItemPreviewModal
        inventoryItem={previewItem}
        onClose={() => setPreviewItem(null)}
        onRefetch={() => {}}
        readOnly
      />
    </>
  );
}
