import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabase';

export default function PostSessionScreen({ navigation, route }) {
  const { session, preMood, postMood } = route.params;
  const { profile, updateXP, updateStreak } = useProfile();
  const [loading, setLoading] = useState(true);
  const [xpGained, setXpGained] = useState(0);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    async function processRewards() {
      const baseXP = session.xp || 10;
      const moodBonus = 3;
      const total = baseXP + moodBonus;
      
      setXpGained(total);
      await updateXP(total);
      await updateStreak();
      setLoading(false);
    }
    processRewards();
  }, []);

  useEffect(() => {
    async function getRealAIInsight() {
      try {
        setAiLoading(true);
        const { data, error } = await supabase.functions.invoke('mindset-coach', {
          body: {
            preMood,
            postMood,
            sessionTitle: session.title,
            sessionType: session.type,
            niche: profile?.niche || 'general',
            userName: profile?.username || profile?.email?.split('@')[0] || 'Warrior'
          }
        });

        if (error) throw error;
        setAiInsight(data.insight);
      } catch (err) {
        console.error('Error getting AI insight:', err);
        setAiInsight(getFallbackInsight());
      } finally {
        setAiLoading(false);
      }
    }

    if (profile && !loading) {
      getRealAIInsight();
    }
  }, [profile, loading]);

  const getFallbackInsight = () => {
    const shift = postMood - preMood;
    if (shift > 0) {
      return `Great work! Your mood improved from ${preMood} to ${postMood}. This session really helped you center yourself.`;
    } else if (shift === 0) {
      return "Consistency is key. Even when you don't feel a big shift immediately, your mind is benefiting from the stillness.";
    } else {
      return "It's okay to feel low sometimes. The fact that you showed up for yourself today is a win. Take it easy.";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Saving your progress...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.congrats}>🎉 Session Complete!</Text>
        
        <View style={styles.rewardCard}>
          <Text style={styles.xpAmount}>+{xpGained} XP</Text>
          <Text style={styles.rewardText}>Streak: {profile?.current_streak} Days 🔥</Text>
          <Text style={styles.rewardText}>Level {profile?.level}</Text>
        </View>

        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>🤖 AI Coach Insight</Text>
          {aiLoading ? (
            <ActivityIndicator size="small" color="#4A90D9" />
          ) : (
            <Text style={styles.aiText}>{aiInsight}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2A3A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A2A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#F7F4EF',
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congrats: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F7F4EF',
    marginBottom: 30,
  },
  rewardCard: {
    backgroundColor: 'rgba(212, 168, 67, 0.1)',
    borderWidth: 1,
    borderColor: '#D4A843',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  xpAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#D4A843',
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 18,
    color: '#F7F4EF',
    marginBottom: 5,
  },
  aiCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 40,
  },
  aiTitle: {
    color: '#4A90D9',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aiText: {
    color: '#F7F4EF',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4A90D9',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
