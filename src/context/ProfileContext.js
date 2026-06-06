import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { checkStreakUpdate } from '../engine/gamificationEngine';

const ProfileContext = createContext({});

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      } else {
        const newProfile = {
          id: user.id,
          email: user.email,
          niche: 'general',
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          total_sessions: 0,
          total_remixes: 0,
          total_shares: 0,
          achievements: [],
          streak_last_date: null,
        };
        const { data: createdData, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();

        if (createError) console.error('Error creating profile:', createError);
        else setProfile(createdData);
      }
    } catch (err) {
      console.error('Profile context error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateXP = async (amount) => {
    if (!profile) return;

    const newXP = profile.total_xp + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 50)) + 1;

    // Date-aware streak update
    const streakResult = checkStreakUpdate(profile.streak_last_date);
    let newStreak = profile.current_streak || 0;
    let newLongest = profile.longest_streak || 0;

    if (streakResult.shouldIncrement) {
      if (streakResult.streakBroken) {
        newStreak = 1;
      } else {
        newStreak += 1;
      }
      if (newStreak > newLongest) newLongest = newStreak;
    }

    const updateData = {
      total_xp: newXP,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongest,
      streak_last_date: streakResult.today,
      total_sessions: (profile.total_sessions || 0) + 1,
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (!error) setProfile(data);
    return { data, error };
  };

  const updateProfile = async (updates) => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  const addAchievement = async (achievementId) => {
    if (!profile) return;
    const current = profile.achievements || [];
    if (current.includes(achievementId)) return;

    const updated = [...current, achievementId];
    const { data, error } = await supabase
      .from('users')
      .update({ achievements: updated })
      .eq('id', user.id)
      .select()
      .single();

    if (!error) setProfile(data);
    return { data, error };
  };

  const incrementRemix = async () => {
    if (!profile) return;
    const newCount = (profile.total_remixes || 0) + 1;
    const { data, error } = await supabase
      .from('users')
      .update({ total_remixes: newCount })
      .eq('id', user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  const incrementShare = async () => {
    if (!profile) return;
    const newCount = (profile.total_shares || 0) + 1;
    const { data, error } = await supabase
      .from('users')
      .update({ total_shares: newCount })
      .eq('id', user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      loading,
      refreshProfile: fetchProfile,
      updateXP,
      updateProfile,
      addAchievement,
      incrementRemix,
      incrementShare,
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  return useContext(ProfileContext);
};