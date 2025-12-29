import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { initDB } from './src/database/db';
import { PlantProvider } from './src/contexts/PlantContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        setDbInitialized(true);
      } catch (error) {
        console.error("Falha ao inicializar DB:", error);
      }
    };
    setup();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <PlantProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </PlantProvider>
  );
}