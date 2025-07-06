// XP System Configuration
export const XP_CONFIG = {
  // XP Awards for different actions
  AWARDS: {
    GAME_COMPLETED: 50, // Base XP for completing a game
    GAME_WON: 100, // Bonus XP for winning a game
    WORD_GUESSED_CORRECTLY: 25, // XP for correctly guessing a word
    WORD_DRAWN_SUCCESSFULLY: 10, // XP for drawing a word that gets guessed
    PERFECT_GAME_BONUS: 50, // Bonus XP for perfect game (all words guessed)
    WIN_STREAK_BONUS: 25, // Bonus XP per win in a streak
  },

  // Level thresholds (XP required for each level)
  LEVEL_THRESHOLDS: [
    0, // Level 1: 0-99 XP
    100, // Level 2: 100-299 XP
    300, // Level 3: 300-599 XP
    600, // Level 4: 600-999 XP
    1000, // Level 5: 1000-1499 XP
    1500, // Level 6: 1500-2099 XP
    2100, // Level 7: 2100-2799 XP
    2800, // Level 8: 2800-3599 XP
    3600, // Level 9: 3600-4499 XP
    4500, // Level 10: 4500+ XP
  ],

  // XP required for each level (calculated dynamically)
  getXPForLevel: (level) => {
    if (level <= 0) return 0;
    if (level <= XP_CONFIG.LEVEL_THRESHOLDS.length) {
      return XP_CONFIG.LEVEL_THRESHOLDS[level - 1];
    }
    // For levels beyond the predefined thresholds, use a formula
    return (
      XP_CONFIG.LEVEL_THRESHOLDS[XP_CONFIG.LEVEL_THRESHOLDS.length - 1] +
      (level - XP_CONFIG.LEVEL_THRESHOLDS.length) * 1000
    );
  },
};

// Calculate level based on total XP
export function calculateLevel(totalXP) {
  for (let i = XP_CONFIG.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= XP_CONFIG.LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

// Calculate XP progress within current level
export function calculateCurrentXP(totalXP, level) {
  const xpForCurrentLevel = XP_CONFIG.getXPForLevel(level);
  const xpForNextLevel = XP_CONFIG.getXPForLevel(level + 1);
  return totalXP - xpForCurrentLevel;
}

// Calculate XP needed for next level
export function calculateXPToNextLevel(totalXP, level) {
  const xpForNextLevel = XP_CONFIG.getXPForLevel(level + 1);
  return xpForNextLevel - totalXP;
}

// Calculate XP awards for a game
export function calculateGameXPAwards(gameData) {
  const {
    isWinner = false,
    wordsGuessedCorrectly = 0,
    wordsDrawnSuccessfully = 0,
    isPerfectGame = false,
    winStreak = 0,
    totalWordsInGame = 1,
  } = gameData;

  let totalXP = XP_CONFIG.AWARDS.GAME_COMPLETED;

  // Bonus for winning
  if (isWinner) {
    totalXP += XP_CONFIG.AWARDS.GAME_WON;
  }

  // XP for correctly guessed words
  totalXP += wordsGuessedCorrectly * XP_CONFIG.AWARDS.WORD_GUESSED_CORRECTLY;

  // XP for successfully drawn words
  totalXP += wordsDrawnSuccessfully * XP_CONFIG.AWARDS.WORD_DRAWN_SUCCESSFULLY;

  // Perfect game bonus (all words in the game were guessed correctly)
  if (isPerfectGame && wordsGuessedCorrectly === totalWordsInGame) {
    totalXP += XP_CONFIG.AWARDS.PERFECT_GAME_BONUS;
  }

  // Win streak bonus
  if (isWinner && winStreak > 1) {
    totalXP += (winStreak - 1) * XP_CONFIG.AWARDS.WIN_STREAK_BONUS;
  }

  return Math.max(0, totalXP);
}

// Update user stats with new XP
export function updateUserStatsWithXP(currentStats, xpEarned) {
  const newTotalXP = (currentStats.xp || 0) + xpEarned;
  const newLevel = calculateLevel(newTotalXP);
  const newCurrentXP = calculateCurrentXP(newTotalXP, newLevel);
  const newXPToNextLevel = calculateXPToNextLevel(newTotalXP, newLevel);

  return {
    ...currentStats,
    xp: newTotalXP,
    level: newLevel,
    currentXP: newCurrentXP,
    xpToNextLevel: newXPToNextLevel,
  };
}

// Check if user leveled up
export function didUserLevelUp(oldLevel, newLevel) {
  return newLevel > oldLevel;
}

// Get level up message
export function getLevelUpMessage(oldLevel, newLevel) {
  if (newLevel > oldLevel) {
    return `🎉 Congratulations! You reached Level ${newLevel}!`;
  }
  return null;
}
