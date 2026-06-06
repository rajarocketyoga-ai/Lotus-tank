import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const { width } = Dimensions.get('window');
const GRID_SIZE = 3;
const CELL_SIZE = (width - 60) / GRID_SIZE;

const PLANT_STAGES = {
  1: '🌱', // Seed/Sprout
  2: '🌿', // Small Plant
  3: '🪴', // Potted/Medium
  4: '🌻', // Flower
  5: '🌳', // Tree
};

export default function MindGardenScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, [user]);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('garden_plants')
        .select('*')
        .eq('user_id', user.id)
        .order('position_index', { ascending: true });

      if (error) throw error;
      
      // Initialize grid with 9 cells
      const grid = Array(9).fill(null).map((_, i) => ({ position_index: i }));
      data.forEach(p => {
        grid[p.position_index] = p;
      });
      
      setPlants(grid);
    } catch (err) {
      console.error('Error fetching garden:', err);
    } finally {
      setLoading(false);
    }
  };

  const plantSeed = async (index) => {
    if (!profile) return;
    
    try {
      const newPlant = {
        user_id: user.id,
        plant_type: 'lotus',
        growth_stage: 1,
        position_index: index,
        xp_invested: 0
      };

      const { data, error } = await supabase
        .from('garden_plants')
        .insert(newPlant)
        .select()
        .single();

      if (error) throw error;
      
      const newPlants = [...plants];
      newPlants[index] = data;
      setPlants(newPlants);
    } catch (err) {
      console.error('Error planting seed:', err);
    }
  };

  const renderCell = ({ item }) => {
    const isEmpty = !item.id;

    return (
      <TouchableOpacity 
        style={styles.cell}
        onPress={() => isEmpty ? plantSeed(item.position_index) : null}
        disabled={!isEmpty}
      >
        {isEmpty ? (
          <Text style={styles.plus}>+</Text>
        ) : (
          <View style={styles.plantWrapper}>
            <Text style={styles.plantEmoji}>{PLANT_STAGES[item.growth_stage] || '🌱'}</Text>
            <Text style={styles.growthText}>Stage {item.growth_stage}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7BC8A4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Mind Garden</Text>
        <Text style={styles.subtitle}>XP Level: {profile?.level}</Text>
      </View>

      <FlatList
        data={plants}
        renderItem={renderCell}
        keyExtractor={item => item.position_index.toString()}
        numColumns={GRID_SIZE}
        contentContainerStyle={styles.grid}
      />

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Complete daily quests and earn XP to grow your garden. 
          Each session brings your plants closer to full bloom.
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A2A3A',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7BC8A4',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
  },
  grid: {
    padding: 20,
    alignItems: 'center',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 5,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 200, 164, 0.2)',
  },
  plus: {
    fontSize: 32,
    color: 'rgba(123, 200, 164, 0.4)',
  },
  plantWrapper: {
    alignItems: 'center',
  },
  plantEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  growthText: {
    fontSize: 10,
    color: '#7BC8A4',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(123, 200, 164, 0.1)',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(123, 200, 164, 0.3)',
  },
  infoText: {
    color: '#F7F4EF',
    textAlign: 'center',
    lineHeight: 22,
  }
});
