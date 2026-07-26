import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Leaf from 'lucide-react-native/dist/cjs/icons/leaf';
import Calendar from 'lucide-react-native/dist/cjs/icons/calendar';
import User from 'lucide-react-native/dist/cjs/icons/user';

// Telas
import Dashboard from '../screens/Dashboard';
import AddPlant from '../screens/AddPlant';
import PlantDetails from '../screens/PlantDetails';
import RoomDetail from '../screens/RoomDetail';
import Orakul from '../screens/Orakul';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
          headerTintColor: '#7C9B72',
        }}
      />
      <Stack.Screen
        name="PlantDetails"
        component={PlantDetails}
        options={{
          title: 'Detalhes',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#7C9B72',
        }}
      />
      <Stack.Screen
        name="RoomDetail"
        component={RoomDetail}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7C9B72',
        tabBarInactiveTintColor: '#C6C6BE',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          backgroundColor: '#FDFDFC',
          borderTopColor: '#F0F0EB',
        },
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
        name="Calendário" 
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