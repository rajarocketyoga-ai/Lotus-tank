// Gamification Engine for Raja Rocket Flow
// Handles XP calculation, achievement checking, and streak management

import { ACHIEVEMENTS } from '../data/achievements';
import ROCKET_TEMPLATES from '../data/templates';

// --- Advanced poses that deserve bonus XP ---
const ADVANCED_POSES = [
  'Crow Pose', 'Side Crow Pose', 'Firefly Pose', 'Flying Pigeon',
  'Eight-Angle Pose', 'Sage Koundinya Pose', 'Headstand', 'Forearm Stand',
  'Shoulderstand', 'Peacock Pose', 'Himalayan Duck', 'Compass Pose',
  'Foot Behind Head Pose', 'Both Feet Behind Head', 'Yoga Sleep Pose',
  'Scale Pose', 'Wild Thing', 'Lotus Pose',
];

// --- XP Formula ---
export function calculateXP(sequence, preMood, postMood) {
  const poses = sequence?.poses || [];
  if (poses.length === 0) return 0;

  const BASE_XP = 10;
  const LENGTH_BONUS = poses.length * 1;
  const DIFFICULTY_BONUS = poses.filter(p =>
    ADVANCED_POSES.includes(p.english_name)
  ).length * 3;
  const SEQUENCE_BONUS = sequence.name?.includes('Rocket') ? 5 : 0;
  const MOOD_IMPROVEMENT = Math.max(0, (postMood || 3) - (preMood || 3)) * 2;
  const TOTAL = BASE_XP + LENGTH_BONUS + DIFFICULTY_BONUS + SEQUENCE_BONUS + MOOD_IMPROVEMENT;

  return TOTAL;
}

// --- Level System (sqrt-based, gets harder) ---
export function getLevel(totalXP) {
  return Math.floor(Math.sqrt(totalXP / 50)) + 1;
}

export function getLevelTitle(level) {
  const titles = {
    1: 'Seed', 2: 'Sprout', 3: 'Leaf', 4: 'Branch',
    5: 'Trunk', 6: 'Blossom', 7: 'Fruit', 8: 'Rooted',
    9: 'Lotus', 10: 'Rocket Master',
  };
  return titles[level] || `Level ${level}`;
}

export function getXPForNextLevel(totalXP) {
  const currentLevel = getLevel(totalXP);
  const nextLevelXP = Math.pow(currentLevel, 2) * 50;
  return Math.max(1, nextLevelXP - totalXP);
}

export function getProgressToNextLevel(totalXP) {
  const currentLevel = getLevel(totalXP);
  const currentLevelXP = Math.pow(currentLevel - 1, 2) * 50;
  const nextLevelXP = Math.pow(currentLevel, 2) * 50;
  const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

// --- Achievement Checking ---
export function checkAchievements(profile, sessionData) {
  const earned = [];
  const existing = profile?.achievements || [];

  for (const achievement of ACHIEVEMENTS) {
    if (existing.includes(achievement.id)) continue; // Already earned

    if (achievement.condition(profile, sessionData)) {
      earned.push(achievement);
    }
  }

  return earned;
}

// --- Streak Management ---
export function checkStreakUpdate(lastDate) {
  const today = new Date().toISOString().split('T')[0];
  if (!lastDate) return { shouldIncrement: true, today };

  const last = new Date(lastDate);
  const now = new Date(today);

  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { shouldIncrement: false, today }; // Already practiced today
  if (diffDays === 1) return { shouldIncrement: true, today };   // Consecutive day
  return { shouldIncrement: true, today, streakBroken: diffDays > 1 };
}

// --- Difficulty Detection ---
export function getArmBalanceCount(poses) {
  const armBalanceKeywords = ['Crow', 'Arm', 'Scale', 'Firefly', 'Peacock', 'Eight-Angle', 'Koundinya'];
  return poses.filter(p =>
    armBalanceKeywords.some(k => p.english_name?.includes(k))
  ).length;
}

export function getAdvancedPoseCount(poses) {
  return poses.filter(p => ADVANCED_POSES.includes(p.english_name)).length;
}