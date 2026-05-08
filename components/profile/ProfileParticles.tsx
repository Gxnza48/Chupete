"use client";

import { useEffect, useRef, useId } from "react";

export type ParticleEffect =
  | "effect_default"
  | "effect_snow"
  | "effect_bubble"
  | "effect_nasa"
  // legacy keys kept for backward compat
  | "effect_stars"
  | "effect_fire"
  | "effect_bubbles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWindow = Window & { particlesJS?: (id: string, cfg: object) => void; pJSDom?: any[] };

const CONFIGS: Record<string, object | null> = {
  effect_default: {
    particles: {
      number: { value: 50, density: { enable: true, value_area: 600 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.25, random: false },
      size: { value: 3, random: true },
      line_linked: { enable: true, distance: 130, color: "#ffffff", opacity: 0.15, width: 1 },
      move: { enable: true, speed: 1.5, direction: "none", random: false, straight: false, out_mode: "out", bounce: false },
    },
    interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
    retina_detect: true,
  },

  effect_snow: {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 600 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: true, anim: { enable: false } },
      size: { value: 4, random: true },
      line_linked: { enable: false },
      move: { enable: true, speed: 1, direction: "bottom", random: true, straight: false, out_mode: "out", bounce: false },
    },
    interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
    retina_detect: true,
  },

  effect_bubble: {
    particles: {
      number: { value: 14, density: { enable: true, value_area: 600 } },
      color: { value: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"] },
      shape: { type: "circle", stroke: { width: 2, color: "#ffffff" } },
      opacity: { value: 0.2, random: true },
      size: { value: 28, random: true },
      line_linked: { enable: false },
      move: { enable: true, speed: 1.5, direction: "none", random: true, straight: false, out_mode: "out", bounce: true },
    },
    interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
    retina_detect: true,
  },

  effect_nasa: {
    particles: {
      number: { value: 120, density: { enable: true, value_area: 600 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: 0.4, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1, sync: false } },
      size: { value: 2, random: true },
      line_linked: { enable: true, distance: 180, color: "#ffffff", opacity: 0.1, width: 1 },
      move: { enable: true, speed: 0.4, direction: "none", random: true, straight: false, out_mode: "out", bounce: false },
    },
    interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
    retina_detect: true,
  },

} as Record<string, object | null>;

// Map legacy keys to new presets
CONFIGS.effect_stars   = { ...(CONFIGS.effect_nasa   as object) };
CONFIGS.effect_fire    = { ...(CONFIGS.effect_default as object) };
CONFIGS.effect_bubbles = { ...(CONFIGS.effect_bubble  as object) };

export default function ProfileParticles({ effects }: { effects: ParticleEffect[] }) {
  const uid = useId().replace(/:/g, "");
  const containerId = `pjs-${uid}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!effects.length || !containerRef.current || initializedRef.current) return;

    const effect = effects[0];
    const config = CONFIGS[effect] ?? CONFIGS.effect_default;
    if (!config) return;

    function applyCanvas() {
      requestAnimationFrame(() => {
        const canvas = containerRef.current?.querySelector("canvas");
        if (canvas) {
          canvas.style.pointerEvents = "none";
        }
      });
    }

    const win = window as AnyWindow;

    function initParticles() {
      if (!containerRef.current || !win.particlesJS) return;
      const { offsetWidth: w, offsetHeight: h } = containerRef.current;
      if (w === 0 || h === 0) return;
      win.particlesJS(containerId, config as object);
      initializedRef.current = true;
      applyCanvas();
    }

    function init() {
      if (win.particlesJS) {
        initParticles();
        return;
      }
      const existing = document.getElementById("particles-js-script");
      if (existing) {
        existing.addEventListener("load", initParticles);
        return;
      }
      const script = document.createElement("script");
      script.id = "particles-js-script";
      script.src = "https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js";
      script.onload = initParticles;
      document.head.appendChild(script);
    }

    init();

    return () => {
      initializedRef.current = false;
      const w = window as AnyWindow;
      if (w.pJSDom) {
        w.pJSDom.forEach((dom) => {
          try {
            if (dom.pJS?.canvas?.el?.parentElement === containerRef.current) {
              dom.pJS.fn.vendors.destroypJS();
            }
          } catch {}
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effects.join(",")]);

  if (!effects.length) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        id={containerId}
        style={{ width: "100%", height: "100%", position: "relative" }}
      />
    </div>
  );
}
