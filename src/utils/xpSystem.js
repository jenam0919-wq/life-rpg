export function calculateLevel(xp) {
  let level = 1;
  let remainingXP = Math.max(0, Number(xp) || 0);
  let requiredXP = xpForNextLevel(level);

  while (remainingXP >= requiredXP) {
    remainingXP -= requiredXP;
    level += 1;
    requiredXP = xpForNextLevel(level);
  }

  return level;
}

export function xpForNextLevel(level) {
  let requiredXP = 100;

  for (let currentLevel = 1; currentLevel < Math.max(1, level); currentLevel += 1) {
    requiredXP = Math.floor(requiredXP * 1.25);
  }

  return requiredXP;
}
