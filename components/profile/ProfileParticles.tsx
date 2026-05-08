"use client";

import { useEffect, useState, useCallback } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export type ParticleEffect = "effect_stars" | "effect_fire" | "effect_bubbles";

const CONFIGS: Record<ParticleEffect, ISourceOptions> = {
  effect_stars: {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 50 },
      color: { value: ["#ffffff", "#ffeedd", "#aaddff"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.1, max: 0.7 }, animation: { enable: true, speed: 0.8, sync: false } },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 0.3, direction: "none", random: true, outModes: "out" },
      twinkle: { particles: { enable: true, frequency: 0.05, opacity: 1, color: { value: "#ffffff" } } },
    },
    interactivity: { events: {} },
  },
  effect_fire: {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 40 },
      color: { value: ["#ff2200", "#ff6600", "#ff9900", "#ffcc00"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.2, max: 0.8 }, animation: { enable: true, speed: 2, sync: false, startValue: "max", destroy: "min" } },
      size: { value: { min: 3, max: 8 }, animation: { enable: true, speed: 5, sync: false, startValue: "max", destroy: "min" } },
      move: {
        enable: true, speed: { min: 2, max: 5 }, direction: "top",
        random: true, straight: false, outModes: "out",
      },
      life: { duration: { value: { min: 0.5, max: 1.5 }, sync: false }, count: 0 },
    },
    interactivity: { events: {} },
  },
  effect_bubbles: {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    particles: {
      number: { value: 25 },
      color: { value: ["#c8952a", "#ffd700", "#ffaa00"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.2, max: 0.5 } },
      size: { value: { min: 4, max: 12 } },
      stroke: { width: 1, color: { value: "#c8952a" } },
      move: { enable: true, speed: 1.2, direction: "top", random: true, outModes: "out" },
    },
    interactivity: { events: {} },
  },
};

function mergeConfigs(effects: ParticleEffect[]): ISourceOptions {
  if (effects.length === 1) return CONFIGS[effects[0]];
  // Merge particle counts and combine colors
  const all = effects.flatMap((e) => {
    const cfg = CONFIGS[e];
    return (cfg.particles?.color as { value: string[] })?.value ?? ["#ffffff"];
  });
  const base = CONFIGS[effects[0]];
  return {
    ...base,
    particles: {
      ...base.particles,
      number: { value: effects.length * 30 },
      color: { value: all },
    },
  };
}

export default function ProfileParticles({ effects }: { effects: ParticleEffect[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  if (!ready || !effects.length) return null;

  return (
    <Particles
      id={`profile-particles-${effects.join("-")}`}
      particlesLoaded={particlesLoaded}
      options={mergeConfigs(effects)}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
