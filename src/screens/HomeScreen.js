import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getDailyChallenge } from '../data/sessions';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const dailyChallenge = getDailyChallenge(profile?.niche || 'general');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const startDailyChallenge = () => {
    navigation.navigate('MoodCheckIn', { session: dailyChallenge, type: 'pre' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>CALM QUEST</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOut}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.greeting}>Good morning, {profile?.username || user?.email?.split('@')[0]}!</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>🔥 {profile?.current_streak || 0}-day streak</Text>
            <Text style={styles.statText}>Lvl {profile?.level || 1}</Text>
          </View>
          <View style={styles.xpBarBackground}>
            <View style={[styles.xpBarFill, { width: `${(profile?.total_xp % 100) || 0}%` }]} />
          </View>
          <Text style={styles.xpText}>{100 - (profile?.total_xp % 100 || 0)} XP to next level</Text>
          
          <TouchableOpacity 
            style={styles.coachButton} 
            onPress={() => navigation.navigate('AICoach')}
          >
            <Text style={styles.coachButtonText}>👑 Daily Mindset Affirmation</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.challengeCard}>
          <Text style={styles.challengeLabel}>⭐ DAILY CHALLENGE</Text>
          <Text style={styles.challengeTitle}>"{dailyChallenge.title}"</Text>
          <Text style={styles.challengeMeta}>🌬️ {Math.floor(dailyChallenge.duration_seconds / 60)} min  •  +{dailyChallenge.xp} XP</Text>
          <Text style={styles.aiTag}>✨ AI Recommended</Text>
          
          <TouchableOpacity style={styles.startButton} onPress={startDailyChallenge}>
            <Text style={styles.startButtonText}>▶ Start</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessRow}>
          <TouchableOpacity style={styles.quickButton}>
            <Text style={styles.quickEmoji}>🌬️</Text>
            <Text style={styles.quickText}>Breath</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton}>
            <Text style={styles.quickEmoji}>🧘</Text>
            <Text style={styles.quickText}>Meditate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton}>
            <Text style={styles.quickEmoji}>🤸</Text>
            <Text style={styles.quickText}>Move</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gardenPreview}>
          <Text style={styles.gardenTitle}>🌿 Mind Garden Mini</Text>
          <Text style={styles.gardenPlants}>🌱🌻🌱🌸🌱</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2A3A',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F7F4EF',
    letterSpacing: 2,
  },
  signOut: {
    color: '#A0AEC0',
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7F4EF',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#D4A843',
    borderRadius: 4,
  },
  xpText: {
    color: '#A0AEC0',
    fontSize: 12,
  },
  coachButton: {
    marginTop: 15,
    backgroundColor: 'rgba(212, 168, 67, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4A843',
    alignItems: 'center',
  },
  coachButtonText: {
    color: '#D4A843',
    fontWeight: 'bold',
    fontSize: 14,
  },
  challengeCard: {
    backgroundColor: '#F7F4EF',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  challengeLabel: {
    color: '#D4A843',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2A3A',
    marginBottom: 5,
  },
  challengeMeta: {
    color: '#666',
    marginBottom: 10,
  },
  aiTag: {
    fontSize: 12,
    color: '#4A90D9',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#1A2A3A',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#F7F4EF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#F7F4EF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    flex: 0.3,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  quickEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  quickText: {
    color: '#F7F4EF',
    fontSize: 12,
  },
  gardenPreview: {
    backgroundColor: 'rgba(123, 200, 164, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(123, 200, 164, 0.3)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  gardenTitle: {
    color: '#7BC8A4',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  gardenPlants: {
    fontSize: 20,
    letterSpacing: 5,
  }
});
