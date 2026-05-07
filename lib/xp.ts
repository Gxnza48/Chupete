export function xpForNextLevel(level: number): number {
  // Scaling formula: 150, 200, 250, 300, 350...
  return 150 + (level - 1) * 50;
}

export function calculateLevel(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpNeeded: number;
} {
  let level = 1;
  let remaining = totalXp;
  
  while (remaining >= xpForNextLevel(level) && level < 100) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  
  return { level, xpInLevel: remaining, xpNeeded: xpForNextLevel(level) };
}

export function levelProgress(totalXp: number): number {
  const { xpInLevel, xpNeeded } = calculateLevel(totalXp);
  return Math.min((xpInLevel / xpNeeded) * 100, 100);
}
