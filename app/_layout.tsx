import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        {/* 'add' é um modal (sobe de baixo para cima) */}
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        {/* 'search' também será um modal para manter a consistência */}
        <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}