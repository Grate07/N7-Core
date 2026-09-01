const JsonStore = require('./jsonStore');

const store = new JsonStore('levels.json');

/**
 * XP needed to go from `level` to `level + 1`.
 * Level 0 -> 1 needs 100 XP, Level 1 -> 2 needs 200 XP, etc.
 */
function xpNeededForLevel(level) {
  return (level + 1) * 100;
}

function getUser(userId) {
  return store.get(userId) || { xp: 0, level: 0, totalXp: 0, messages: 0 };
}

/**
 * Adds XP to a user, rolling them up through as many levels as the XP
 * covers (handles big XP jumps, not just +1 level at a time).
 * Returns the updated user record and whether they leveled up at all.
 */
function addXp(userId, amount) {
  const user = getUser(userId);
  user.xp += amount;
  user.totalXp += amount;
  user.messages += 1;

  let leveledUp = false;
  let neededXp = xpNeededForLevel(user.level);
  while (user.xp >= neededXp) {
    user.xp -= neededXp;
    user.level += 1;
    leveledUp = true;
    neededXp = xpNeededForLevel(user.level);
  }

  store.set(userId, user);
  return { user, leveledUp };
}

/** All users, sorted by all-time total XP (highest first). */
function getLeaderboard() {
  const all = store.getAll();
  return Object.entries(all)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.totalXp - a.totalXp);
}

/** 1-based rank position, or null if the user has no XP yet. */
function getRank(userId) {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(u => u.userId === userId);
  return index === -1 ? null : index + 1;
}

module.exports = { xpNeededForLevel, getUser, addXp, getLeaderboard, getRank, store };
