"use client";

import { useState, useEffect, useCallback } from "react";

const SESSION_ID = Math.random().toString(36).slice(2);
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "@/types/database";
import { RARITY_ORDER, type RarityKey } from "@/lib/rarities";

function sortByRarity(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => {
    const aOrder = RARITY_ORDER.indexOf(
      (a.item?.rarity ?? "comun") as RarityKey
    );
    const bOrder = RARITY_ORDER.indexOf(
      (b.item?.rarity ?? "comun") as RarityKey
    );
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.float_value - b.float_value;
  });
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("inventory")
      .select("*, item:items(*)")
      .eq("user_id", user.id)
      .order("obtained_at", { ascending: false });

    if (!error && data) {
      setItems(sortByRarity(data as InventoryItem[]));
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Realtime subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`inventory:${user.id}:${SESSION_ID}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inventory",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchInventory();
          }
        )
        .subscribe();
    }

    subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, fetchInventory]);

  return { items, isLoading, refetch: fetchInventory };
}
