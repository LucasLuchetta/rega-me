import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Leaf, Calendar, User } from 'lucide-react-native';

// Telas
import Dashboard from '../screens/Dashboard';
import AddPlant from '../screens/AddPlant';
import Orakul from '../screens/Orakul';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack específica para a aba Jardim (permite navegar para AddPlant)
function GardenStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="AddPlant" 
        component={AddPlant} 
        options={{ 
          title: 'Nova Planta',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#166534', // green.dark
        }} 
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#166534', // green.dark
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tab.Screen 
        name="Jardim" 
        component={GardenStack} 
        options={{
          tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Orakul" 
        component={Orakul} 
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={Profile} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}