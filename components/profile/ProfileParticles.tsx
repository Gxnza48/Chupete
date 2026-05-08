"use client";

import { useEffect, useState } from "react";

export type ParticleEffect = "effect_stars" | "effect_fire" | "effect_bubbles";

type Particle = {
  id: string;
  x: number;
  startY: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  anim: string;
  round: boolean;
};

const CFG = {
  effect_stars: {
    count: 22, anim: "particle-twinkle", round: false,
    sizeRange: [2, 4] as [number, number], durRange: [3, 7] as [number, number],
    colors: ["#ffffff", "#ffffffbb", "#ffeedd", "#99ddff"],
    startFromBottom: false,
  },
  effect_fire: {
    count: 28, anim: "particle-rise", round: true,
    sizeRange: [5, 9] as [number, number], durRange: [2, 4] as [number, number],
    colors: ["rgba(255,60,0,0.8)", "rgba(255,110,0,0.8)", "rgba(255,180,0,0.7)"],
    startFromBottom: true,
  },
  effect_bubbles: {
    count: 16, anim: "particle-bubble", round: true,
    sizeRange: [7, 16] as [number, number], durRange: [5, 9] as [number, number],
    colors: ["rgba(200,149,42,0.4)", "rgba(255,200,0,0.35)", "rgba(200,160,50,0.45)"],
    startFromBottom: true,
  },
};

function gen(effect: ParticleEffect): Particle[] {
  const c = CFG[effect];
  return Array.from({ length: c.count }, (_, i) => ({
    id: `${effect}-${i}`,
    x: Math.random() * 98,
    startY: c.startFromBottom ? Math.random() * 20 : Math.random() * 90,
    size: c.sizeRange[0] + Math.random() * (c.sizeRange[1] - c.sizeRange[0]),
    delay: Math.random() * 6,
    duration: c.durRange[0] + Math.random() * (c.durRange[1] - c.durRange[0]),
    color: c.colors[Math.floor(Math.random() * c.colors.length)],
    anim: c.anim,
    round: c.round,
  }));
}

export default function ProfileParticles({ effects }: { effects: ParticleEffect[] }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setParticles(effects.flatMap(gen)); }, [effects.join(",")]);

  if (!particles.length) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0,
        overflow: "hidden", pointerEvents: "none",
        zIndex: 0, borderRadius: "inherit",
      }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            ...(CFG[effects[0]]?.startFromBottom === false
              ? { top: `${p.startY}%` }
              : { bottom: `${p.startY}%` }),
            width: p.size,
            height: p.size,
            borderRadius: p.round ? "50%" : "2px",
            background: p.round && p.anim === "particle-bubble" ? "transparent" : p.color,
            border: p.anim === "particle-bubble" ? `1.5px solid ${p.color}` : undefined,
            animation: `${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
            display: "block",
          }}
        />
      ))}
    </div>
  );
}
