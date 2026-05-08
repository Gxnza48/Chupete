"use client";

import { useEffect, useState } from "react";

export type ParticleEffect = "effect_stars" | "effect_fire" | "effect_bubbles";

interface Particle {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  color: string;
}

const CONFIGS: Record<ParticleEffect, { count: number; colors: string[]; shape: "circle" | "star" }> = {
  effect_stars:   { count: 18, colors: ["#ffffff", "#ffffffaa", "#ffeedd"], shape: "star" },
  effect_fire:    { count: 20, colors: ["#ff4400", "#ff8800", "#ffcc00", "#ff6600"], shape: "circle" },
  effect_bubbles: { count: 14, colors: ["#c8952a80", "#c8952a60", "#ffd70060"], shape: "circle" },
};

function generateParticles(effect: ParticleEffect): Particle[] {
  const cfg = CONFIGS[effect];
  return Array.from({ length: cfg.count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: Math.random() * 5 + (effect === "effect_stars" ? 3 : 5),
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 3,
    drift: (Math.random() - 0.5) * 60,
    color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
  }));
}

export default function ProfileParticles({ effects }: { effects: ParticleEffect[] }) {
  const [particles, setParticles] = useState<{ effect: ParticleEffect; list: Particle[] }[]>([]);

  useEffect(() => {
    setParticles(effects.map((e) => ({ effect: e, list: generateParticles(e) })));
  }, [effects.join(",")]);

  if (!particles.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {particles.map(({ effect, list }) => {
        const cfg = CONFIGS[effect];
        return list.map((p) => (
          <div
            key={`${effect}-${p.id}`}
            className="absolute bottom-0"
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              borderRadius: cfg.shape === "star" ? "1px" : "50%",
              background: p.color,
              border: effect === "effect_bubbles" ? `1px solid ${p.color}` : undefined,
              animation: `particle-float ${p.duration}s ease-out ${p.delay}s infinite`,
              ["--drift" as string]: `${p.drift}px`,
              ...(effect === "effect_stars"
                ? { animation: `particle-twinkle ${p.duration}s ease-in-out ${p.delay}s infinite`, bottom: `${Math.random() * 80}%`, transform: "rotate(45deg)" }
                : {}),
            }}
          />
        ));
      })}
    </div>
  );
}
