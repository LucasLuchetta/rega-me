import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import tw from '../../utils/tw';

const COMMON_ROOMS = ['Sala', 'Quarto', 'Cozinha', 'Varanda', 'Banheiro', 'Jardim'];

const OptionPill = ({ label, selected, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={tw`px-4 py-2 rounded-full mr-2 mb-2 border ${selected ? 'bg-green-light border-green-500' : 'bg-gray-50 border-gray-200'}`}
  >
    <Text style={tw`${selected ? 'text-green-dark font-bold' : 'text-gray-600'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function AddPlant() {
  const { addNewPlant } = usePlants();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [room, setRoom] = useState('');
  const [frequency, setFrequency] = useState('');
  const [potSize, setPotSize] = useState('Médio');
  const [potMaterial, setPotMaterial] = useState('Plástico');
  const [drainage, setDrainage] = useState(1);

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
        name, species, room, frequencyDays: freqDays,
        pot_size: potSize, pot_material: potMaterial, drainage
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1 p-5`} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={tw`text-2xl font-bold text-gray-800 mb-6`}>Nova Planta 🌱</Text>

        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-600 mb-2 font-medium`}>Identificação</Text>
          <TextInput 
            style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 mb-3`} 
            placeholder="Nome (ex: Jurema)" value={name} onChangeText={setName} 
          />
          <TextInput 
            style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800`} 
            placeholder="Espécie (Opcional)" value={species} onChangeText={setSpecies} 
          />
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-gray-600 mb-2 font-medium`}>Local</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-2`}>
            {COMMON_ROOMS.map(r => (
              <TouchableOpacity 
                key={r} onPress={() => setRoom(r)}
                style={tw`px-4 py-2 rounded-full mr-2 border ${room === r ? 'bg-green-light border-green-500' : 'bg-gray-50 border-gray-200'}`}
              >
                <Text style={tw`${room === r ? 'text-green-dark font-bold' : 'text-gray-600'}`}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={tw`flex-row space-x-3 mb-3`}>
             <TextInput 
              style={tw`flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800`} 
              placeholder="Ou digite outro local..." value={room} onChangeText={setRoom} 
            />
          </View>
          <Text style={tw`text-gray-600 mb-2 font-medium`}>Frequência de Rega (dias)</Text>
          <TextInput 
              style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800`} 
              placeholder="Ex: 7" keyboardType="numeric" value={frequency} onChangeText={setFrequency} 
            />
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-600 mb-2 font-medium`}>Tamanho do Vaso</Text>
          <View style={tw`flex-row flex-wrap`}>
            {['Pequeno', 'Médio', 'Grande'].map(opt => (
              <OptionPill key={opt} label={opt} selected={potSize === opt} onPress={() => setPotSize(opt)} />
            ))}
          </View>
        </View>

        <View style={tw`mb-4`}>
          <Text style={tw`text-gray-600 mb-2 font-medium`}>Material do Vaso</Text>
          <View style={tw`flex-row flex-wrap`}>
            {['Plástico', 'Barro/Cerâmica', 'Vidro'].map(opt => (
              <OptionPill key={opt} label={opt} selected={potMaterial === opt} onPress={() => setPotMaterial(opt)} />
            ))}
          </View>
        </View>

        <View style={tw`mb-8`}>
          <Text style={tw`text-gray-600 mb-2 font-medium`}>Tem furos de drenagem?</Text>
          <View style={tw`flex-row`}>
            <TouchableOpacity onPress={() => setDrainage(1)} style={tw`flex-row items-center mr-6`}>
              {drainage === 1 ? <CheckCircle2 color="#4ade80" size={24} /> : <Circle color="#ccc" size={24} />}
              <Text style={tw`ml-2 text-gray-700`}>Sim</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setDrainage(0)} style={tw`flex-row items-center`}>
              {drainage === 0 ? <CheckCircle2 color="#ef4444" size={24} /> : <Circle color="#ccc" size={24} />}
              <Text style={tw`ml-2 text-gray-700`}>Não</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave} disabled={loading}
          style={tw`p-4 rounded-xl items-center mb-10 shadow-md ${loading ? 'bg-green-300' : 'bg-green-500'}`}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={tw`text-white font-bold text-lg`}>Salvar Planta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}