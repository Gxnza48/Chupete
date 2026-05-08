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
  imageUrl: string;
  rarities: CaseRarityEntry[];
};

export const CASES: Record<string, CaseDefinition> = {
  basica: {
    id: "basica",
    name: "Caja Albiceleste",
    description: "Colección Porteña",
    price_credits: 5000,
    emoji: "",
    accentColor: "#4a7aaf",
    imageUrl: "https://wudlmpexpazsvuxfdkcl.supabase.co/storage/v1/object/public/item-assets/albiceleste.png",
    rarities: [
      { rarity: "comun", weight: 68 },
      { rarity: "poco_comun", weight: 22 },
      { rarity: "medio_raro", weight: 7 },
      { rarity: "raro", weight: 3 },
    ],
  },
  premium: {
    id: "premium",
    name: "Caja Bonaerense",
    description: "Colección Pampas",
    price_credits: 25000,
    emoji: "",
    accentColor: "#8050d0",
    imageUrl: "https://wudlmpexpazsvuxfdkcl.supabase.co/storage/v1/object/public/item-assets/bonaerense.png",
    rarities: [
      { rarity: "poco_comun", weight: 50 },
      { rarity: "medio_raro", weight: 30 },
      { rarity: "raro", weight: 14 },
      { rarity: "ultra_raro", weight: 5 },
      { rarity: "legendario", weight: 1 },
    ],
  },
  exclusiva: {
    id: "exclusiva",
    name: "Caja Obelisco",
    description: "Colección Patagónica",
    price_credits: 100000,
    emoji: "",
    accentColor: "#c8952a",
    imageUrl: "https://wudlmpexpazsvuxfdkcl.supabase.co/storage/v1/object/public/item-assets/obelisco.png",
    rarities: [
      { rarity: "raro", weight: 50 },
      { rarity: "ultra_raro", weight: 30 },
      { rarity: "legendario", weight: 14 },
      { rarity: "extraterrestre", weight: 5 },
      { rarity: "en_el_ort", weight: 1 },
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
