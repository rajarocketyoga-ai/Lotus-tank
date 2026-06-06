import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

const MOODS = [
  { emoji: '😢', label: 'Sad', value: 1 },
  { emoji: '😕', label: 'Meh', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😊', label: 'Happy', value: 5 },
];

export default function MoodCheckInScreen({ navigation, route }) {
  const { session, type } = route.params; // type: 'pre' or 'post'
  const [selectedMood, setSelectedMood] = useState(3);

  const handleContinue = () => {
    if (type === 'pre') {
      navigation.navigate('SessionPlayer', { session, preMood: selectedMood });
    } else {
      navigation.navigate('PostSession', { session, preMood: route.params.preMood, postMood: selectedMood });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {type === 'pre' ? 'How are you feeling right now?' : 'How do you feel now?'}
        </Text>
        
        <View style={styles.moodContainer}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.moodButton,
                selectedMood === mood.value && styles.selectedMoodButton
              ]}
              onPress={() => setSelectedMood(mood.value)}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
              <Text style={[
                styles.moodLabel,
                selectedMood === mood.value && styles.selectedMoodLabel
              ]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {type === 'pre' ? 'Start Session' : 'See Rewards'}
          </Text>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F7F4EF',
    marginBottom: 40,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 60,
  },
  moodButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    flex: 1,
  },
  selectedMoodButton: {
    backgroundColor: 'rgba(74, 144, 217, 0.2)',
    borderWidth: 1,
    borderColor: '#4A90D9',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  selectedMoodLabel: {
    color: '#4A90D9',
    fontWeight: 'bold',
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
