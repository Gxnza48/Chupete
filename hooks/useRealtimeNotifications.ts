"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { formatNum } from "@/lib/format";

// Watches the current user's listings for sales and credits changes
export function useRealtimeNotifications() {
  const supabase = createClient();
  const { addToast } = useToast();
  const prevCredits = useRef<number | null>(null);

  useEffect(() => {
    let listingsChannel: ReturnType<typeof supabase.channel> | null = null;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Watch profile credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (profile) prevCredits.current = profile.credits;

      profileChannel = supabase
        .channel(`notif-profile:${user.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          const newCredits = (payload.new as { credits: number }).credits;
          const prev = prevCredits.current;
          if (prev !== null && newCredits !== prev) {
            const diff = newCredits - prev;
            if (Math.abs(diff) >= 10) {
              addToast({
                variant: "default",
                message: `${diff > 0 ? "+" : ""}${formatNum(diff)} cr. ${diff > 0 ? "recibidos" : "gastados"}`,
              });
            }
          }
          prevCredits.current = newCredits;
        })
        .subscribe();

      // 2. Watch own listings for sales
      listingsChannel = supabase
        .channel(`notif-listings:${user.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "listings",
          filter: `seller_id=eq.${user.id}`,
        }, async (payload) => {
          const row = payload.new as { status: string; price_credits: number; inventory_id: string };
          if (row.status !== "sold") return;

          // Fetch item name for the notification
          const { data: inv } = await supabase
            .from("inventory")
            .select("item:items(name)")
            .eq("id", row.inventory_id)
            .single();
          const itemName = (inv?.item as unknown as { name: string } | null)?.name ?? "tu item";

          addToast({
            variant: "default",
            message: `¡Vendiste ${itemName} por ${formatNum(row.price_credits)} cr.!`,
          });
        })
        .subscribe();
    }

    setup();

    return () => {
      if (listingsChannel) supabase.removeChannel(listingsChannel);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [supabase, addToast]);
}
