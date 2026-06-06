import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
        // Create profile if it doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email,
          niche: 'general',
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
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
    // Simple level calculation: 100 XP per level
    const newLevel = Math.floor(newXP / 100) + 1;
    
    const { data, error } = await supabase
      .from('users')
      .update({ total_xp: newXP, level: newLevel })
      .eq('id', user.id)
      .select()
      .single();

    if (!error) setProfile(data);
    return { data, error };
  };

  const updateStreak = async () => {
    if (!profile) return;
    // This is a simplified streak logic
    const { data, error } = await supabase
      .from('users')
      .update({ current_streak: profile.current_streak + 1 })
      .eq('id', user.id)
      .select()
      .single();

    if (!error) setProfile(data);
    return { data, error };
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile, updateXP, updateStreak }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  return useContext(ProfileContext);
};
