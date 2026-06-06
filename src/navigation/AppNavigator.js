import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import MoodCheckInScreen from '../screens/MoodCheckInScreen';
import SessionPlayerScreen from '../screens/SessionPlayerScreen';
import PostSessionScreen from '../screens/PostSessionScreen';
import AICoachScreen from '../screens/AICoachScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="MoodCheckIn" component={MoodCheckInScreen} />
    <Stack.Screen name="SessionPlayer" component={SessionPlayerScreen} />
    <Stack.Screen name="PostSession" component={PostSessionScreen} />
    <Stack.Screen name="AICoach" component={AICoachScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={HomeScreen} />
    {/* Placeholder tabs for Explore, Progress, Profile as per wireframes */}
    <Tab.Screen name="Explore" component={HomeScreen} /> 
    <Tab.Screen name="Progress" component={HomeScreen} />
    <Tab.Screen name="Profile" component={HomeScreen} />
  </Tab.Navigator>
);

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A2A3A' }}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
