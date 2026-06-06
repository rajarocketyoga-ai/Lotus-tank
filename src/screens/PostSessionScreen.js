import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import {
  calculateXP, getLevel, getLevelTitle,
  getProgressToNextLevel, getXPForNextLevel,
  checkAchievements, getAdvancedPoseCount,
} from '../engine/gamificationEngine';
import { ACHIEVEMENTS } from '../data/achievements';

export default function PostSessionScreen({ navigation, route }) {
  const { session, preMood, postMood } = route.params || {};
  const { profile, updateXP, updateProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [xpGained, setXpGained] = useState(0);
  const [newAchievements, setNewAchievements] = useState([]);
  const [newLevel, setNewLevel] = useState(null);

  useEffect(() => {
    async function processRewards() {
      // Calculate XP using the full formula
      const total = calculateXP(session, preMood, postMood);
      setXpGained(total);

      // Check new achievements
      const sessionData = {
        poses: session?.poses || [],
        armBalanceCount: getAdvancedPoseCount(session?.poses || []),
        rocketTemplateCompletions: profile?.rocket_template_completions || {},
      };
      const earned = checkAchievements(profile, sessionData);
      setNewAchievements(earned);

      // Calculate new level
      const oldLevel = profile?.level || 1;
      const newLvl = getLevel((profile?.total_xp || 0) + total);
      if (newLvl > oldLevel) setNewLevel(newLvl);

      // Update Supabase
      await updateXP(total);

      // If achievements earned, add their XP too
      if (earned.length > 0) {
        const achievementsXP = earned.reduce((sum, a) => sum + (a.rewardXP || 0), 0);
        await updateXP(achievementsXP);
      }

      setLoading(false);
    }
    processRewards();
  }, []);

  const getAIInsight = () => {
    const shift = (postMood || 3) - (preMood || 3);
    if (shift > 0) return `Great work! Your mood improved from ${preMood}/5 to ${postMood}/5. This session really helped!`;
    if (shift === 0) return "Consistency is key. Even subtle shifts accumulate over time.";
    return "It's okay to feel low. Showing up is the real victory here.";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Calculating rewards...</Text>
      </View>
    );
  }

  const progress = getProgressToNextLevel(profile?.total_xp || 0);
  const nextLevelXP = getXPForNextLevel(profile?.total_xp || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.congrats}>🎉 Session Complete!</Text>

        {/* XP Reward Card */}
        <View style={styles.rewardCard}>
          <Text style={styles.xpAmount}>+{xpGained} XP</Text>
          <View style={styles.xpBreakdown}>
            <Text style={styles.xpBreakdownText}>
              Base {10} + {session?.poses?.length || 0} poses + {getAdvancedPoseCount(session?.poses || 0)} advanced
            </Text>
            {session?.name?.includes('Rocket') && (
              <Text style={styles.xpBreakdownText}>🏆 Rocket template bonus +5</Text>
            )}
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>
            Level {profile?.level || 1} — {getLevelTitle(profile?.level || 1)}
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{nextLevelXP} XP to next level</Text>
        </View>

        {/* New Level Unlock */}
        {newLevel && (
          <View style={styles.levelUpCard}>
            <Text style={styles.levelUpEmoji}>⭐</Text>
            <Text style={styles.levelUpTitle}>Level Up!</Text>
            <Text style={styles.levelUpText}>You reached Level {newLevel} — {getLevelTitle(newLevel)}</Text>
          </View>
        )}

        {/* New Achievements */}
        {newAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.achievementsSectionTitle}>🏅 New Achievements Unlocked!</Text>
            {newAchievements.map((ach) => (
              <View key={ach.id} style={styles.achievementCard}>
                <Text style={styles.achievementEmoji}>{ach.emoji}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{ach.name}</Text>
                  <Text style={styles.achievementDesc}>{ach.description}</Text>
                </View>
                <Text style={styles.achievementXP}>+{ach.rewardXP} XP</Text>
              </View>
            ))}
          </View>
        )}

        {/* Streak */}
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={20} color="#FF6B35" />
          <Text style={styles.streakText}>
            {profile?.current_streak || 0}-day streak 🔥
          </Text>
        </View>

        {/* AI Insight */}
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>🤖 Coach Insight</Text>
          <Text style={styles.aiText}>{getAIInsight()}</Text>
        </View>

        {/* Mood Comparison */}
        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>Mood Shift</Text>
          <View style={styles.moodRow}>
            <Text style={styles.moodLabel}>Before</Text>
            <Text style={styles.moodValue}>{'😢😕😐🙂😊'[preMood - 1] || '😐'}</Text>
            <Ionicons name="arrow-forward" size={16} color="#666" />
            <Text style={styles.moodLabel}>After</Text>
            <Text style={styles.moodValue}>{'😢😕😐🙂😊'[postMood - 1] || '😐'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2A3A' },
  loadingContainer: { flex: 1, backgroundColor: '#1A2A3A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#F7F4EF', marginTop: 20 },
  scrollContent: { padding: 20, alignItems: 'center' },
  congrats: { fontSize: 28, fontWeight: 'bold', color: '#F7F4EF', marginBottom: 20, marginTop: 20 },
  rewardCard: {
    backgroundColor: 'rgba(212, 168, 67, 0.1)', borderWidth: 1, borderColor: '#D4A843',
    padding: 20, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 16,
  },
  xpAmount: { fontSize: 42, fontWeight: 'bold', color: '#D4A843', marginBottom: 8 },
  xpBreakdown: { alignItems: 'center' },
  xpBreakdownText: { color: '#A0AEC0', fontSize: 11, marginBottom: 2 },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 14,
    width: '100%', marginBottom: 16,
  },
  levelTitle: { color: '#F7F4EF', fontWeight: 'bold', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  progressBarBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3,
    overflow: 'hidden', marginBottom: 6,
  },
  progressBarFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 3 },
  progressText: { color: '#A0AEC0', fontSize: 11, textAlign: 'center' },
  levelUpCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)', borderWidth: 1, borderColor: '#FF6B35',
    padding: 16, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 16,
  },
  levelUpEmoji: { fontSize: 32, marginBottom: 4 },
  levelUpTitle: { color: '#FF6B35', fontWeight: 'bold', fontSize: 18, marginBottom: 2 },
  levelUpText: { color: '#F7F4EF', fontSize: 13 },
  achievementsSection: { width: '100%', marginBottom: 16 },
  achievementsSectionTitle: { color: '#D4A843', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  achievementCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12, borderRadius: 12, marginBottom: 6,
  },
  achievementEmoji: { fontSize: 24, marginRight: 12 },
  achievementInfo: { flex: 1 },
  achievementName: { color: '#F7F4EF', fontWeight: '600', fontSize: 13 },
  achievementDesc: { color: '#A0AEC0', fontSize: 11 },
  achievementXP: { color: '#D4A843', fontWeight: 'bold', fontSize: 12 },
  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)', padding: 12, borderRadius: 12,
    width: '100%', marginBottom: 16,
  },
  streakText: { color: '#FF6B35', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  aiCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 14,
    width: '100%', marginBottom: 16,
  },
  aiTitle: { color: '#4A90D9', fontWeight: 'bold', marginBottom: 8 },
  aiText: { color: '#F7F4EF', lineHeight: 20, fontSize: 13 },
  moodCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 14,
    width: '100%', marginBottom: 16,
  },
  moodTitle: { color: '#A0AEC0', fontWeight: '600', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  moodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  moodLabel: { color: '#999', fontSize: 12, marginHorizontal: 8 },
  moodValue: { fontSize: 20 },
  button: {
    backgroundColor: '#FF6B35', paddingVertical: 14, paddingHorizontal: 60,
    borderRadius: 30, marginBottom: 30,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});