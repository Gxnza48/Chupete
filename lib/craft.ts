import type { RarityKey } from "./rarities";

// Outcome rarity breakpoints by combined base_price_ars
const VALUE_BREAKPOINTS: { threshold: number; floor: RarityKey; ceiling: RarityKey; successRate: number }[] = [
  { threshold: 0,        floor: "comun",          ceiling: "poco_comun",     successRate: 0.55 },
  { threshold: 500,      floor: "poco_comun",     ceiling: "medio_raro",     successRate: 0.52 },
  { threshold: 2_000,    floor: "medio_raro",     ceiling: "raro",           successRate: 0.50 },
  { threshold: 10_000,   floor: "raro",           ceiling: "ultra_raro",     successRate: 0.48 },
  { threshold: 50_000,   floor: "ultra_raro",     ceiling: "legendario",     successRate: 0.45 },
  { threshold: 200_000,  floor: "legendario",     ceiling: "extraterrestre", successRate: 0.40 },
  { threshold: 1_000_000,floor: "extraterrestre", ceiling: "en_el_ort",      successRate: 0.30 },
];

export type CraftOutcome = {
  targetRarity: RarityKey;
  successRate: number;
  floorRarity: RarityKey;
};

export function getCraftOutcome(totalValue: number): CraftOutcome {
  let bracket = VALUE_BREAKPOINTS[0];
  for (const b of VALUE_BREAKPOINTS) {
    if (totalValue >= b.threshold) bracket = b;
  }
  return {
    targetRarity: bracket.ceiling,
    successRate: bracket.successRate,
    floorRarity: bracket.floor,
  };
}

// Roll result: success → ceiling rarity, near-miss → floor rarity, catastrophic → comun
export function rollCraft(outcome: CraftOutcome): RarityKey {
  const roll = Math.random();
  if (roll < outcome.successRate) return outcome.targetRarity;
  if (roll < outcome.successRate + (1 - outcome.successRate) * 0.45) return outcome.floorRarity;
  return "comun";
}
