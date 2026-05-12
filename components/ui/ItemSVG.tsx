"use client";

import { useId, useMemo } from "react";
import type { RarityKey } from "@/lib/rarities";

interface ItemSVGProps {
  name: string;
  rarity: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  glow?: boolean;
}

type Palette = {
  shieldA: string;
  shieldB: string;
  shieldC: string;
  nippleA: string;
  nippleB: string;
  ringA: string;
  ringB: string;
  glow: string;
  pattern?: "stripes" | "dots" | "marble" | "circuit" | "prism" | "starfield" | "holo" | "rgb" | "fade";
  effect?: "neon" | "holo" | "rgb" | "iridescent" | "crystal" | "metal" | "alien" | "cosmic";
};

// ── Color word index (matches the 160 seeded names) ────────────────────────────
const COLOR_WORDS: Record<string, string> = {
  blanco: "#f5f5f5",
  negro: "#181818",
  gris: "#909090",
  azul: "#3060d0",
  rojo: "#d83030",
  verde: "#3aa050",
  amarillo: "#f0c020",
  rosa: "#f078b0",
  celeste: "#74b9ff",
  marron: "#7a4a28",
  mate: "#888888",
  brillante: "#ffe48a",
  opaco: "#a8a8a8",
  liso: "#cfcfcf",
  rayado: "#b8b8b8",
  punteado: "#c8c8c8",
  desgastado: "#9a8e7a",
  claro: "#e8e8e8",
  oscuro: "#2a2a2a",
  default: "#bfbfbf",
  aqua: "#5fd9d2",
  coral: "#ff7e6b",
  lima: "#b8e83a",
  lavanda: "#c5a8ff",
  turquesa: "#30d5c8",
  indigo: "#3a3acc",
  magenta: "#e030a8",
  ambar: "#ffb000",
  jade: "#3a8870",
  perla: "#f0e8da",
  satinado: "#c0b8a8",
  pulido: "#e0e0f0",
  cromado: "#bfd1e0",
  barnizado: "#a87a4a",
  esmaltado: "#dfeff0",
  translucido: "#a8d0e0",
  glow: "#80ff90",
  fade: "#a890d8",
  gradient: "#7080ff",
  marble: "#d8d0c0",
  neon: "#39ff14",
  holo: "#a8c8ff",
  rgb: "#ff3080",
  iridiscente: "#90c0ff",
  prism: "#b890ff",
  crystal: "#a8e8ff",
  glass: "#e0f5ff",
  emerald: "#00aa55",
  sapphire: "#1860c0",
  ruby: "#d61c4e",
  amethyst: "#9a5bd1",
  topaz: "#e8b840",
  quartz: "#f0c8d0",
  obsidian: "#0a0a16",
  steel: "#a8b0c0",
  titanium: "#bfc4cf",
  carbon: "#1a1a1f",
  chrome: "#d8dde4",
  gold: "#f0c040",
  silver: "#cfd8e0",
  black: "#0a0a0a",
  red: "#d62828",
  blue: "#2070e0",
  diamond: "#e8f6ff",
  platinum: "#e0e0e8",
  cyber: "#28e0ff",
  digital: "#40c4ff",
  matrix: "#00ff66",
  glitch: "#ff00aa",
  circuit: "#00ddaa",
  voltage: "#ffd400",
  reactor: "#ff5500",
  fusion: "#ff8800",
  plasma: "#ff40ff",
  ion: "#a8eaff",
  liquid: "#ffce4a",
  infinity: "#5a7eff",
  royal: "#3850c0",
  imperial: "#a52828",
  crown: "#3868d0",
  core: "#ff4040",
  king: "#0c0c1c",
  overdrive: "#39ff14",
  master: "#80a8ff",
  ultra: "#ff30c0",
  dark: "#101020",
  lightborn: "#fff6c8",
  voidwalker: "#5028a8",
  prime: "#ffd040",
  eternal: "#4090ff",
  infinite: "#d62828",
  apex: "#ffaf28",
  zenith: "#ffe070",
  omega: "#a830ff",
  alpha: "#ffc830",
  final: "#a0a0ff",
  alien: "#50e070",
  bio: "#7aff80",
  neural: "#80d0ff",
  hive: "#c0d040",
  mutant: "#a0d028",
  xeno: "#40d088",
  parasite: "#a8e040",
  organic: "#9ad080",
  living: "#7adda0",
  symbiote: "#a830a8",
  cosmic: "#9050ff",
  unknown: "#7080a0",
  origin: "#ff70a0",
  beyond: "#80a0ff",
  void: "#2010a0",
  flux: "#a8e0ff",
  link: "#80b8ff",
  absolute: "#fff0a0",
  god: "#ffe080",
  reality: "#80a8ff",
  paradox: "#a050d0",
  omniverse: "#5060ff",
  limitless: "#ffd060",
  transcendent: "#d0a8ff",
  ascended: "#fff8a0",
  boss: "#ff3050",
  true: "#80a0ff",
  unbound: "#90d0ff",
  endgame: "#ff5050",
  divine: "#ffe890",
  supreme: "#ffaa40",
  genesis: "#80e8a0",
  last: "#a040ff",
};

const RARITY_DEFAULT: Record<string, Palette> = {
  comun: {
    shieldA: "#dadada", shieldB: "#a8a8a8", shieldC: "#787878",
    nippleA: "#e8e8e8", nippleB: "#a0a0a0",
    ringA: "#b0b0b0", ringB: "#787878",
    glow: "#7a7a7a",
  },
  poco_comun: {
    shieldA: "#a8d8c8", shieldB: "#5fa8a0", shieldC: "#306860",
    nippleA: "#c8e8e0", nippleB: "#6fb0a8",
    ringA: "#5fa8a0", ringB: "#306860",
    glow: "#5fd9c0",
  },
  medio_raro: {
    shieldA: "#a8c8e8", shieldB: "#5080c0", shieldC: "#284878",
    nippleA: "#c8d8e8", nippleB: "#5070b0",
    ringA: "#5080c0", ringB: "#284878",
    glow: "#5080ff",
    pattern: "circuit",
  },
  raro: {
    shieldA: "#c0a0e0", shieldB: "#7040b8", shieldC: "#3a1860",
    nippleA: "#d0b8e8", nippleB: "#7848c0",
    ringA: "#7040b8", ringB: "#3a1860",
    glow: "#9858ff",
    pattern: "prism",
    effect: "crystal",
  },
  ultra_raro: {
    shieldA: "#f0a0c8", shieldB: "#c83078", shieldC: "#601040",
    nippleA: "#f0b8d8", nippleB: "#d04088",
    ringA: "#c83078", ringB: "#601040",
    glow: "#ff40a0",
    pattern: "holo",
    effect: "iridescent",
  },
  legendario: {
    shieldA: "#fff0a8", shieldB: "#ffaa30", shieldC: "#a8580a",
    nippleA: "#fff8c8", nippleB: "#ffc850",
    ringA: "#ffaa30", ringB: "#a8580a",
    glow: "#ffaa00",
    pattern: "rgb",
    effect: "metal",
  },
  extraterrestre: {
    shieldA: "#90ffd0", shieldB: "#10c8a0", shieldC: "#0a604a",
    nippleA: "#a8ffe0", nippleB: "#28d8b0",
    ringA: "#10c8a0", ringB: "#0a604a",
    glow: "#00ffcc",
    pattern: "starfield",
    effect: "alien",
  },
  en_el_ort: {
    shieldA: "#ff80d0", shieldB: "#9028e8", shieldC: "#3a0860",
    nippleA: "#ff98e0", nippleB: "#a838ff",
    ringA: "#ff40c0", ringB: "#a000c8",
    glow: "#ff40e0",
    pattern: "holo",
    effect: "cosmic",
  },
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shade(hex: string, amt: number): string {
  // amt in -100..100. Negative = darker, positive = lighter.
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const p = amt / 100;
  if (p < 0) {
    r = Math.round(r * (1 + p));
    g = Math.round(g * (1 + p));
    b = Math.round(b * (1 + p));
  } else {
    r = Math.round(r + (255 - r) * p);
    g = Math.round(g + (255 - g) * p);
    b = Math.round(b + (255 - b) * p);
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function extractColors(name: string): string[] {
  const lower = name.toLowerCase();
  const found: string[] = [];
  for (const [word, color] of Object.entries(COLOR_WORDS)) {
    if (lower.includes(word)) found.push(color);
    if (found.length >= 3) break;
  }
  return found;
}

function buildPalette(name: string, rarity: string): Palette {
  const base = RARITY_DEFAULT[rarity] ?? RARITY_DEFAULT.comun;
  const colors = extractColors(name);
  if (colors.length === 0) {
    // Deterministic small hue shift based on name hash so unnamed items still vary
    const h = hashStr(name) % 360;
    const accent = `hsl(${h} 60% 60%)`;
    return { ...base, glow: accent };
  }
  const primary = colors[0];
  const secondary = colors[1] ?? shade(primary, -25);
  return {
    ...base,
    shieldA: shade(primary, 35),
    shieldB: primary,
    shieldC: shade(primary, -40),
    nippleA: shade(primary, 50),
    nippleB: shade(primary, -10),
    ringA: secondary,
    ringB: shade(secondary, -30),
    glow: primary,
  };
}

export default function ItemSVG({
  name,
  rarity,
  size = 200,
  className,
  style,
  ariaLabel,
  glow = true,
}: ItemSVGProps) {
  const uid = useId().replace(/[:]/g, "");
  const palette = useMemo(() => buildPalette(name, rarity), [name, rarity]);

  const idShield = `sh-${uid}`;
  const idNipple = `np-${uid}`;
  const idRing = `rg-${uid}`;
  const idHighlight = `hl-${uid}`;
  const idGlowF = `gf-${uid}`;
  const idShadowF = `sd-${uid}`;
  const idPatternStripes = `ps-${uid}`;
  const idPatternDots = `pd-${uid}`;
  const idHoloShift = `hs-${uid}`;
  const idRgbShift = `rs-${uid}`;
  const idStars = `st-${uid}`;
  const idAlienVein = `av-${uid}`;
  const idCosmic = `cs-${uid}`;

  const isHolo = palette.pattern === "holo";
  const isRgb = palette.pattern === "rgb";
  const isPrism = palette.pattern === "prism";
  const isCircuit = palette.pattern === "circuit";
  const isStarfield = palette.pattern === "starfield";

  // Legendary tier rarities get an outer aura
  const showAura = glow && (rarity === "legendario" || rarity === "extraterrestre" || rarity === "en_el_ort");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel ?? name}
      role="img"
      className={className}
      style={style}
    >
      <defs>
        <radialGradient id={idShield} cx="42%" cy="38%" r="62%" fx="38%" fy="34%">
          <stop offset="0%" stopColor={palette.shieldA} />
          <stop offset="45%" stopColor={palette.shieldB} />
          <stop offset="100%" stopColor={palette.shieldC} />
        </radialGradient>

        <linearGradient id={idNipple} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={shade(palette.nippleA, -10)} />
          <stop offset="40%" stopColor={palette.nippleA} />
          <stop offset="70%" stopColor={palette.nippleB} />
          <stop offset="100%" stopColor={shade(palette.nippleB, -20)} />
        </linearGradient>

        <linearGradient id={idRing} x1="20%" y1="20%" x2="80%" y2="80%">
          <stop offset="0%" stopColor={shade(palette.ringA, 20)} />
          <stop offset="50%" stopColor={palette.ringA} />
          <stop offset="100%" stopColor={palette.ringB} />
        </linearGradient>

        <radialGradient id={idHighlight} cx="30%" cy="25%" r="48%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        <filter id={idGlowF} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={idShadowF} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="rgba(0,0,0,0.65)" />
        </filter>

        {/* Patterns */}
        <pattern id={idPatternStripes} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="4" height="8" fill="rgba(255,255,255,0.18)" />
        </pattern>

        <pattern id={idPatternDots} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.3" fill="rgba(255,255,255,0.32)" />
        </pattern>

        {/* Holographic / iridescent gradient */}
        <linearGradient id={idHoloShift} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,80,200,0.55)" />
          <stop offset="33%" stopColor="rgba(80,200,255,0.55)" />
          <stop offset="66%" stopColor="rgba(120,255,160,0.55)" />
          <stop offset="100%" stopColor="rgba(255,200,80,0.55)" />
        </linearGradient>

        {/* RGB rainbow gradient */}
        <linearGradient id={idRgbShift} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ff3050" />
          <stop offset="25%" stopColor="#ffd400" />
          <stop offset="50%" stopColor="#40d088" />
          <stop offset="75%" stopColor="#28a8ff" />
          <stop offset="100%" stopColor="#a830ff" />
        </linearGradient>

        {/* Alien vein gradient */}
        <radialGradient id={idAlienVein} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(120,255,200,0.5)" />
          <stop offset="60%" stopColor="rgba(40,200,160,0.25)" />
          <stop offset="100%" stopColor="rgba(0,80,60,0)" />
        </radialGradient>

        {/* Cosmic swirl */}
        <radialGradient id={idCosmic} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(255,80,220,0.7)" />
          <stop offset="50%" stopColor="rgba(120,40,200,0.45)" />
          <stop offset="100%" stopColor="rgba(20,0,50,0)" />
        </radialGradient>

        {/* Starfield */}
        <pattern id={idStars} x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="5" r="0.8" fill="rgba(255,255,255,0.85)" />
          <circle cx="15" cy="12" r="0.5" fill="rgba(180,220,255,0.7)" />
          <circle cx="9" cy="18" r="0.7" fill="rgba(255,240,200,0.8)" />
        </pattern>
      </defs>

      {/* Outer aura (legendary+) */}
      {showAura && (
        <circle cx="100" cy="100" r="92" fill={`${palette.glow}22`} style={{ filter: "blur(8px)" }} />
      )}

      {/* Shadow */}
      <ellipse cx="100" cy="118" rx="62" ry="8" fill="rgba(0,0,0,0.5)" style={{ filter: "blur(6px)" }} />

      {/* Shield base */}
      <ellipse
        cx="100" cy="105" rx="60" ry="44"
        fill={`url(#${idShield})`}
        stroke={shade(palette.shieldC, -10)}
        strokeWidth="1.5"
        filter={`url(#${idShadowF})`}
      />

      {/* Stripes / dots pattern overlay on shield (varied by name hash) */}
      {(() => {
        const h = hashStr(name);
        const usesStripes = h % 5 === 1;
        const usesDots = h % 5 === 2;
        if (usesStripes) {
          return (
            <ellipse cx="100" cy="105" rx="58" ry="42" fill={`url(#${idPatternStripes})`} style={{ mixBlendMode: "overlay" }} />
          );
        }
        if (usesDots) {
          return (
            <ellipse cx="100" cy="105" rx="58" ry="42" fill={`url(#${idPatternDots})`} style={{ mixBlendMode: "overlay" }} />
          );
        }
        return null;
      })()}

      {/* Rarity-specific overlays */}
      {isHolo && (
        <ellipse cx="100" cy="105" rx="58" ry="42" fill={`url(#${idHoloShift})`} style={{ mixBlendMode: "screen" }} />
      )}
      {isRgb && (
        <ellipse cx="100" cy="105" rx="58" ry="42" fill={`url(#${idRgbShift})`} style={{ mixBlendMode: "screen", opacity: 0.55 }} />
      )}
      {isPrism && (
        <>
          <ellipse cx="100" cy="105" rx="58" ry="42" fill={`url(#${idHoloShift})`} style={{ mixBlendMode: "color-dodge", opacity: 0.4 }} />
          <ellipse cx="100" cy="105" rx="50" ry="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        </>
      )}
      {isCircuit && (
        <g style={{ mixBlendMode: "screen" }} opacity="0.55">
          <path d="M 60 105 L 78 105 L 78 92 L 100 92" stroke={palette.glow} strokeWidth="0.7" fill="none" />
          <path d="M 100 92 L 100 75" stroke={palette.glow} strokeWidth="0.7" fill="none" />
          <path d="M 140 105 L 122 105 L 122 118 L 100 118" stroke={palette.glow} strokeWidth="0.7" fill="none" />
          <circle cx="78" cy="92" r="1.4" fill={palette.glow} />
          <circle cx="122" cy="118" r="1.4" fill={palette.glow} />
          <circle cx="100" cy="75" r="1.4" fill={palette.glow} />
        </g>
      )}
      {isStarfield && (
        <ellipse cx="100" cy="105" rx="58" ry="42" fill={`url(#${idStars})`} style={{ mixBlendMode: "screen" }} />
      )}

      {/* Specular highlight */}
      <ellipse cx="100" cy="105" rx="60" ry="44" fill={`url(#${idHighlight})`} />

      {/* Bottom curvature shadow */}
      <ellipse cx="102" cy="120" rx="45" ry="18" fill="rgba(0,0,0,0.25)" style={{ mixBlendMode: "multiply" }} />

      {/* Inner bevel */}
      <ellipse cx="100" cy="105" rx="53" ry="38" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />

      {/* Decorative center dots (always visible) */}
      <circle cx="85" cy="97" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="100" cy="92" r="2.5" fill="rgba(255,255,255,0.28)" />
      <circle cx="115" cy="97" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="92" cy="110" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="108" cy="110" r="2" fill="rgba(255,255,255,0.2)" />

      {/* Effect-specific extras */}
      {palette.effect === "alien" && (
        <g style={{ mixBlendMode: "screen" }}>
          <ellipse cx="100" cy="105" rx="40" ry="14" fill={`url(#${idAlienVein})`} />
          <path d="M 70 102 Q 86 96 100 104 Q 116 112 130 102" stroke="rgba(120,255,180,0.6)" strokeWidth="1.2" fill="none" />
          <path d="M 78 116 Q 92 110 102 116 Q 112 122 124 116" stroke="rgba(80,220,140,0.45)" strokeWidth="0.9" fill="none" />
        </g>
      )}
      {palette.effect === "cosmic" && (
        <g style={{ mixBlendMode: "screen" }}>
          <ellipse cx="100" cy="105" rx="50" ry="20" fill={`url(#${idCosmic})`} />
          <circle cx="86" cy="98" r="1" fill="rgba(255,255,255,0.9)" />
          <circle cx="116" cy="108" r="1.2" fill="rgba(255,200,255,0.85)" />
          <circle cx="100" cy="115" r="0.8" fill="rgba(200,180,255,0.9)" />
        </g>
      )}
      {palette.effect === "crystal" && (
        <g opacity="0.6">
          <polygon points="100,80 112,105 100,130 88,105" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
          <polygon points="78,98 90,102 86,118 72,114" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" />
        </g>
      )}
      {palette.effect === "metal" && (
        <ellipse cx="100" cy="100" rx="48" ry="6" fill="rgba(255,255,255,0.32)" style={{ filter: "blur(2px)" }} />
      )}
      {palette.effect === "iridescent" && (
        <ellipse cx="100" cy="105" rx="55" ry="38" fill={`url(#${idHoloShift})`} style={{ mixBlendMode: "color-dodge", opacity: 0.55 }} />
      )}
      {palette.effect === "neon" && (
        <ellipse cx="100" cy="105" rx="60" ry="44" fill="none" stroke={palette.glow} strokeWidth="2" filter={`url(#${idGlowF})`} opacity="0.85" />
      )}

      {/* Nipple */}
      <ellipse cx="100" cy="74" rx="14" ry="8" fill={`url(#${idNipple})`} stroke={shade(palette.nippleB, -25)} strokeWidth="1" />
      <path
        d="M 88 74 Q 86 58 90 50 Q 94 44 100 44 Q 106 44 110 50 Q 114 58 112 74 Z"
        fill={`url(#${idNipple})`}
        stroke={shade(palette.nippleB, -25)}
        strokeWidth="1"
      />
      <ellipse cx="100" cy="44" rx="10" ry="6" fill={shade(palette.nippleA, 8)} stroke={shade(palette.nippleB, -20)} strokeWidth="1" />
      <path d="M 91 72 Q 90 58 93 50 Q 95 46 98 45" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Ring */}
      <circle
        cx="100" cy="155" r="22"
        fill="none"
        stroke={`url(#${idRing})`}
        strokeWidth="8"
        filter={showAura ? `url(#${idGlowF})` : undefined}
      />
      <path d="M 84 144 Q 78 155 84 166" stroke="rgba(255,255,255,0.45)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="95" y="147" width="10" height="12" rx="3" fill={`url(#${idRing})`} stroke={shade(palette.ringB, -20)} strokeWidth="1" />
      <circle cx="100" cy="155" r="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
    </svg>
  );
}

export function getItemGlow(name: string, rarity: string): string {
  return buildPalette(name, rarity).glow;
}

export type { ItemSVGProps };
// Re-export for callers that want the rarity-typed glow
export type ItemRarity = RarityKey;
