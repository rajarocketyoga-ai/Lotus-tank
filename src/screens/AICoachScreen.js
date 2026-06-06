import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';

export default function AICoachScreen({ navigation }) {
  const { profile } = useProfile();
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDailyCoach() {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('mindset-coach', {
          body: {
            type: 'daily-affirmation',
            niche: profile?.niche || 'general',
            userName: profile?.email?.split('@')[0] || 'Warrior'
          }
        });
        if (error) throw error;
        setQuote(data.insight);
      } catch (err) {
        console.error('AI Coach Error:', err);
        setQuote("Your potential is limitless. Every breath is a new beginning. Your quest continues.");
      } finally {
        setLoading(false);
      }
    }
    fetchDailyCoach();
  }, [profile]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>👑 Royal Mindset Coach</Text>
        
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#D4A843" />
            <Text style={styles.loadingText}>Consulting the stars...</Text>
          </View>
        ) : (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>{quote}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Continue My Quest</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2A3A',
  },
  content: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4A843',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingWrapper: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    color: '#F7F4EF',
    marginTop: 15,
    fontStyle: 'italic',
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 168, 67, 0.3)',
    marginBottom: 40,
    width: '100%',
  },
  quoteText: {
    fontSize: 20,
    color: '#F7F4EF',
    lineHeight: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#D4A843',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: '#1A2A3A',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
