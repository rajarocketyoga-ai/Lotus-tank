import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHARED_SLUGS_KEY = '@raja-rocket/shared-slugs';

// Check if Supabase is configured
function isSupabaseConfigured() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return url && url !== 'your-project-url.supabase.co' && key && key !== 'your-anon-key';
}

// Generate a URL-friendly slug
function generateSlug(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rocket-flow';
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

/**
 * Share a sequence — creates a shared_sequences entry and returns a shareable link
 */
export async function shareSequence(sequence, userId) {
  const slug = generateSlug(sequence.name);

  if (isSupabaseConfigured() && userId) {
    try {
      // First ensure the sequence exists in the sequences table
      const { data: seqCheck } = await supabase
        .from('sequences')
        .select('id')
        .eq('title', sequence.name)
        .eq('user_id', userId)
        .maybeSingle();

      let sequenceId;
      if (seqCheck) {
        sequenceId = seqCheck.id;
      } else {
        // Create the sequence entry
        const { data: seqData } = await supabase
          .from('sequences')
          .insert({
            user_id: userId,
            title: sequence.name,
            description: `Shared Rocket flow with ${sequence.poses?.length || 0} poses`,
            is_public: true,
          })
          .select()
          .single();
        sequenceId = seqData?.id;
      }

      // Insert into shared_sequences
      const { data, error } = await supabase
        .from('shared_sequences')
        .insert({
          sequence_id: sequenceId,
          shared_by_user_id: userId,
          slug: slug,
          view_count: 0,
          remix_count: 0,
        })
        .select()
        .single();

      if (!error) {
        return { success: true, slug, shareUrl: `rajarocket://shared/${slug}` };
      }
      throw error;
    } catch (e) {
      console.error('Supabase share error, falling back to local:', e);
    }
  }

  // Local fallback: store in AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(SHARED_SLUGS_KEY);
    const shared = stored ? JSON.parse(stored) : [];
    shared.push({
      slug,
      sequence: { ...sequence, id: `${Date.now()}` },
      sharedAt: new Date().toISOString(),
      viewCount: 0,
      remixCount: 0,
    });
    await AsyncStorage.setItem(SHARED_SLUGS_KEY, JSON.stringify(shared));
    return { success: true, slug, shareUrl: `rajarocket://shared/${slug}` };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * Get all publicly shared sequences (for the Discover screen)
 */
export async function getSharedSequences() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('shared_sequences')
        .select('*, sequences(*)')
        .order('view_count', { ascending: false })
        .limit(50);

      if (!error && data) {
        return data.map(s => ({
          id: s.id,
          slug: s.slug,
          name: s.sequences?.title || 'Untitled Flow',
          description: s.sequences?.description || '',
          viewCount: s.view_count || 0,
          remixCount: s.remix_count || 0,
          sharedAt: s.created_at,
          sharedBy: s.shared_by_user_id,
          sequenceId: s.sequence_id,
          cloud: true,
        }));
      }
    } catch (e) {
      console.error('Error loading shared sequences from Supabase:', e);
    }
  }

  // Local fallback
  try {
    const stored = await AsyncStorage.getItem(SHARED_SLUGS_KEY);
    const shared = stored ? JSON.parse(stored) : [];
    return shared.map(s => ({
      id: s.slug,
      slug: s.slug,
      name: s.sequence?.name || 'Untitled Flow',
      description: `${s.sequence?.poses?.length || 0} poses`,
      viewCount: s.viewCount || 0,
      remixCount: s.remixCount || 0,
      sharedAt: s.sharedAt,
      sequence: s.sequence,
      cloud: false,
    }));
  } catch {
    return [];
  }
}

/**
 * Remix a shared sequence — clones it into the user's local/supabase storage
 */
export async function remixSequence(sharedItem, userId, saveFunction) {
  const sequence = sharedItem.sequence || {
    name: `Remix: ${sharedItem.name}`,
    poses: [],
    createdAt: new Date().toISOString(),
  };

  // Copy the sequence
  if (!sequence.name.startsWith('Remix:')) {
    sequence.name = `Remix: ${sequence.name}`;
  }
  sequence.id = `${Date.now()}`;

  // Save to user's sequences
  const result = await saveFunction(sequence, userId);

  // Increment remix count
  if (isSupabaseConfigured() && sharedItem.cloud && sharedItem.sequenceId) {
    try {
      await supabase.rpc('increment_remix_count', { seq_id: sharedItem.sequenceId });
    } catch {
      // Increment locally
      const current = sharedItem.remixCount || 0;
      sharedItem.remixCount = current + 1;
    }
  }

  return { ...result, sequence };
}

/**
 * Increment view count for a shared sequence
 */
export async function incrementViewCount(slug, isCloud) {
  if (isCloud && isSupabaseConfigured()) {
    try {
      await supabase.rpc('increment_view_count', { seq_slug: slug });
    } catch (e) {
      console.error('Error incrementing view count:', e);
    }
  }
}
