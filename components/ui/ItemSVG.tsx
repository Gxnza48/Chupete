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
  accent: string;
  glow: string;
  pattern?: "stars" | "hearts" | "dots" | "stripes" | "rune" | "holo" | "circuit" | "starfield";
  effect?: "metal" | "holo" | "iridescent" | "crystal" | "alien" | "cosmic" | "neon" | "plasma";
};

// ── Color words → hex (matches the 160 seeded names) ──────────────────────────
const COLOR_WORDS: Record<string, string> = {
  blanco: "#f5f5f5", negro: "#181818", gris: "#909090",
  azul: "#3060d0", rojo: "#d83030", verde: "#3aa050",
  amarillo: "#f0c020", rosa: "#f078b0", celeste: "#74b9ff",
  marron: "#7a4a28", mate: "#888888", brillante: "#ffe48a",
  opaco: "#a8a8a8", liso: "#cfcfcf", rayado: "#b8b8b8",
  punteado: "#c8c8c8", desgastado: "#9a8e7a", claro: "#e8e8e8",
  oscuro: "#2a2a2a", default: "#bfbfbf",
  aqua: "#5fd9d2", coral: "#ff7e6b", lima: "#b8e83a",
  lavanda: "#c5a8ff", turquesa: "#30d5c8", indigo: "#3a3acc",
  magenta: "#e030a8", ambar: "#ffb000", jade: "#3a8870",
  perla: "#f0e8da", satinado: "#c0b8a8", pulido: "#e0e0f0",
  cromado: "#bfd1e0", barnizado: "#a87a4a", esmaltado: "#dfeff0",
  translucido: "#a8d0e0", glow: "#80ff90", fade: "#a890d8",
  gradient: "#7080ff", marble: "#d8d0c0",
  neon: "#39ff14", holo: "#a8c8ff", rgb: "#ff3080",
  iridiscente: "#90c0ff", prism: "#b890ff", crystal: "#a8e8ff",
  glass: "#e0f5ff", emerald: "#00aa55", sapphire: "#1860c0",
  ruby: "#d61c4e", amethyst: "#9a5bd1", topaz: "#e8b840",
  quartz: "#f0c8d0", obsidian: "#0a0a16", steel: "#a8b0c0",
  titanium: "#bfc4cf", carbon: "#1a1a1f", chrome: "#d8dde4",
  gold: "#f0c040", silver: "#cfd8e0", black: "#0a0a0a",
  red: "#d62828", blue: "#2070e0", diamond: "#e8f6ff",
  platinum: "#e0e0e8", cyber: "#28e0ff", digital: "#40c4ff",
  matrix: "#00ff66", glitch: "#ff00aa", circuit: "#00ddaa",
  voltage: "#ffd400", reactor: "#ff5500", fusion: "#ff8800",
  plasma: "#ff40ff", ion: "#a8eaff", liquid: "#ffce4a",
  infinity: "#5a7eff", royal: "#3850c0", imperial: "#a52828",
  crown: "#3868d0", core: "#ff4040", king: "#0c0c1c",
  overdrive: "#39ff14", master: "#80a8ff", ultra: "#ff30c0",
  dark: "#101020", lightborn: "#fff6c8", voidwalker: "#5028a8",
  prime: "#ffd040", eternal: "#4090ff", infinite: "#d62828",
  apex: "#ffaf28", zenith: "#ffe070", omega: "#a830ff",
  alpha: "#ffc830", final: "#a0a0ff", alien: "#50e070",
  bio: "#7aff80", neural: "#80d0ff", hive: "#c0d040",
  mutant: "#a0d028", xeno: "#40d088", parasite: "#a8e040",
  organic: "#9ad080", living: "#7adda0", symbiote: "#a830a8",
  cosmic: "#9050ff", unknown: "#7080a0", origin: "#ff70a0",
  beyond: "#80a0ff", void: "#2010a0", flux: "#a8e0ff",
  link: "#80b8ff", absolute: "#fff0a0", god: "#ffe080",
  reality: "#80a8ff", paradox: "#a050d0", omniverse: "#5060ff",
  limitless: "#ffd060", transcendent: "#d0a8ff", ascended: "#fff8a0",
  boss: "#ff3050", true: "#80a0ff", unbound: "#90d0ff",
  endgame: "#ff5050", divine: "#ffe890", supreme: "#ffaa40",
  genesis: "#80e8a0", last: "#a040ff",
};

const RARITY_DEFAULT: Record<string, Palette> = {
  comun: {
    shieldA: "#dadada", shieldB: "#a8a8a8", shieldC: "#606060",
    nippleA: "#f0e8d8", nippleB: "#c0b0a0",
    ringA: "#b0b0b0", ringB: "#606060",
    accent: "#7a7a7a", glow: "#7a7a7a",
  },
  poco_comun: {
    shieldA: "#b8e8d8", shieldB: "#5fa890", shieldC: "#1f5848",
    nippleA: "#f8f0e0", nippleB: "#c8b8a0",
    ringA: "#5fa890", ringB: "#1f5848",
    accent: "#5fd9c0", glow: "#5fd9c0",
  },
  medio_raro: {
    shieldA: "#b8d8f0", shieldB: "#5080c8", shieldC: "#1f3868",
    nippleA: "#f8f4e8", nippleB: "#c8b8a0",
    ringA: "#5080c8", ringB: "#1f3868",
    accent: "#5080ff", glow: "#5080ff",
    pattern: "circuit",
  },
  raro: {
    shieldA: "#d0b0e8", shieldB: "#7040b8", shieldC: "#3a1860",
    nippleA: "#f8eaf8", nippleB: "#c098c8",
    ringA: "#7040b8", ringB: "#3a1860",
    accent: "#9858ff", glow: "#9858ff",
    pattern: "rune",
    effect: "crystal",
  },
  ultra_raro: {
    shieldA: "#f8b0d0", shieldB: "#c83078", shieldC: "#601040",
    nippleA: "#fff0f8", nippleB: "#d8a0c0",
    ringA: "#c83078", ringB: "#601040",
    accent: "#ff40a0", glow: "#ff40a0",
    pattern: "holo",
    effect: "iridescent",
  },
  legendario: {
    shieldA: "#fff5b8", shieldB: "#ffaa30", shieldC: "#a8580a",
    nippleA: "#fff8d0", nippleB: "#d8b860",
    ringA: "#ffaa30", ringB: "#a8580a",
    accent: "#ffd040", glow: "#ffaa00",
    pattern: "stars",
    effect: "metal",
  },
  extraterrestre: {
    shieldA: "#a0ffd8", shieldB: "#10c8a0", shieldC: "#0a604a",
    nippleA: "#f0fff8", nippleB: "#a8d8c0",
    ringA: "#10c8a0", ringB: "#0a604a",
    accent: "#00ffcc", glow: "#00ffcc",
    pattern: "starfield",
    effect: "alien",
  },
  en_el_ort: {
    shieldA: "#ff90d8", shieldB: "#9028e8", shieldC: "#3a0860",
    nippleA: "#fff0ff", nippleB: "#d098e0",
    ringA: "#ff40c0", ringB: "#a000c8",
    accent: "#ff40e0", glow: "#ff40e0",
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
    if (found.length >= 2) break;
  }
  return found;
}

function buildPalette(name: string, rarity: string): Palette {
  const base = RARITY_DEFAULT[rarity] ?? RARITY_DEFAULT.comun;
  const colors = extractColors(name);
  if (colors.length === 0) {
    const h = hashStr(name);
    const hue = h % 360;
    const accent = `hsl(${hue} 70% 60%)`;
    return { ...base, accent, glow: accent };
  }
  const primary = colors[0];
  const secondary = colors[1] ?? shade(primary, -30);
  return {
    ...base,
    shieldA: shade(primary, 40),
    shieldB: primary,
    shieldC: shade(primary, -45),
    ringA: shade(secondary, 10),
    ringB: shade(secondary, -40),
    accent: secondary,
    glow: primary,
  };
}

// Variant pickers — deterministic per name
function pickShape(h: number): 0 | 1 | 2 | 3 {
  return (h % 4) as 0 | 1 | 2 | 3;
}
function pickNipple(h: number): 0 | 1 | 2 {
  return ((h >>> 3) % 3) as 0 | 1 | 2;
}
function pickRing(h: number): 0 | 1 | 2 {
  return ((h >>> 6) % 3) as 0 | 1 | 2;
}
function pickAccent(h: number): 0 | 1 | 2 | 3 | 4 {
  return ((h >>> 9) % 5) as 0 | 1 | 2 | 3 | 4;
}

// ── Shield path generator ──────────────────────────────────────────────────
function shieldPath(shape: 0 | 1 | 2 | 3): string {
  switch (shape) {
    case 0:
      // Butterfly / MAM-style: wider, with bottom wing dips
      return "M 100 30 C 152 30 172 60 168 90 C 165 116 152 130 132 134 C 124 136 116 142 100 142 C 84 142 76 136 68 134 C 48 130 35 116 32 90 C 28 60 48 30 100 30 Z";
    case 1:
      // Classic round / oval
      return "M 100 32 C 142 32 168 56 168 86 C 168 116 142 142 100 142 C 58 142 32 116 32 86 C 32 56 58 32 100 32 Z";
    case 2:
      // Heart-shaped (top has dual lobes)
      return "M 100 142 C 60 130 28 104 28 76 C 28 50 48 32 70 32 C 84 32 96 42 100 52 C 104 42 116 32 130 32 C 152 32 172 50 172 76 C 172 104 140 130 100 142 Z";
    case 3:
      // Rounded-square plate (modern)
      return "M 50 30 L 150 30 C 164 30 172 38 172 52 L 172 120 C 172 134 164 142 150 142 L 50 142 C 36 142 28 134 28 120 L 28 52 C 28 38 36 30 50 30 Z";
  }
}

// ── Nipple/teat renderer ───────────────────────────────────────────────────
function NippleShape({
  type, idNipple, idNippleHL, palette,
}: { type: 0 | 1 | 2; idNipple: string; idNippleHL: string; palette: Palette }) {
  // Center of shield is around (100, 86)
  switch (type) {
    case 0:
      // Classic dome — orthodontic, slightly flattened
      return (
        <g>
          <ellipse cx="100" cy="88" rx="26" ry="20" fill={`url(#${idNipple})`} stroke={shade(palette.nippleB, -30)} strokeWidth="1" />
          <ellipse cx="100" cy="88" rx="22" ry="16" fill="none" stroke={shade(palette.nippleA, 5)} strokeWidth="0.6" opacity="0.6" />
          <ellipse cx="92" cy="82" rx="9" ry="5" fill={`url(#${idNippleHL})`} />
          <ellipse cx="105" cy="93" rx="14" ry="4" fill="rgba(0,0,0,0.15)" />
        </g>
      );
    case 1:
      // Cherry / round bulb
      return (
        <g>
          <circle cx="100" cy="86" r="22" fill={`url(#${idNipple})`} stroke={shade(palette.nippleB, -30)} strokeWidth="1" />
          <circle cx="100" cy="86" r="18" fill="none" stroke={shade(palette.nippleA, 5)} strokeWidth="0.6" opacity="0.5" />
          <circle cx="92" cy="80" r="6" fill={`url(#${idNippleHL})`} />
          <ellipse cx="100" cy="100" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />
        </g>
      );
    case 2:
      // Symmetric teardrop / elongated
      return (
        <g>
          <path
            d="M 100 64 C 122 64 130 74 130 90 C 130 102 118 110 100 110 C 82 110 70 102 70 90 C 70 74 78 64 100 64 Z"
            fill={`url(#${idNipple})`} stroke={shade(palette.nippleB, -30)} strokeWidth="1"
          />
          <ellipse cx="90" cy="76" rx="10" ry="4" fill={`url(#${idNippleHL})`} />
          <ellipse cx="106" cy="100" rx="14" ry="3" fill="rgba(0,0,0,0.18)" />
        </g>
      );
  }
}

// ── Ring/handle renderer ───────────────────────────────────────────────────
function RingShape({
  type, idRing, idRingHL, palette, glowFilter,
}: { type: 0 | 1 | 2; idRing: string; idRingHL: string; palette: Palette; glowFilter?: string }) {
  // Ring sits at bottom y≈170
  const cy = 168;
  switch (type) {
    case 0:
      // Smooth oval ring
      return (
        <g filter={glowFilter}>
          <ellipse cx="100" cy={cy} rx="28" ry="20" fill="none" stroke={`url(#${idRing})`} strokeWidth="7" />
          <ellipse cx="100" cy={cy - 2} rx="26" ry="15" fill="none" stroke={`url(#${idRingHL})`} strokeWidth="1.4" opacity="0.7" />
          <rect x="91" y="142" width="18" height="10" rx="3" fill={`url(#${idRing})`} stroke={shade(palette.ringB, -25)} strokeWidth="1" />
        </g>
      );
    case 1:
      // Ribbed/segmented ring
      return (
        <g filter={glowFilter}>
          <ellipse cx="100" cy={cy} rx="28" ry="20" fill="none" stroke={`url(#${idRing})`} strokeWidth="7" />
          <ellipse cx="100" cy={cy} rx="28" ry="20" fill="none" stroke={shade(palette.ringB, -30)} strokeWidth="7" strokeDasharray="3 3" opacity="0.55" />
          <rect x="91" y="142" width="18" height="10" rx="3" fill={`url(#${idRing})`} stroke={shade(palette.ringB, -25)} strokeWidth="1" />
          <line x1="93" y1="146" x2="107" y2="146" stroke={shade(palette.ringB, -30)} strokeWidth="0.8" opacity="0.6" />
        </g>
      );
    case 2:
      // Decorated ring with center gem accent
      return (
        <g filter={glowFilter}>
          <ellipse cx="100" cy={cy} rx="28" ry="20" fill="none" stroke={`url(#${idRing})`} strokeWidth="7" />
          <ellipse cx="100" cy={cy - 2} rx="26" ry="15" fill="none" stroke={`url(#${idRingHL})`} strokeWidth="1" opacity="0.7" />
          <rect x="91" y="142" width="18" height="10" rx="3" fill={`url(#${idRing})`} stroke={shade(palette.ringB, -25)} strokeWidth="1" />
          {/* Gem on top */}
          <polygon points="100,182 105,188 100,194 95,188" fill={palette.accent} stroke={shade(palette.accent, -20)} strokeWidth="0.6" opacity="0.95" />
        </g>
      );
  }
}

// ── Accent patterns overlaid on the shield ─────────────────────────────────
function AccentDecor({
  type, palette, shieldClipId,
}: { type: 0 | 1 | 2 | 3 | 4; palette: Palette; shieldClipId: string }) {
  if (type === 0) return null;
  const stroke = "rgba(255,255,255,0.55)";
  switch (type) {
    case 1:
      // Mini stars scattered top + bottom
      return (
        <g clipPath={`url(#${shieldClipId})`} opacity="0.85">
          <Star cx={56} cy={56} r={3} color={palette.accent} />
          <Star cx={148} cy={60} r={2.5} color={palette.accent} />
          <Star cx={60} cy={120} r={2.2} color={palette.accent} />
          <Star cx={142} cy={118} r={3.2} color={palette.accent} />
        </g>
      );
    case 2:
      // Hearts
      return (
        <g clipPath={`url(#${shieldClipId})`} opacity="0.8">
          <Heart cx={58} cy={58} s={4} color={palette.accent} />
          <Heart cx={146} cy={62} s={3.5} color={palette.accent} />
          <Heart cx={64} cy={120} s={3} color={palette.accent} />
        </g>
      );
    case 3:
      // Dots ring
      return (
        <g clipPath={`url(#${shieldClipId})`} opacity="0.7">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x = 100 + Math.cos(a) * 60;
            const y = 86 + Math.sin(a) * 44;
            return <circle key={i} cx={x} cy={y} r={1.4} fill={stroke} />;
          })}
        </g>
      );
    case 4:
      // Concentric arcs (radial pattern)
      return (
        <g clipPath={`url(#${shieldClipId})`} opacity="0.5">
          <ellipse cx="100" cy="86" rx="52" ry="38" fill="none" stroke={stroke} strokeWidth="0.7" />
          <ellipse cx="100" cy="86" rx="42" ry="30" fill="none" stroke={stroke} strokeWidth="0.6" />
          <ellipse cx="100" cy="86" rx="34" ry="24" fill="none" stroke={stroke} strokeWidth="0.5" />
        </g>
      );
  }
}

function Star({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${cx + Math.cos(ang) * rad},${cy + Math.sin(ang) * rad}`);
  }
  return <polygon points={pts.join(" ")} fill={color} stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" />;
}

function Heart({ cx, cy, s, color }: { cx: number; cy: number; s: number; color: string }) {
  const d = `M ${cx} ${cy + s * 0.8} C ${cx - s * 1.2} ${cy + s * 0.2} ${cx - s * 0.9} ${cy - s} ${cx} ${cy - s * 0.2} C ${cx + s * 0.9} ${cy - s} ${cx + s * 1.2} ${cy + s * 0.2} ${cx} ${cy + s * 0.8} Z`;
  return <path d={d} fill={color} />;
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
  const uidRaw = useId();
  const uid = uidRaw.replace(/[^a-zA-Z0-9]/g, "");
  const palette = useMemo(() => buildPalette(name, rarity), [name, rarity]);
  const h = useMemo(() => hashStr(name), [name]);
  const shape = pickShape(h);
  const nipple = pickNipple(h);
  const ring = pickRing(h);
  const accentType = pickAccent(h);

  const idShield = `sh${uid}`;
  const idShieldEdge = `se${uid}`;
  const idShieldHL = `shl${uid}`;
  const idShieldShade = `sh2${uid}`;
  const idNipple = `np${uid}`;
  const idNippleHL = `nhl${uid}`;
  const idRing = `rg${uid}`;
  const idRingHL = `rgh${uid}`;
  const idGlowF = `gf${uid}`;
  const idShadowF = `sd${uid}`;
  const idShieldClip = `sclip${uid}`;
  const idHolo = `holo${uid}`;
  const idStarPat = `stars${uid}`;
  const idCircuit = `circ${uid}`;
  const idAlien = `al${uid}`;
  const idCosmic = `cos${uid}`;
  const idVignette = `vg${uid}`;

  const sPath = shieldPath(shape);

  // Effect flags
  const isHolo = palette.pattern === "holo" || palette.effect === "iridescent";
  const isStarfield = palette.pattern === "starfield";
  const isCircuit = palette.pattern === "circuit";
  const isAlien = palette.effect === "alien";
  const isCosmic = palette.effect === "cosmic";
  const isCrystal = palette.effect === "crystal";
  const isMetal = palette.effect === "metal";

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
        {/* Shield gradients */}
        <radialGradient id={idShield} cx="38%" cy="32%" r="68%" fx="34%" fy="28%">
          <stop offset="0%" stopColor={palette.shieldA} />
          <stop offset="55%" stopColor={palette.shieldB} />
          <stop offset="100%" stopColor={palette.shieldC} />
        </radialGradient>
        <linearGradient id={idShieldEdge} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.shieldB, 25)} />
          <stop offset="100%" stopColor={shade(palette.shieldC, -10)} />
        </linearGradient>
        <radialGradient id={idShieldHL} cx="36%" cy="22%" r="36%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id={idShieldShade} cx="62%" cy="80%" r="48%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.42)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Nipple gradients */}
        <radialGradient id={idNipple} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor={shade(palette.nippleA, 10)} />
          <stop offset="60%" stopColor={palette.nippleA} />
          <stop offset="100%" stopColor={palette.nippleB} />
        </radialGradient>
        <radialGradient id={idNippleHL} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Ring gradients */}
        <linearGradient id={idRing} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={shade(palette.ringA, 25)} />
          <stop offset="55%" stopColor={palette.ringA} />
          <stop offset="100%" stopColor={palette.ringB} />
        </linearGradient>
        <linearGradient id={idRingHL} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Filters */}
        <filter id={idGlowF} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={idShadowF} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.65)" />
        </filter>

        {/* Holographic shimmer */}
        <linearGradient id={idHolo} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,80,200,0.55)" />
          <stop offset="33%" stopColor="rgba(80,200,255,0.55)" />
          <stop offset="66%" stopColor="rgba(120,255,160,0.55)" />
          <stop offset="100%" stopColor="rgba(255,200,80,0.55)" />
        </linearGradient>

        {/* Starfield */}
        <pattern id={idStarPat} x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="6" r="0.9" fill="rgba(255,255,255,0.85)" />
          <circle cx="18" cy="13" r="0.5" fill="rgba(180,220,255,0.7)" />
          <circle cx="11" cy="20" r="0.7" fill="rgba(255,240,200,0.8)" />
          <circle cx="22" cy="22" r="0.4" fill="rgba(200,255,255,0.7)" />
        </pattern>

        {/* Alien veins */}
        <radialGradient id={idAlien} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(120,255,200,0.55)" />
          <stop offset="60%" stopColor="rgba(40,200,160,0.25)" />
          <stop offset="100%" stopColor="rgba(0,80,60,0)" />
        </radialGradient>

        {/* Cosmic swirl */}
        <radialGradient id={idCosmic} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="rgba(255,80,220,0.7)" />
          <stop offset="50%" stopColor="rgba(120,40,200,0.45)" />
          <stop offset="100%" stopColor="rgba(20,0,50,0)" />
        </radialGradient>

        {/* Bottom vignette inside shield */}
        <radialGradient id={idVignette} cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Shield clip for overlays */}
        <clipPath id={idShieldClip}>
          <path d={sPath} />
        </clipPath>
      </defs>

      {/* Outer aura for legendary tier */}
      {showAura && (
        <>
          <circle cx="100" cy="100" r="94" fill={`${palette.glow}22`} style={{ filter: "blur(10px)" }} />
          <circle cx="100" cy="100" r="80" fill={`${palette.glow}18`} style={{ filter: "blur(14px)" }} />
        </>
      )}

      {/* Ground shadow */}
      <ellipse cx="100" cy="190" rx="55" ry="5" fill="rgba(0,0,0,0.55)" style={{ filter: "blur(5px)" }} />

      {/* Ring rendered BEHIND the shield so it visually sits behind */}
      <RingShape
        type={ring}
        idRing={idRing}
        idRingHL={idRingHL}
        palette={palette}
        glowFilter={showAura ? `url(#${idGlowF})` : undefined}
      />

      {/* Shield base */}
      <g filter={`url(#${idShadowF})`}>
        <path d={sPath} fill={`url(#${idShield})`} stroke={`url(#${idShieldEdge})`} strokeWidth="1.6" />
      </g>

      {/* Bottom curvature shading inside shield */}
      <g clipPath={`url(#${idShieldClip})`}>
        <rect x="0" y="0" width="200" height="200" fill={`url(#${idShieldShade})`} />
        <rect x="0" y="0" width="200" height="200" fill={`url(#${idVignette})`} opacity="0.7" />
      </g>

      {/* Rarity-specific overlays clipped to shield */}
      {isHolo && (
        <g clipPath={`url(#${idShieldClip})`}>
          <rect x="0" y="0" width="200" height="200" fill={`url(#${idHolo})`} style={{ mixBlendMode: "screen" }} opacity="0.6" />
        </g>
      )}
      {isStarfield && (
        <g clipPath={`url(#${idShieldClip})`}>
          <rect x="0" y="0" width="200" height="200" fill={`url(#${idStarPat})`} style={{ mixBlendMode: "screen" }} opacity="0.85" />
        </g>
      )}
      {isCircuit && (
        <g clipPath={`url(#${idShieldClip})`} opacity="0.6" style={{ mixBlendMode: "screen" }}>
          <path d="M 50 90 L 70 90 L 70 70 L 100 70" stroke={palette.glow} strokeWidth="0.8" fill="none" />
          <path d="M 100 70 L 100 52" stroke={palette.glow} strokeWidth="0.8" fill="none" />
          <path d="M 150 90 L 130 90 L 130 110 L 100 110" stroke={palette.glow} strokeWidth="0.8" fill="none" />
          <circle cx="70" cy="70" r="1.6" fill={palette.glow} />
          <circle cx="100" cy="52" r="1.6" fill={palette.glow} />
          <circle cx="130" cy="110" r="1.6" fill={palette.glow} />
        </g>
      )}
      {isAlien && (
        <g clipPath={`url(#${idShieldClip})`} style={{ mixBlendMode: "screen" }}>
          <rect x="0" y="0" width="200" height="200" fill={`url(#${idAlien})`} />
          <path d="M 50 80 Q 75 70 100 86 Q 125 102 150 80" stroke="rgba(120,255,180,0.7)" strokeWidth="1.4" fill="none" />
          <path d="M 60 110 Q 80 102 100 110 Q 120 118 140 110" stroke="rgba(80,220,140,0.5)" strokeWidth="1" fill="none" />
        </g>
      )}
      {isCosmic && (
        <g clipPath={`url(#${idShieldClip})`} style={{ mixBlendMode: "screen" }}>
          <rect x="0" y="0" width="200" height="200" fill={`url(#${idCosmic})`} />
          <circle cx="70" cy="68" r="1.1" fill="rgba(255,255,255,0.9)" />
          <circle cx="138" cy="78" r="1.4" fill="rgba(255,200,255,0.85)" />
          <circle cx="106" cy="120" r="0.9" fill="rgba(200,180,255,0.9)" />
        </g>
      )}
      {isCrystal && (
        <g clipPath={`url(#${idShieldClip})`} opacity="0.65">
          <polygon points="100,52 118,86 100,120 82,86" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.9" />
          <polygon points="68,72 84,80 76,108 60,100" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
          <polygon points="132,72 140,100 124,108 116,80" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
        </g>
      )}
      {isMetal && (
        <g clipPath={`url(#${idShieldClip})`}>
          <ellipse cx="100" cy="60" rx="52" ry="7" fill="rgba(255,255,255,0.4)" style={{ filter: "blur(3px)" }} />
          <ellipse cx="100" cy="125" rx="46" ry="4" fill="rgba(255,255,255,0.18)" style={{ filter: "blur(2px)" }} />
        </g>
      )}

      {/* Accent decoration (stars/hearts/dots based on name) */}
      <AccentDecor type={accentType} palette={palette} shieldClipId={idShieldClip} />

      {/* Air holes — characteristic of a real pacifier (2 small dots near top of shield) */}
      <g>
        <ellipse cx="80" cy="58" rx="2.3" ry="1.6" fill="rgba(0,0,0,0.55)" />
        <ellipse cx="80" cy="58" rx="2.3" ry="1.6" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
        <ellipse cx="120" cy="58" rx="2.3" ry="1.6" fill="rgba(0,0,0,0.55)" />
        <ellipse cx="120" cy="58" rx="2.3" ry="1.6" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      </g>

      {/* Shield highlight (top-left specular) */}
      <g clipPath={`url(#${idShieldClip})`}>
        <ellipse cx="78" cy="56" rx="34" ry="18" fill={`url(#${idShieldHL})`} />
      </g>

      {/* Inner bevel ring (creates depth) */}
      <g clipPath={`url(#${idShieldClip})`}>
        <path d={sPath} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" transform="scale(0.92) translate(8.7 7.5)" />
      </g>

      {/* Nipple base ring on shield (where teat meets shield) */}
      <ellipse cx="100" cy="108" rx="30" ry="6" fill="rgba(0,0,0,0.28)" />

      {/* Nipple */}
      <NippleShape type={nipple} idNipple={idNipple} idNippleHL={idNippleHL} palette={palette} />

      {/* Sparkle for legendary+ */}
      {showAura && (
        <g>
          <circle cx="80" cy="50" r="1.4" fill="#fff" opacity="0.9" />
          <circle cx="148" cy="78" r="1" fill="#fff" opacity="0.7" />
          <circle cx="90" cy="76" r="0.8" fill="#fff" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

export function getItemGlow(name: string, rarity: string): string {
  return buildPalette(name, rarity).glow;
}

export type { ItemSVGProps };
export type ItemRarity = RarityKey;
