"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileParticles, { type ParticleEffect } from "./ProfileParticles";

const EFFECT_KEYS = ["effect_stars", "effect_fire", "effect_bubbles"] as const;

export default function ProfileParticlesWrapper({ userId }: { userId: string }) {
  const [effects, setEffects] = useState<ParticleEffect[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profile_cosmetics")
      .select("shop_item:shop_items(key)")
      .eq("user_id", userId)
      .eq("equipped", true)
      .then(({ data }) => {
        if (!data) return;
        const activeEffects = data
          .map((c) => (c.shop_item as unknown as { key: string } | null)?.key)
          .filter((k): k is ParticleEffect =>
            EFFECT_KEYS.includes(k as ParticleEffect)
          );
        setEffects(activeEffects);
      });
  }, [userId]);

  if (!effects.length) return null;
  return <ProfileParticles effects={effects} />;
}
