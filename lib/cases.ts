import type { RarityKey } from "./rarities";
import { RARITIES } from "./rarities";

export type CaseRarityEntry = {
  rarity: RarityKey;
  weight: number;
};

export type CaseDefinition = {
  id: string;
  name: string;
  description: string;
  price_credits: number;
  emoji: string;
  accentColor: string;
  rarities: CaseRarityEntry[];
};

export const CASES: Record<string, CaseDefinition> = {
  basica: {
    id: "basica",
    name: "Caja Básica",
    description: "La entrada al mundo de los chupetes coleccionables.",
    price_credits: 500,
    emoji: "📦",
    accentColor: "#606060",
    rarities: [
      { rarity: "comun", weight: 55 },
      { rarity: "poco_comun", weight: 28 },
      { rarity: "medio_raro", weight: 12 },
      { rarity: "raro", weight: 5 },
    ],
  },
  premium: {
    id: "premium",
    name: "Caja Premium",
    description: "Para los que buscan algo más especial.",
    price_credits: 2500,
    emoji: "🎁",
    accentColor: "#8050d0",
    rarities: [
      { rarity: "poco_comun", weight: 35 },
      { rarity: "medio_raro", weight: 33 },
      { rarity: "raro", weight: 20 },
      { rarity: "ultra_raro", weight: 10 },
      { rarity: "legendario", weight: 2 },
    ],
  },
  exclusiva: {
    id: "exclusiva",
    name: "Caja Exclusiva",
    description: "Solo para los verdaderos coleccionistas argentinos.",
    price_credits: 10000,
    emoji: "💎",
    accentColor: "#ffaa00",
    rarities: [
      { rarity: "raro", weight: 35 },
      { rarity: "ultra_raro", weight: 30 },
      { rarity: "legendario", weight: 22 },
      { rarity: "extraterrestre", weight: 10 },
      { rarity: "en_el_ort", weight: 3 },
    ],
  },
};

export const CASE_LIST = Object.values(CASES);

export function getPercentages(rarities: CaseRarityEntry[]): (CaseRarityEntry & { pct: number })[] {
  const total = rarities.reduce((s, r) => s + r.weight, 0);
  return rarities.map((r) => ({
    ...r,
    pct: (r.weight / total) * 100,
  }));
}

export function rollRarity(rarities: CaseRarityEntry[]): RarityKey {
  const total = rarities.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const entry of rarities) {
    roll -= entry.weight;
    if (roll <= 0) return entry.rarity;
  }
  return rarities[rarities.length - 1].rarity;
}

export const RARITY_COLOR = (rarity: RarityKey): string => {
  const config = RARITIES[rarity];
  return config.gradient ? config.gradient[0] : (config.color ?? "#efefef");
};

export const DAILY_CASE_COOLDOWN_HOURS = 24;
