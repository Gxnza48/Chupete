"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileParticles, { type ParticleEffect } from "./ProfileParticles";

const EFFECT_KEYS: ParticleEffect[] = [
  "effect_default", "effect_snow", "effect_bubble", "effect_nasa",
  "effect_stars", "effect_fire", "effect_bubbles",
];

export default function ProfileParticlesWrapper({ userId }: { userId: string }) {
  const [effects, setEffects] = useState<ParticleEffect[]>([]);
  const [mounted, setMounted] = useState(false);

  // Wait for hydration before rendering particles (avoids React #418 hydration error)
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();
    supabase
      .from("profile_cosmetics")
      .select("shop_item:shop_items(key)")
      .eq("user_id", userId)
      .eq("equipped", true)
      .then(({ data }) => {
        if (!data) return;
        const active = data
          .map((c) => (c.shop_item as unknown as { key: string } | null)?.key)
          .filter((k): k is ParticleEffect => EFFECT_KEYS.includes(k as ParticleEffect));
        setEffects(active.slice(0, 1));
      });
  }, [userId, mounted]);

  if (!mounted || !effects.length) return null;
  return <ProfileParticles effects={effects} />;
}
