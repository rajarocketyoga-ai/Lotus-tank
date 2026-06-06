export const MOCK_SESSIONS = [
  {
    id: 's1',
    title: '4-7-8 Breathing',
    type: 'breathing',
    duration_seconds: 300,
    xp: 15,
    niche_tags: ['yoga', 'anxiety', 'general'],
    description: 'A simple technique to reduce anxiety and help you sleep.',
    instructions: [
      { text: 'Breathe in', duration: 4 },
      { text: 'Hold', duration: 7 },
      { text: 'Breathe out', duration: 8 },
    ]
  },
  {
    id: 's2',
    title: 'Box Breathing',
    type: 'breathing',
    duration_seconds: 180,
    xp: 10,
    niche_tags: ['entrepreneur', 'anxiety'],
    description: 'Used by Navy SEALs to stay calm under pressure.',
    instructions: [
      { text: 'Breathe in', duration: 4 },
      { text: 'Hold', duration: 4 },
      { text: 'Breathe out', duration: 4 },
      { text: 'Hold', duration: 4 },
    ]
  },
  {
    id: 's3',
    title: 'Body Scan Meditation',
    type: 'meditation',
    duration_seconds: 600,
    xp: 25,
    niche_tags: ['yoga', 'general'],
    description: 'Focus on each part of your body to release tension.',
  },
  {
    id: 's4',
    title: 'Morning Stretch Flow',
    type: 'movement',
    duration_seconds: 300,
    xp: 15,
    niche_tags: ['yoga', 'entrepreneur', 'general'],
    description: 'Quick movement to wake up your body and mind.',
  },
  {
    id: 's5',
    title: 'Gratitude Focus',
    type: 'meditation',
    duration_seconds: 300,
    xp: 15,
    niche_tags: ['general'],
    description: 'Center yourself on three things you are grateful for.',
  }
];

export const getDailyChallenge = (niche = 'general') => {
  // Simple logic: pick the first one that matches the niche and day of year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const nicheSessions = MOCK_SESSIONS.filter(s => s.niche_tags.includes(niche));
  return nicheSessions[dayOfYear % nicheSessions.length];
};
