import type { RarityKey } from "./rarities";
import { RARITIES } from "./rarities";

export const RARITY_RANK: Record<RarityKey, number> = {
  comun:          0,
  poco_comun:     1,
  medio_raro:     2,
  raro:           3,
  ultra_raro:     4,
  legendario:     5,
  extraterrestre: 6,
  en_el_ort:      7,
};

// Probability per step gap (1-indexed)
const STEP_ODDS = [0.35, 0.12, 0.04, 0.012, 0.003, 0.0005, 0.00002];

export function getUpgradeOdds(fromRarity: RarityKey, toRarity: RarityKey): number {
  const steps = RARITY_RANK[toRarity] - RARITY_RANK[fromRarity];
  if (steps <= 0) return 0;
  return STEP_ODDS[Math.min(steps - 1, STEP_ODDS.length - 1)];
}

export function getUpgradeOddsPct(from: RarityKey, to: RarityKey): string {
  const odds = getUpgradeOdds(from, to);
  if (odds >= 0.01) return `${(odds * 100).toFixed(1)}%`;
  if (odds >= 0.0001) return `${(odds * 100).toFixed(3)}%`;
  return `${(odds * 100).toFixed(5)}%`;
}

export const RARITY_LIST = Object.keys(RARITIES) as RarityKey[];

export function getRarityColor(rarity: RarityKey): string {
  const cfg = RARITIES[rarity];
  return cfg.gradient ? cfg.gradient[0] : (cfg.color ?? "#3a3a3a");
}
