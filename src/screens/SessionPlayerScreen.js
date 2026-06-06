import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, Easing } from 'react-native';

export default function SessionPlayerScreen({ navigation, route }) {
  const { session, preMood } = route.params;
  const [timeLeft, setTimeLeft] = useState(session.duration_seconds);
  const [isActive, setIsActive] = useState(true);
  const [breathPhase, setBreathPhase] = useState('Inhale');
  const [phaseSeconds, setBreathPhaseSeconds] = useState(4);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (session.type === 'breathing') {
      runBreathCycle();
    }
  }, []);

  const runBreathCycle = () => {
    // 4-7-8 pattern for demo if not specified
    const pattern = session.instructions || [
      { text: 'Inhale', duration: 4 },
      { text: 'Hold', duration: 7 },
      { text: 'Exhale', duration: 8 },
    ];

    let currentIdx = 0;

    const nextPhase = () => {
      if (!isActive) return;
      
      const phase = pattern[currentIdx];
      setBreathPhase(phase.text);
      setBreathPhaseSeconds(phase.duration);

      // Animation
      if (phase.text.toLowerCase().includes('in')) {
        Animated.timing(scaleAnim, {
          toValue: 2,
          duration: phase.duration * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      } else if (phase.text.toLowerCase().includes('out')) {
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: phase.duration * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      }

      setTimeout(() => {
        currentIdx = (currentIdx + 1) % pattern.length;
        nextPhase();
      }, phase.duration * 1000);
    };

    nextPhase();
  };

  const handleComplete = () => {
    setIsActive(false);
    navigation.navigate('MoodCheckIn', { session, type: 'post', preMood });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{session.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.playerContent}>
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.breathCircle,
              { transform: [{ scale: scaleAnim }] }
            ]}
          />
          <View style={styles.textContainer}>
            <Text style={styles.phaseText}>{breathPhase}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${((session.duration_seconds - timeLeft) / session.duration_seconds) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => setIsActive(!isActive)}
          >
            <Text style={styles.controlButtonText}>{isActive ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, styles.finishButton]} 
            onPress={handleComplete}
          >
            <Text style={styles.controlButtonText}>Finish Early</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2A3A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backText: {
    color: '#A0AEC0',
    fontSize: 16,
  },
  title: {
    color: '#F7F4EF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 40,
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    width: 300,
  },
  breathCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(74, 144, 217, 0.3)',
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  phaseText: {
    color: '#F7F4EF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90D9',
  },
  timerText: {
    color: '#A0AEC0',
    fontSize: 18,
  },
  controls: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 0.45,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: 'rgba(212, 168, 67, 0.2)',
  },
  controlButtonText: {
    color: '#F7F4EF',
    fontSize: 14,
    fontWeight: '600',
  },
});
