// Achievement Definitions for Raja Rocket Flow

export const ACHIEVEMENTS = [
  {
    id: 'first-flow',
    name: 'First Flow',
    emoji: '🌱',
    description: 'Complete your first sequence',
    rewardXP: 25,
    condition: (profile) => (profile?.total_sessions || 0) >= 1,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    emoji: '🔥',
    description: '7-day practice streak',
    rewardXP: 50,
    condition: (profile) => (profile?.current_streak || 0) >= 7,
  },
  {
    id: 'moon-rocketeer',
    name: 'Moon Rocketeer',
    emoji: '🌙',
    description: 'Complete 3 evening sessions',
    rewardXP: 30,
    condition: (profile) => (profile?.total_sessions || 0) >= 3, // Simplified
  },
  {
    id: 'rocket1-grad',
    name: 'Rocket 1 Graduate',
    emoji: '🚀',
    description: 'Complete Rocket 1 template 3 times',
    rewardXP: 100,
    condition: (profile, sessionData) =>
      sessionData?.rocketTemplateCompletions?.['Rocket 1'] >= 3,
  },
  {
    id: 'rocket2-grad',
    name: 'Rocket 2 Graduate',
    emoji: '🚀',
    description: 'Complete Rocket 2 template 3 times',
    rewardXP: 100,
    condition: (profile, sessionData) =>
      sessionData?.rocketTemplateCompletions?.['Rocket 2'] >= 3,
  },
  {
    id: 'rocket3-grad',
    name: 'Rocket 3 Graduate',
    emoji: '🚀',
    description: 'Complete Rocket 3 template 3 times',
    rewardXP: 100,
    condition: (profile, sessionData) =>
      sessionData?.rocketTemplateCompletions?.['Rocket 3'] >= 3,
  },
  {
    id: 'full-sequence',
    name: 'Full Sequence',
    emoji: '🎯',
    description: 'Complete a session with 30+ poses',
    rewardXP: 75,
    condition: (profile, sessionData) => (sessionData?.poses?.length || 0) >= 30,
  },
  {
    id: 'consistent-yogi',
    name: 'Consistent Yogi',
    emoji: '🧘',
    description: '30-day practice streak',
    rewardXP: 500,
    condition: (profile) => (profile?.current_streak || 0) >= 30,
  },
  {
    id: 'arm-balance-ace',
    name: 'Arm Balance Ace',
    emoji: '💪',
    description: 'Complete 5 arm balance poses in one session',
    rewardXP: 50,
    condition: (profile, sessionData) =>
      (sessionData?.armBalanceCount || 0) >= 5,
  },
  {
    id: 'remix-king',
    name: 'Remix King',
    emoji: '🔄',
    description: 'Remix 5 shared sequences',
    rewardXP: 40,
    condition: (profile) => (profile?.total_remixes || 0) >= 5,
  },
  {
    id: 'teacher',
    name: 'Teacher',
    emoji: '📤',
    description: 'Share 3 sequences publicly',
    rewardXP: 40,
    condition: (profile) => (profile?.total_shares || 0) >= 3,
  },
];

export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getTotalAchievementsXP() {
  return ACHIEVEMENTS.reduce((sum, a) => sum + a.rewardXP, 0);
}