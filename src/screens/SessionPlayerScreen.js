import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView,
  Animated, Easing, FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SessionPlayerScreen({ navigation, route }) {
  const { session: sequence, preMood } = route.params || {};
  const poses = sequence?.poses || [];

  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const breathTimerRef = useRef(null);

  const currentPose = poses[currentPoseIndex];
  const totalBreaths = currentPose?.duration || 5;
  const isLastPose = currentPoseIndex >= poses.length - 1;
  const totalPoses = poses.length;

  // Reset animation when pose changes
  useEffect(() => {
    scaleAnim.setValue(1);
    setBreathCount(0);
  }, [currentPoseIndex]);

  // Breath timer
  useEffect(() => {
    if (!isActive || isComplete || !currentPose) return;

    const breathDuration = 4000; // 4 seconds per breath

    // Inhale animation
    Animated.timing(scaleAnim, {
      toValue: 1.5,
      duration: breathDuration / 2,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Exhale after inhale completes
    const exhaleTimer = setTimeout(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: breathDuration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, breathDuration / 2);

    // Advance breath count
    breathTimerRef.current = setTimeout(() => {
      const nextBreath = breathCount + 1;
      if (nextBreath >= totalBreaths) {
        // Move to next pose
        if (isLastPose) {
          handleComplete();
        } else {
          setCurrentPoseIndex(prev => prev + 1);
        }
      } else {
        setBreathCount(nextBreath);
      }
    }, breathDuration);

    return () => {
      clearTimeout(exhaleTimer);
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
      scaleAnim.stopAnimation();
    };
  }, [currentPoseIndex, breathCount, isActive, isComplete]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    setIsActive(false);
    navigation.navigate('MoodCheckIn', { session: sequence, type: 'post', preMood });
  }, [navigation, sequence, preMood]);

  const handleNext = () => {
    if (isLastPose) {
      handleComplete();
    } else {
      setCurrentPoseIndex(prev => prev + 1);
      setBreathCount(0);
    }
  };

  const handlePrevious = () => {
    if (currentPoseIndex > 0) {
      setCurrentPoseIndex(prev => prev - 1);
      setBreathCount(0);
    }
  };

  const handleStop = () => {
    navigation.goBack();
  };

  const togglePause = () => {
    setIsActive(prev => !prev);
  };

  const progressPercent = totalPoses > 0
    ? ((currentPoseIndex + (breathCount / totalBreaths)) / totalPoses) * 100
    : 0;

  // If no poses, show a placeholder
  if (!poses || poses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#A0AEC0', fontSize: 16 }}>No poses in this sequence</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStop} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#A0AEC0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sequence?.name || 'Practice'}
        </Text>
        <TouchableOpacity onPress={handleComplete} style={styles.headerButton}>
          <Text style={styles.finishEarlyText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentPoseIndex + 1}/{totalPoses}
        </Text>
      </View>

      {/* Pose Display */}
      <View style={styles.poseContainer}>
        {/* Pose Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.poseIcon}>🧘</Text>
        </View>

        {/* Pose Name */}
        <Text style={styles.poseName}>{currentPose?.english_name || 'Rest'}</Text>
        <Text style={styles.poseSanskrit}>{currentPose?.sanskrit_name || ''}</Text>

        {/* Breath Circle Animation */}
        <View style={styles.breathContainer}>
          <Animated.View
            style={[styles.breathCircle, { transform: [{ scale: scaleAnim }] }]}
          />
          <View style={styles.breathTextContainer}>
            <Text style={styles.breathLabel}>
              {breathCount < totalBreaths ? 'Breathe' : 'Hold'}
            </Text>
            <Text style={styles.breathCount}>
              {breathCount + 1} / {totalBreaths}
            </Text>
          </View>
        </View>

        {/* Cue */}
        {currentPose?.cue && (
          <Text style={styles.cueText}>{currentPose.cue}</Text>
        )}

        {/* Body parts */}
        {currentPose?.target_body_parts && currentPose.target_body_parts.length > 0 && (
          <View style={styles.tagsRow}>
            {currentPose.target_body_parts.slice(0, 3).map(bp => (
              <View key={bp} style={styles.bodyPartTag}>
                <Text style={styles.bodyPartTagText}>{bp}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentPoseIndex === 0}
          style={[styles.sideButton, currentPoseIndex === 0 && styles.disabledButton]}
        >
          <Ionicons name="play-skip-back" size={24} color={currentPoseIndex === 0 ? '#555' : '#fff'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePause} style={styles.centerButton}>
          <Ionicons name={isActive ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.sideButton}>
          <Ionicons name="play-skip-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Pose List Preview */}
      <View style={styles.poseStripContainer}>
        <FlatList
          data={poses}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => { setCurrentPoseIndex(index); setBreathCount(0); }}
              style={[
                styles.poseStripItem,
                index === currentPoseIndex && styles.poseStripItemActive,
              ]}
            >
              <Text style={[
                styles.poseStripNumber,
                index === currentPoseIndex && styles.poseStripNumberActive,
              ]}>
                {index + 1}
              </Text>
              <Text style={[
                styles.poseStripName,
                index === currentPoseIndex && styles.poseStripNameActive,
              ]} numberOfLines={1}>
                {item.english_name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, idx) => `${idx}`}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#F7F4EF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  finishEarlyText: {
    color: '#D4A843',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  poseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  poseIcon: {
    fontSize: 36,
  },
  poseName: {
    color: '#F7F4EF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  poseSanskrit: {
    color: '#A0AEC0',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  breathContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  breathCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
    position: 'absolute',
  },
  breathTextContainer: {
    alignItems: 'center',
  },
  breathLabel: {
    color: '#A0AEC0',
    fontSize: 14,
    marginBottom: 4,
  },
  breathCount: {
    color: '#FF6B35',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cueText: {
    color: '#A0AEC0',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bodyPartTag: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    margin: 3,
  },
  bodyPartTagText: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '500',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.4,
  },
  centerButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poseStripContainer: {
    paddingBottom: 16,
    maxHeight: 80,
  },
  poseStripItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    alignItems: 'center',
    width: 70,
  },
  poseStripItemActive: {
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  poseStripNumber: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  poseStripNumberActive: {
    color: '#FF6B35',
  },
  poseStripName: {
    color: '#999',
    fontSize: 8,
    textAlign: 'center',
  },
  poseStripNameActive: {
    color: '#F7F4EF',
  },
});