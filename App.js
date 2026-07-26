import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import './src/i18n'; // inicializa as traduções antes de qualquer tela montar
import { initDB } from './src/database/db';
import { PlantProvider } from './src/contexts/PlantContext';
import AppNavigator from './src/navigation/AppNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
// Importar pelo caminho de cada peso: o índice do pacote arrasta todos os pesos
// da família para o bundle (~9 MB de fontes que o app não usa).
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Lato_300Light } from '@expo-google-fonts/lato/300Light';
import { Lato_400Regular } from '@expo-google-fonts/lato/400Regular';
import { Lato_700Bold } from '@expo-google-fonts/lato/700Bold';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Esconde o splash nativo assim que o JS sobe, para dar lugar à tela
  // de carregamento animada (AnimatedSplash) enquanto fontes e banco preparam.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          PlayfairDisplay_400Regular,
          PlayfairDisplay_700Bold,
          Montserrat_400Regular,
          Montserrat_600SemiBold,
          Montserrat_700Bold,
          Lato_300Light,
          Lato_400Regular,
          Lato_700Bold,
        });

        // Initialize DB
        await initDB();

      } catch (e) {
        if (__DEV__) console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <AnimatedSplash />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PlantProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </PlantProvider>
    </View>
  );
}
