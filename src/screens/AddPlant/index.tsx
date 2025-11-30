// src/screens/AddPlant/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, Circle } from 'lucide-react-native';

interface OptionPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

// Componente simples de Radio Button Pílula
const OptionPill = ({ label, selected, onPress }: OptionPillProps) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-2 mb-2 border ${selected ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-200'}`}
  >
    <Text className={`${selected ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function AddPlant() {
  const { addNewPlant } = usePlants();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Campos de Texto
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [room, setRoom] = useState('');
  const [frequency, setFrequency] = useState('');

  // Campos de Seleção (Novos)
  const [potSize, setPotSize] = useState('Médio');
  const [potMaterial, setPotMaterial] = useState('Plástico');
  const [drainage, setDrainage] = useState(1); // 1 = Sim, 0 = Não

  const handleSave = async () => {
    if (!name.trim() || !room.trim() || !frequency.trim()) {
      Alert.alert("Ops!", "Preencha pelo menos Nome, Local e Frequência.");
      return;
    }

    const freqDays = parseInt(frequency);
    if (isNaN(freqDays) || freqDays <= 0) {
      Alert.alert("Erro", "A frequência deve ser um número válido.");
      return;
    }

    setLoading(true);
    try {
      await addNewPlant({
        name,
        species,
        room,
        frequencyDays: freqDays,
        pot_size: potSize,
        pot_material: potMaterial,
        drainage: drainage
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Nova Planta 🌱</Text>

        {/* Nome e Espécie */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-2 font-medium">Identificação</Text>
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 mb-3" 
            placeholder="Nome (ex: Jurema)" value={name} onChangeText={setName} 
          />
          <TextInput 
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800" 
            placeholder="Espécie (Opcional)" value={species} onChangeText={setSpecies} 
          />
        </View>

        {/* Local e Rega */}
        <View className="mb-6">
          <Text className="text-gray-600 mb-2 font-medium">Cuidados</Text>
          <View className="flex-row space-x-3 mb-3">
             <TextInput 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800" 
              placeholder="Local (ex: Sala)" value={room} onChangeText={setRoom} 
            />
            <TextInput 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800" 
              placeholder="Dias (ex: 7)" keyboardType="numeric" value={frequency} onChangeText={setFrequency} 
            />
          </View>
        </View>

        {/* Tamanho do Vaso */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-2 font-medium">Tamanho do Vaso</Text>
          <View className="flex-row flex-wrap">
            {['Pequeno', 'Médio', 'Grande'].map(opt => (
              <OptionPill key={opt} label={opt} selected={potSize === opt} onPress={() => setPotSize(opt)} />
            ))}
          </View>
        </View>

        {/* Material do Vaso */}
        <View className="mb-4">
          <Text className="text-gray-600 mb-2 font-medium">Material do Vaso</Text>
          <View className="flex-row flex-wrap">
            {['Plástico', 'Barro/Cerâmica', 'Vidro'].map(opt => (
              <OptionPill key={opt} label={opt} selected={potMaterial === opt} onPress={() => setPotMaterial(opt)} />
            ))}
          </View>
        </View>

        {/* Drenagem */}
        <View className="mb-8">
          <Text className="text-gray-600 mb-2 font-medium">Tem furos de drenagem?</Text>
          <View className="flex-row">
            <TouchableOpacity onPress={() => setDrainage(1)} className="flex-row items-center mr-6">
              {drainage === 1 ? <CheckCircle2 color="#4ade80" size={24} /> : <Circle color="#ccc" size={24} />}
              <Text className="ml-2 text-gray-700">Sim</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setDrainage(0)} className="flex-row items-center">
              {drainage === 0 ? <CheckCircle2 color="#ef4444" size={24} /> : <Circle color="#ccc" size={24} />}
              <Text className="ml-2 text-gray-700">Não</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`p-4 rounded-xl items-center mb-10 shadow-md ${loading ? 'bg-green-300' : 'bg-green-500'}`}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Salvar Planta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}