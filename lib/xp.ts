export function xpForNextLevel(level: number): number {
  if (level <= 100) return 150 + (level - 1) * 50;
  // Exponential growth past level 100
  return Math.floor(5100 * Math.pow(1.08, level - 100));
}

export function calculateLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpNeeded: number;
} {
  let level = 1;
  let remaining = totalXp;

  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
    if (level > 9999) break;
  }

  return { level, xpInLevel: remaining, xpNeeded: xpForNextLevel(level) };
}

export function levelProgress(totalXp: number): number {
  const { xpInLevel, xpNeeded } = calculateLevel(totalXp);
  return Math.min((xpInLevel / xpNeeded) * 100, 100);
}
