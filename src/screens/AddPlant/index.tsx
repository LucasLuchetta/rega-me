import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import { usePlants } from '../../contexts/PlantContext';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, Circle, Search, Camera } from 'lucide-react-native';
import tw from '../../utils/tw';
import * as ImagePicker from 'expo-image-picker';

// Importando da pasta src/database
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

// Função auxiliar para estimar frequência baseada na descrição
const estimateFrequency = (description: string, category: string) => {
  const text = description ? description.toLowerCase() : '';
  const cat = category ? category.toLowerCase() : '';
  
  if (cat.includes('cacto') || cat.includes('suculenta')) return '15';
  if (text.includes('secar entre') || text.includes('apenas quando seco') || text.includes('dry between')) return '7';
  if (text.includes('manter úmido') || text.includes('mantenha úmido') || text.includes('keep moist')) return '3';
  if (text.includes('diariamente') || text.includes('daily')) return '1';
  
  return '7'; // Default seguro
};

export default function AddPlant() {
  const { addNewPlant } = usePlants();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // Campos do formulário
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [room, setRoom] = useState('');
  const [frequency, setFrequency] = useState('');
  const [fertilizeFreq, setFertilizeFreq] = useState('');
  const [pruneFreq, setPruneFreq] = useState('');
  const [potSize, setPotSize] = useState('Médio');
  const [potMaterial, setPotMaterial] = useState('Plástico');
  const [drainage, setDrainage] = useState(1);
  const [photoUri, setPhotoUri] = useState('');

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
    
    // Lógica de Preenchimento Inteligente (Smart Filling)
    const smartFreq = estimateFrequency(plant.watering, plant.category);
    setFrequency(smartFreq);
    // Sugestões genéricas para adubo e poda (podem ser refinadas)
    setFertilizeFreq('30');
    setPruneFreq('60');
    
    setModalVisible(false);
    
    // Feedback melhorado para o usuário
    Alert.alert(
      "Preenchimento Inteligente 🪄", 
      `Com base na espécie, sugerimos rega a cada ${smartFreq} dias.\n\nDica original: ${plant.watering}`
    ); 
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
          Alert.alert("Erro", "Permissão de câmera necessária.");
          return;
      }
      const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 4],
          quality: 0.8,
      });

      if (!result.canceled) {
          setPhotoUri(result.assets[0].uri);
      }
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Nome é obrigatório");
    if (!room.trim()) errors.push("Local é obrigatório");

    const freqDays = parseInt(frequency);
    if (!frequency || isNaN(freqDays) || freqDays <= 0) {
      errors.push("Frequência de rega deve ser um número válido maior que 0");
    }

    if (errors.length > 0) {
      Alert.alert("Atenção", errors.join("\n"));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const freqDays = parseInt(frequency);
      const fertDays = fertilizeFreq ? parseInt(fertilizeFreq) : 0;
      const pruneDays = pruneFreq ? parseInt(pruneFreq) : 0;

      await addNewPlant({
        name, species, room, frequencyDays: freqDays,
        fertilizeFrequency: fertDays,
        pruneFrequency: pruneDays,
        pot_size: potSize, pot_material: potMaterial, drainage,
        photo_uri: photoUri
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

        {/* Seção de Foto */}
        <View style={tw`items-center mb-6`}>
            <TouchableOpacity onPress={pickImage} style={tw`w-32 h-32 bg-gray-100 rounded-full items-center justify-center overflow-hidden border-2 border-dashed border-gray-300`}>
                {photoUri ? (
                    <Image source={{ uri: photoUri }} style={tw`w-full h-full`} />
                ) : (
                    <Camera size={32} color="#9ca3af" />
                )}
            </TouchableOpacity>
            <View style={tw`flex-row mt-2`}>
                <TouchableOpacity onPress={pickImage} style={tw`mr-4`}><Text style={tw`text-green-600 font-bold`}>Galeria</Text></TouchableOpacity>
                <TouchableOpacity onPress={takePhoto}><Text style={tw`text-green-600 font-bold`}>Câmera</Text></TouchableOpacity>
            </View>
        </View>

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`mb-2`}
            contentContainerStyle={tw`px-1`}
          >
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

          <Text style={tw`text-gray-600 mb-2 font-medium`}>Cuidados (Frequência em dias)</Text>
          <View style={tw`flex-row justify-between mb-2`}>
            <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-xs text-gray-500 mb-1`}>Rega 💧</Text>
                <TextInput
                  style={tw`bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 font-bold`}
                  placeholder="Ex: 7" keyboardType="numeric" value={frequency} onChangeText={setFrequency}
                />
            </View>
            <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-xs text-gray-500 mb-1`}>Adubo 🌱</Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800`}
                  placeholder="Ex: 30" keyboardType="numeric" value={fertilizeFreq} onChangeText={setFertilizeFreq}
                />
            </View>
            <View style={tw`flex-1`}>
                <Text style={tw`text-xs text-gray-500 mb-1`}>Poda ✂️</Text>
                <TextInput
                  style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800`}
                  placeholder="Ex: 60" keyboardType="numeric" value={pruneFreq} onChangeText={setPruneFreq}
                />
            </View>
          </View>
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