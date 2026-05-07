"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DropResult } from "@/types/database";
import { useToast } from "@/components/ui/Toast";
import { calculateLevel } from "@/lib/xp";

const SYNC_INTERVAL_MS = 500;
const MAX_CLICKS_PER_SYNC = 100;

export function useClicker() {
  const [lastDrop, setLastDrop] = useState<DropResult | null>(null);
  const [localClicks, setLocalClicks] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [xpParticles, setXpParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const pendingClicksRef = useRef(0);
  const particleId = useRef(0);
  const prevLevelRef = useRef<number | null>(null);
  const { addToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_clicks, xp, level")
        .eq("id", user.id)
        .single();
      if (profile) {
        setLocalClicks(profile.total_clicks ?? 0);
        prevLevelRef.current = calculateLevel(profile.xp ?? 0).level;
      }
    }
    loadProfile();
  }, [supabase]);

  const addXpParticle = useCallback((x: number, y: number) => {
    const id = particleId.current++;
    setXpParticles(prev => [...prev.slice(-8), { id, x, y }]);
    setTimeout(() => {
      setXpParticles(prev => prev.filter(p => p.id !== id));
    }, 900);
  }, []);

  const syncClicks = useCallback(async () => {
    const count = Math.min(pendingClicksRef.current, MAX_CLICKS_PER_SYNC);
    if (count === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    pendingClicksRef.current = Math.max(0, pendingClicksRef.current - count);

    try {
      const { data, error } = await supabase.functions.invoke("roll-drop", {
        method: "POST",
        body: { click_count: count },
      });

      if (error || !data) return;

      const result = data as { dropped: boolean } & Partial<DropResult>;
      if (result.dropped && result.item) {
        const drop = data as DropResult;
        setLastDrop(drop);
        addToast({ variant: "drop", drop });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", user.id)
        .single();
      if (profile) {
        const newLevel = profile.level ?? 1;
        if (prevLevelRef.current !== null && newLevel > prevLevelRef.current) {
          addToast({ variant: "levelup", level: newLevel });
        }
        prevLevelRef.current = newLevel;
      }
    } catch {
      // silently ignore — clicks already counted locally
    }
  }, [supabase, addToast]);

  useEffect(() => {
    const interval = setInterval(syncClicks, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [syncClicks]);

  const handleClick = useCallback((event?: React.MouseEvent) => {
    pendingClicksRef.current++;
    setLocalClicks(c => c + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);

    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      addXpParticle(event.clientX - rect.left, event.clientY - rect.top);
    } else {
      addXpParticle(100, 100);
    }
  }, [addXpParticle]);

  return {
    handleClick,
    isAnimating,
    lastDrop,
    localClicks,
    xpParticles,
  };
}
