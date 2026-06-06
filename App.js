import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './src/lib/supabase';
import { useEffect, useState } from 'react';

export default function App() {
  const [dbStatus, setDbStatus] = useState('Checking connection...');

  useEffect(() => {
    async function checkConnection() {
      try {
        if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
          setDbStatus('Supabase URL missing in .env');
          return;
        }
        const { data, error } = await supabase.from('users').select('*').limit(1);
        if (error) {
          setDbStatus('Error: ' + error.message);
        } else {
          setDbStatus('Connected to Supabase!');
        }
      } catch (err) {
        setDbStatus('Connection failed: ' + err.message);
      }
    }
    checkConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Raja Rocket Mindset</Text>
      <Text style={styles.subtitle}>Welcome to your mental wellness journey.</Text>
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Database Status: {dbStatus}</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusBox: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  }
});
