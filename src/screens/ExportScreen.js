import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExportFormats, generateExportHTML, generateRemixLink } from '../services/exportService';

export default function ExportScreen({ route, navigation }) {
  const { sequence } = route.params || {};
  const formats = getExportFormats();
  const [selectedFormat, setSelectedFormat] = useState('cheat-sheet');
  const [teacherName, setTeacherName] = useState('');
  const [studioName, setStudioName] = useState('');

  const htmlContent = useMemo(() => {
    if (!sequence) return '';
    return generateExportHTML(sequence, selectedFormat, { teacherName, studioName });
  }, [sequence, selectedFormat, teacherName, studioName]);

  const handleExport = async () => {
    if (!sequence) return;
    try {
      // For React Native, share the HTML content via the Share API
      await Share.share({
        title: `${sequence.name || 'Rocket Flow'} — ${formats.find(f => f.id === selectedFormat)?.name || 'Export'}`,
        message: htmlContent,
      });
    } catch (e) {
      Alert.alert('Export Error', 'Could not export the sequence.');
    }
  };

  if (!sequence) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F3EE', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#999' }}>No sequence data available.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F3EE' }}>
      {/* Header */}
      <View style={{ padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#2C2C2C' }}>Export Sequence</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {sequence.name} · {sequence.poses?.length || 0} poses
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Format Selection */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#2C2C2C', marginBottom: 10 }}>Export Format</Text>
        {formats.map(format => (
          <TouchableOpacity
            key={format.id}
            onPress={() => setSelectedFormat(format.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 14,
              backgroundColor: '#fff',
              borderRadius: 12,
              marginBottom: 6,
              borderWidth: 1.5,
              borderColor: selectedFormat === format.id ? '#FF6B35' : '#e0e0e0',
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 10,
              backgroundColor: selectedFormat === format.id ? '#FF6B35' : '#f3f3f3',
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}>
              <Ionicons
                name={format.icon === 'grid' ? 'grid-outline' : format.icon === 'list' ? 'list-outline' : format.icon === 'square' ? 'square-outline' : 'phone-portrait-outline'}
                size={20}
                color={selectedFormat === format.id ? '#fff' : '#999'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 14, color: '#2C2C2C' }}>{format.name}</Text>
              <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{format.description}</Text>
            </View>
            {selectedFormat === format.id && (
              <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
            )}
          </TouchableOpacity>
        ))}

        {/* Branding Options */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#2C2C2C', marginTop: 20, marginBottom: 10 }}>
          Branding
        </Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 }}>Teacher Name</Text>
          <TextInput
            value={teacherName}
            onChangeText={setTeacherName}
            placeholder="e.g., Sarah Johnson"
            placeholderTextColor="#ccc"
            style={{
              backgroundColor: '#f8f8f8', borderRadius: 8, padding: 10, fontSize: 14,
              borderWidth: 1, borderColor: '#e0e0e0',
            }}
          />
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 6 }}>Studio Name</Text>
          <TextInput
            value={studioName}
            onChangeText={setStudioName}
            placeholder="e.g., Rocket Yoga Studio"
            placeholderTextColor="#ccc"
            style={{
              backgroundColor: '#f8f8f8', borderRadius: 8, padding: 10, fontSize: 14,
              borderWidth: 1, borderColor: '#e0e0e0',
            }}
          />
        </View>

        {/* Preview info */}
        <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFE0B2' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#E65100', marginBottom: 4 }}>💡 Export Preview</Text>
          <Text style={{ fontSize: 11, color: '#BF360C', lineHeight: 16 }}>
            Format: {formats.find(f => f.id === selectedFormat)?.name}{'\n'}
            Poses: {sequence.poses?.length || 0}{'\n'}
            Branding: {teacherName || studioName ? `${teacherName}${studioName ? ` · ${studioName}` : ''}` : 'None'}
          </Text>
        </View>
      </ScrollView>

      {/* Export Button */}
      <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' }}>
        <TouchableOpacity
          onPress={handleExport}
          style={{
            backgroundColor: '#FF6B35', paddingVertical: 14, borderRadius: 12,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
          }}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>
            Export & Share
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
