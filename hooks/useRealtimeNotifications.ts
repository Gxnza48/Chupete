"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { formatNum } from "@/lib/format";

export function useRealtimeNotifications() {
  const supabase = createClient();
  const { addToast } = useToast();
  const prevCredits = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const checkCredits = useCallback(async () => {
    if (!userIdRef.current) return;
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userIdRef.current)
      .single();
    if (!data) return;

    const newCredits = Number(data.credits ?? 0);
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
  }, [supabase, addToast]);

  useEffect(() => {
    let listingsChannel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      // Seed initial credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (profile) prevCredits.current = Number(profile.credits ?? 0);

      // Poll credits every 4s (reliable across all Supabase plan configs)
      pollRef.current = setInterval(checkCredits, 4000);

      // Realtime on listings where I'm the seller → sale notification
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

          const { data: inv } = await supabase
            .from("inventory")
            .select("item:items(name)")
            .eq("id", row.inventory_id)
            .single();
          const itemName = (inv?.item as unknown as { name: string } | null)?.name ?? "un item";
          const net = Math.floor(row.price_credits * 0.95);

          addToast({
            variant: "default",
            message: `¡Vendiste ${itemName}! +${formatNum(net)} cr.`,
          });
          // Trigger credit check immediately
          setTimeout(checkCredits, 500);
        })
        .subscribe();
    }

    setup();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (listingsChannel) supabase.removeChannel(listingsChannel);
    };
  }, [supabase, addToast, checkCredits]);
}
