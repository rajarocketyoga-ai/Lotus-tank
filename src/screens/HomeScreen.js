import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getDailyChallenge } from '../data/sessions';
import { loadSequences } from '../services/sequenceStorage';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const dailyChallenge = getDailyChallenge(profile?.niche || 'general');
  const [savedSequences, setSavedSequences] = useState([]);
  const [loadingSequences, setLoadingSequences] = useState(true);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    setLoadingSequences(true);
    const seqs = await loadSequences(user?.id);
    setSavedSequences(seqs.slice(0, 5)); // Show latest 5
    setLoadingSequences(false);
  };

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSequences();
    });
    return unsubscribe;
  }, [navigation]);

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

        <TouchableOpacity
          style={styles.sequenceBuilderButton}
          onPress={() => navigation.navigate('SequenceBuilder')}
        >
          <Text style={styles.sequenceBuilderEmoji}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sequenceBuilderTitle}>Sequence Builder</Text>
            <Text style={styles.sequenceBuilderDesc}>Create custom Rocket yoga flows</Text>
          </View>
          <Text style={styles.sequenceBuilderArrow}>→</Text>
        </TouchableOpacity>

        {/* Discover Button */}
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => navigation.navigate('Discover')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.discoverIcon}>
              <Ionicons name="globe-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.discoverTitle}>Discover Shared Flows</Text>
              <Text style={styles.discoverDesc}>Browse and remix sequences from the community</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </View>
        </TouchableOpacity>

        {/* My Sequences Section */}
        <View style={styles.mySequencesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 My Sequences</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SequenceBuilder')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingSequences ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#FF6B35" />
            </View>
          ) : savedSequences.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No saved sequences yet</Text>
              <Text style={styles.emptySubtext}>Build your first Rocket flow!</Text>
            </View>
          ) : (
            <View>
              {savedSequences.map((seq, index) => (
                <TouchableOpacity
                  key={seq.id || index}
                  onPress={() => navigation.navigate('SequenceBuilder')}
                  style={styles.sequenceListItem}
                >
                  <View style={styles.sequenceIcon}>
                    <Text style={styles.sequenceIconText}>🧘</Text>
                  </View>
                  <View style={styles.sequenceInfo}>
                    <Text style={styles.sequenceName}>{seq.name}</Text>
                    <Text style={styles.sequenceMeta}>
                      {seq.poses?.length || 0} poses · {seq.totalDuration || 0} breaths
                      {seq.cloud ? ' · ☁️' : ' · 📱'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  sequenceBuilderButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sequenceBuilderEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  sequenceBuilderTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sequenceBuilderDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  sequenceBuilderArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  discoverButton: {
    backgroundColor: '#1A659E',
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  discoverIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  discoverTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  discoverDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  mySequencesSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  sequenceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  sequenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sequenceIconText: {
    fontSize: 18,
  },
  sequenceInfo: {
    flex: 1,
  },
  sequenceName: {
    color: '#F7F4EF',
    fontWeight: '600',
    fontSize: 14,
  },
  sequenceMeta: {
    color: '#A0AEC0',
    fontSize: 11,
    marginTop: 2,
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
