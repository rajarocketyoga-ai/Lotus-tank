import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSharedSequences, remixSequence, incrementViewCount } from '../services/sharingService';
import { saveSequence } from '../services/sequenceStorage';
import { useAuth } from '../context/AuthContext';

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const [sharedFlows, setSharedFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [remixingId, setRemixingId] = useState(null);

  const fetchSharedFlows = useCallback(async () => {
    const flows = await getSharedSequences();
    setSharedFlows(flows);
    setLoading(false);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    fetchSharedFlows();
  }, [fetchSharedFlows]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSharedFlows();
    });
    return unsubscribe;
  }, [navigation, fetchSharedFlows]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSharedFlows();
  };

  const handleRemix = async (item) => {
    setRemixingId(item.id);
    const result = await remixSequence(item, user?.id, saveSequence);
    setRemixingId(null);

    if (result.success) {
      Alert.alert('Remixed!', `"${result.sequence?.name || item.name}" added to My Sequences.`, [
        { text: 'Open Builder', onPress: () => navigation.navigate('SequenceBuilder') },
        { text: 'OK' },
      ]);
    } else {
      Alert.alert('Error', 'Could not remix this sequence.');
    }
  };

  const handleShareItem = async (item) => {
    await incrementViewCount(item.slug, item.cloud);
    navigation.navigate('SequenceBuilder');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleShareItem(item)}
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        marginHorizontal: 16,
        marginVertical: 5,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: '#FF6B35',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Ionicons name="share-social" size={22} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 15, color: '#2C2C2C' }}>{item.name}</Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{item.description || 'Rocket flow'}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="eye-outline" size={14} color="#ccc" />
          <Text style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>{item.viewCount || 0}</Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="git-branch-outline" size={14} color="#ccc" />
          <Text style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>{item.remixCount || 0} remixes</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRemix(item)}
          disabled={remixingId === item.id}
          style={{
            backgroundColor: '#004E89', paddingHorizontal: 14, paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          {remixingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Remix</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F3EE' }}>
      <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#2C2C2C' }}>Discover Flows</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          Browse shared sequences from the community
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : sharedFlows.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="globe-outline" size={48} color="#ddd" />
          <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            No shared flows yet.{'\n'}Be the first to share your Rocket sequence!
          </Text>
        </View>
      ) : (
        <FlatList
          data={sharedFlows}
          keyExtractor={(item) => item.id || item.slug}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
        />
      )}
    </SafeAreaView>
  );
}
