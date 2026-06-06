import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POSES, ROCKET_SEQUENCES, BODY_PARTS, searchPoses } from '../data/poses';
import { getModifications, getExperienceGuidance } from '../engine/modificationEngine';
import { saveSequence, loadSequences, deleteSequence } from '../services/sequenceStorage';
import { useAuth } from '../context/AuthContext';

export default function SequenceBuilderScreen({ navigation }) {
  const { user } = useAuth();
  const [sequenceName, setSequenceName] = useState('My Rocket Sequence');
  const [poses, setPoses] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState(0);
  const [activeFilters, setActiveFilters] = useState([]);
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [showPosePicker, setShowPosePicker] = useState(false);
  const [poseSearch, setPoseSearch] = useState('');
  const [bodyPartFilter, setBodyPartFilter] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedSequences, setSavedSequences] = useState([]);
  const [isLoadingSequences, setIsLoadingSequences] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addPose = useCallback((pose) => {
    setPoses(prev => [...prev, { ...pose, duration: 5, key: `${pose.english_name}-${Date.now()}` }]);
    setShowPosePicker(false);
    setPoseSearch('');
  }, []);

  const removePose = useCallback((index) => {
    setPoses(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateDuration = useCallback((index, delta) => {
    setPoses(prev => prev.map((p, i) =>
      i === index ? { ...p, duration: Math.max(1, Math.min(60, (p.duration || 5) + delta)) } : p
    ));
  }, []);

  const movePose = useCallback((fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= poses.length) return;
    setPoses(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, [poses.length]);

  const toggleFilter = useCallback((filterId) => {
    setActiveFilters(prev =>
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  }, []);

  const filteredPoses = useMemo(() => {
    let list = POSES;
    if (poseSearch.trim()) list = searchPoses(poseSearch);
    if (selectedSequence > 0) list = list.filter(p => p.rocket_sequences.includes(selectedSequence));
    if (bodyPartFilter) list = list.filter(p => p.target_body_parts.includes(bodyPartFilter));
    return list;
  }, [poseSearch, selectedSequence, bodyPartFilter]);

  const modifications = useMemo(() => {
    const result = {};
    for (const pose of poses) {
      const mods = getModifications(pose, activeFilters, experienceLevel);
      if (mods) result[pose.english_name] = mods;
    }
    return result;
  }, [poses, activeFilters, experienceLevel]);

  const guidance = getExperienceGuidance(experienceLevel);

  const totalDuration = poses.reduce((sum, p) => sum + (p.duration || 5), 0);

  // Load saved sequences from storage
  const fetchSavedSequences = useCallback(async () => {
    setIsLoadingSequences(true);
    const sequences = await loadSequences(user?.id);
    setSavedSequences(sequences);
    setIsLoadingSequences(false);
  }, [user]);

  // Open load modal and fetch sequences
  const openLoadModal = useCallback(() => {
    setShowLoadModal(true);
    fetchSavedSequences();
  }, [fetchSavedSequences]);

  // Build sequence data object
  const buildSequenceData = useCallback(() => ({
    id: `${Date.now()}`,
    name: sequenceName,
    rocketSequence: selectedSequence,
    experienceLevel,
    filters: activeFilters,
    poses: poses.map((p, i) => ({
      order: i + 1,
      english_name: p.english_name,
      sanskrit_name: p.sanskrit_name,
      duration: p.duration || 5,
      target_body_parts: p.target_body_parts,
    })),
    totalDuration,
    createdAt: new Date().toISOString(),
  }), [sequenceName, selectedSequence, experienceLevel, activeFilters, poses, totalDuration]);

  // Save sequence to cloud/local storage
  const handleSave = useCallback(async () => {
    if (poses.length === 0) {
      Alert.alert('Empty Sequence', 'Add at least one pose before saving.');
      return;
    }
    setIsSaving(true);
    const sequence = buildSequenceData();
    const result = await saveSequence(sequence, user?.id);
    setIsSaving(false);
    if (result.success) {
      Alert.alert('Sequence Saved', `"${sequenceName}" saved with ${poses.length} poses and ${totalDuration} total breaths.`);
    } else {
      Alert.alert('Save Error', 'Could not save the sequence. Please try again.');
    }
  }, [buildSequenceData, sequenceName, poses.length, totalDuration, user]);

  // Load a sequence from the saved list
  const handleLoadSequence = useCallback((seq) => {
    setSequenceName(seq.name || 'Loaded Sequence');
    setPoses(seq.poses.map((p, i) => ({
      ...p,
      key: `${p.english_name}-${Date.now()}-${i}`,
    })));
    setShowLoadModal(false);
  }, []);

  // Delete a saved sequence
  const handleDeleteSequence = useCallback(async (seq) => {
    await deleteSequence(seq.id, seq.cloud);
    fetchSavedSequences();
  }, [fetchSavedSequences]);

  // Export sequence as JSON alert (existing functionality)
  const handleExport = useCallback(() => {
    const sequence = buildSequenceData();
    Alert.alert('Sequence Data', JSON.stringify(sequence, null, 2).substring(0, 500) + '...\n\n(Full JSON logged to console)');
    console.log('Exported Sequence:', JSON.stringify(sequence, null, 2));
  }, [buildSequenceData]);

  const renderPoseItem = ({ item, index }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 12,
      marginVertical: 3,
      marginHorizontal: 16,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    }}>
      <TouchableOpacity
        onPress={() => movePose(index, index - 1)}
        disabled={index === 0}
        style={{ padding: 4, opacity: index === 0 ? 0.3 : 1 }}
      >
        <Ionicons name="chevron-up" size={18} color="#666" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => movePose(index, index + 1)}
        disabled={index === poses.length - 1}
        style={{ padding: 4, opacity: index === poses.length - 1 ? 0.3 : 1 }}
      >
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>

      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF6B35',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
      }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{index + 1}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: '#2C2C2C' }}>{item.english_name}</Text>
        <Text style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>{item.sanskrit_name}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
        <TouchableOpacity onPress={() => updateDuration(index, -1)} style={{
          width: 28, height: 28, borderRadius: 8, backgroundColor: '#f3f3f3',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="remove" size={16} color="#666" />
        </TouchableOpacity>
        <Text style={{ width: 28, textAlign: 'center', fontWeight: '600', fontSize: 13 }}>{item.duration || 5}</Text>
        <TouchableOpacity onPress={() => updateDuration(index, 1)} style={{
          width: 28, height: 28, borderRadius: 8, backgroundColor: '#f3f3f3',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="add" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => removePose(index)} style={{ padding: 6 }}>
        <Ionicons name="trash-outline" size={18} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  const renderFilterChip = (filter) => {
    const isActive = activeFilters.includes(filter.id);
    return (
      <TouchableOpacity
        key={filter.id}
        onPress={() => toggleFilter(filter.id)}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          marginRight: 6,
          marginBottom: 6,
          backgroundColor: isActive ? '#FFB347' : '#f3f3f3',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '500', color: isActive ? '#fff' : '#666' }}>
          {filter.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F3EE' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#2C2C2C' }}>Sequence Builder</Text>
          <View style={{ width: 24 }} />
        </View>

        <TextInput
          value={sequenceName}
          onChangeText={setSequenceName}
          style={{
            fontSize: 20, fontWeight: '700', color: '#2C2C2C', marginTop: 8,
            borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4,
          }}
          placeholder="My Rocket Sequence"
          placeholderTextColor="#ccc"
        />

        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {poses.length} pose{poses.length !== 1 ? 's' : ''} · {totalDuration} total breaths
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Experience Level */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2C2C2C', marginBottom: 6 }}>Experience Level</Text>
          <View style={{ flexDirection: 'row' }}>
            {['beginner', 'intermediate', 'advanced'].map(level => (
              <TouchableOpacity
                key={level}
                onPress={() => setExperienceLevel(level)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  marginHorizontal: 2,
                  alignItems: 'center',
                  backgroundColor: experienceLevel === level ? '#FF6B35' : '#f3f3f3',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: experienceLevel === level ? '#fff' : '#666' }}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 11, color: '#004E89', marginTop: 4, fontStyle: 'italic' }}>{guidance}</Text>
        </View>

        {/* Injury Filters */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2C2C2C', marginBottom: 6 }}>Injury Filters</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[{ id: 'wrist', label: 'Wrist' }, { id: 'knee', label: 'Knee' }, { id: 'back', label: 'Back' },
              { id: 'shoulder', label: 'Shoulder' }, { id: 'neck', label: 'Neck' }, { id: 'hamstring', label: 'Hamstring' },
            ].map(renderFilterChip)}
          </View>
        </View>

        {/* Modifications Banner */}
        {Object.keys(modifications).length > 0 && (
          <View style={{ marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: '#FFF3E0', borderRadius: 12, borderWidth: 1, borderColor: '#FFE0B2' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E65100', marginBottom: 6 }}>
              ⚠️ {Object.keys(modifications).length} pose{Object.keys(modifications).length > 1 ? 's' : ''} modified
            </Text>
            {Object.entries(modifications).slice(0, 4).map(([poseName, mods]) => (
              <Text key={poseName} style={{ fontSize: 11, color: '#BF360C', marginBottom: 2 }}>
                • {poseName}: {mods[0]?.note}
              </Text>
            ))}
          </View>
        )}

        {/* Sequence Actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowPosePicker(true)}
            style={{
              flex: 1, backgroundColor: '#FF6B35', paddingVertical: 12, borderRadius: 12,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
            }}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 4 }}>Add Pose</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: '#004E89', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
              alignItems: 'center', flexDirection: 'row',
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 4 }}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openLoadModal}
            style={{
              backgroundColor: '#1A659E', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
              alignItems: 'center', flexDirection: 'row',
            }}
          >
            <Ionicons name="cloud-download-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, marginLeft: 4 }}>Load</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPoses([])}
            style={{
              backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
              borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Sequence List */}
        {poses.length === 0 ? (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Ionicons name="fitness-outline" size={48} color="#ddd" />
            <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              Your sequence is empty.{'\n'}Tap "Add Pose" to start building.
            </Text>
          </View>
        ) : (
          <View style={{ paddingTop: 8, paddingBottom: 40 }}>
            {poses.map((pose, index) => (
              <View key={pose.key || `${pose.english_name}-${index}`}>
                {renderPoseItem({ item: pose, index })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pose Picker Modal */}
      <Modal visible={showPosePicker} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F3EE' }}>
          <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#2C2C2C' }}>Pose Library</Text>
              <TouchableOpacity onPress={() => setShowPosePicker(false)}>
                <Ionicons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={poseSearch}
              onChangeText={setPoseSearch}
              placeholder="Search poses..."
              placeholderTextColor="#ccc"
              style={{
                marginTop: 8, backgroundColor: '#f3f3f3', borderRadius: 10, padding: 10,
                fontSize: 14,
              }}
            />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <View style={{ flex: 1, marginRight: 4 }}>
                <TouchableOpacity
                  onPress={() => setSelectedSequence(selectedSequence ? 0 : 0)}
                  style={{ padding: 8, backgroundColor: '#f3f3f3', borderRadius: 8, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12 }}>All Sequences</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, marginLeft: 4 }}>
                <TouchableOpacity
                  onPress={() => setBodyPartFilter(bodyPartFilter ? '' : '')}
                  style={{ padding: 8, backgroundColor: '#f3f3f3', borderRadius: 8, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12 }}>All Body Parts</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <FlatList
            data={filteredPoses}
            keyExtractor={(item) => item.english_name}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => addPose(item)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#fff',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: '#2C2C2C' }}>{item.english_name}</Text>
                  <Text style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>{item.sanskrit_name}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    {item.rocket_sequences.map(sq => (
                      <View key={sq} style={{
                        backgroundColor: '#004E89', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>R{sq}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Ionicons name="add-circle" size={24} color="#FF6B35" />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </SafeAreaView>
      </Modal>

      {/* Load Sequence Modal */}
      <Modal visible={showLoadModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F3EE' }}>
          <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#2C2C2C' }}>My Sequences</Text>
              <TouchableOpacity onPress={() => setShowLoadModal(false)}>
                <Ionicons name="close" size={24} color="#2C2C2C" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {savedSequences.length} saved sequence{savedSequences.length !== 1 ? 's' : ''}
              {savedSequences.some(s => s.cloud) ? ' • Cloud sync active' : ' • Local storage'}
            </Text>
          </View>

          {isLoadingSequences ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{ color: '#999', marginTop: 8 }}>Loading sequences...</Text>
            </View>
          ) : savedSequences.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <Ionicons name="cloud-outline" size={48} color="#ddd" />
              <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                No saved sequences yet.{'\n'}Build and save a sequence to see it here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedSequences}
              keyExtractor={(item, idx) => item.id || `${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleLoadSequence(item)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: '#2C2C2C' }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {item.poses?.length || 0} poses · {item.totalDuration || 0} breaths
                      {item.cloud ? ' ☁️' : ' 📱'}
                    </Text>
                    {item.createdAt && (
                      <Text style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Delete Sequence', `Delete "${item.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteSequence(item) },
                      ]);
                    }}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ccc" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}