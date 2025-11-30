import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, Circle, Search } from 'lucide-react-native';
import tw from '../../utils/tw';

// CORREÇÃO AQUI: Importando da pasta src/database
// Certifique-se de que o arquivo plants_pt.json esteja em src/database/
import plantsData from '../../database/plants_pt.json';

const COMMON_ROOMS = ['Sala', 'Quarto', 'Cozinha', 'Varanda', 'Banheiro', 'Jardim'];

const OptionPill = ({ label, selected, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    style={tw`px-4 py-2 rounded-full mr-2 mb-2 border ${selected ? 'bg-green-light border-green-500' : 'bg-gray-50 border-gray-200'}`}
  >
    <Text style={tw`${selected ? 'text-green-dark font-bold' : 'text-gray-600'}`}>{label}</Text>
  </TouchableOpacity>
);

export default function AddPlant() {
  const { addNewPlant } = usePlants();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Campos do formulário
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [room, setRoom] = useState('');
  const [frequency, setFrequency] = useState('');
  const [potSize, setPotSize] = useState('Médio');
  const [potMaterial, setPotMaterial] = useState('Plástico');
  const [drainage, setDrainage] = useState(1);

  // Busca no JSON
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filtra as plantas do JSON
  const filteredPlants = plantsData.filter((p: any) => 
    (p.common && p.common[0] && p.common[0].toLowerCase().includes(searchText.toLowerCase())) ||
    (p.latin && p.latin.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleSelectFromJSON = (plant: any) => {
    setName(plant.common[0] || plant.latin);
    setSpecies(plant.latin);
    setModalVisible(false);
    // O JSON tem 'watering' como texto, não dias. O usuário ainda precisa definir a frequência numérica.
    Alert.alert("Dica de Rega", plant.watering); 
  };

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

        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={tw`bg-green-50 border border-green-200 p-4 rounded-xl flex-row items-center mb-6`}
        >
          <Search color="#166534" size={20} />
          <Text style={tw`ml-3 text-green-800 font-medium`}>Buscar espécie na lista</Text>
        </TouchableOpacity>

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
          <TextInput 
            style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 mb-3`} 
            placeholder="Ou digite outro local..." value={room} onChangeText={setRoom} 
          />
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

      {/* Modal de Busca no JSON */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={tw`flex-1 bg-white p-5`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Catálogo</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={tw`text-blue-600`}>Fechar</Text>
                </TouchableOpacity>
            </View>
            <View style={tw`bg-gray-100 rounded-lg p-3 flex-row items-center mb-4`}>
                <Search size={20} color="#9ca3af" />
                <TextInput 
                    style={tw`flex-1 ml-2 text-gray-800`} 
                    placeholder="Buscar espécie..." 
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus
                />
            </View>
            <FlatList 
                data={filteredPlants}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({item}) => (
                    <TouchableOpacity onPress={() => handleSelectFromJSON(item)} style={tw`py-4 border-b border-gray-100`}>
                        <Text style={tw`font-bold text-gray-800 text-lg`}>{item.common[0]}</Text>
                        <Text style={tw`text-gray-500 italic`}>{item.latin}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
      </Modal>
    </View>
  );
}