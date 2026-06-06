import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const SEQUENCES_STORAGE_KEY = '@raja-rocket/sequences';

// Check if Supabase is configured (has real credentials)
function isSupabaseConfigured() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return url && url !== 'your-project-url.supabase.co' && key && key !== 'your-anon-key';
}

// ---------- Local Storage (AsyncStorage) ----------

async function saveSequenceLocally(sequence) {
  try {
    const stored = await AsyncStorage.getItem(SEQUENCES_STORAGE_KEY);
    const sequences = stored ? JSON.parse(stored) : [];
    sequences.push(sequence);
    await AsyncStorage.setItem(SEQUENCES_STORAGE_KEY, JSON.stringify(sequences));
    return { success: true };
  } catch (error) {
    console.error('Error saving sequence locally:', error);
    return { success: false, error };
  }
}

async function loadLocalSequences() {
  try {
    const stored = await AsyncStorage.getItem(SEQUENCES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading local sequences:', error);
    return [];
  }
}

async function deleteLocalSequence(sequenceId) {
  try {
    const stored = await AsyncStorage.getItem(SEQUENCES_STORAGE_KEY);
    const sequences = stored ? JSON.parse(stored) : [];
    const filtered = sequences.filter(s => s.id !== sequenceId);
    await AsyncStorage.setItem(SEQUENCES_STORAGE_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch (error) {
    console.error('Error deleting local sequence:', error);
    return { success: false, error };
  }
}

// ---------- Supabase (Cloud) Storage ----------

async function saveSequenceToSupabase(sequence, userId) {
  try {
    // 1. Insert the sequence metadata
    const { data: seqData, error: seqError } = await supabase
      .from('sequences')
      .insert({
        user_id: userId,
        title: sequence.name,
        description: `Rocket Sequence ${sequence.rocketSequence || 'Custom'} · ${sequence.poses.length} poses`,
        is_public: false,
      })
      .select()
      .single();

    if (seqError) throw seqError;

    // 2. Insert all sequence poses
    const sequencePoses = sequence.poses.map((pose, index) => ({
      sequence_id: seqData.id,
      pose_english_name: pose.english_name,
      pose_sanskrit_name: pose.sanskrit_name,
      order_index: index + 1,
      duration_seconds: (pose.duration || 5) * 15, // Convert breaths to seconds (approx)
      notes: '',
    }));

    const { error: posesError } = await supabase
      .from('sequence_poses')
      .insert(sequencePoses);

    if (posesError) throw posesError;

    return { success: true, id: seqData.id };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, error };
  }
}

async function loadSequencesFromSupabase(userId) {
  try {
    const { data, error } = await supabase
      .from('sequences')
      .select('*, sequence_poses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(seq => ({
      id: seq.id,
      name: seq.title,
      rocketSequence: 0,
      experienceLevel: 'intermediate',
      filters: [],
      poses: (seq.sequence_poses || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map(sp => ({
          english_name: sp.pose_english_name,
          sanskrit_name: sp.pose_sanskrit_name,
          duration: Math.round(sp.duration_seconds / 15),
        })),
      totalDuration: (seq.sequence_poses || []).reduce((sum, sp) => sum + Math.round(sp.duration_seconds / 15), 0),
      createdAt: seq.created_at,
      cloud: true,
    }));
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    return [];
  }
}

async function deleteSequenceFromSupabase(sequenceId) {
  try {
    const { error } = await supabase
      .from('sequences')
      .delete()
      .eq('id', sequenceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    return { success: false, error };
  }
}

// ---------- Unified Public API ----------

/**
 * Save a sequence. Tries Supabase first if configured, falls back to AsyncStorage.
 */
export async function saveSequence(sequence, userId) {
  if (isSupabaseConfigured() && userId) {
    const result = await saveSequenceToSupabase(sequence, userId);
    if (result.success) return { ...result, cloud: true };
  }
  return await saveSequenceLocally(sequence);
}

/**
 * Load all sequences for a user. Merges cloud and local.
 */
export async function loadSequences(userId) {
  let cloudSequences = [];
  if (isSupabaseConfigured() && userId) {
    cloudSequences = await loadSequencesFromSupabase(userId);
  }
  const localSequences = await loadLocalSequences();

  // Merge: cloud sequences first, then local
  return [...cloudSequences, ...localSequences];
}

/**
 * Delete a sequence. Try Supabase if it's a cloud sequence, else AsyncStorage.
 */
export async function deleteSequence(sequenceId, isCloud = false) {
  if (isCloud && isSupabaseConfigured()) {
    return await deleteSequenceFromSupabase(sequenceId);
  }
  return await deleteLocalSequence(sequenceId);
}
