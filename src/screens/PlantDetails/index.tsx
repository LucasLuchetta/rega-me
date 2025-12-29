import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, StatusBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlants } from '../../contexts/PlantContext';
import { Trash2, Plus, Camera, Droplets, Clock, CheckCircle2, Scissors, Sprout, ShieldAlert, Box, ChevronLeft, MoreHorizontal, Wind, ThermometerSun, Filter } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../../utils/tw';
import EditPlantModal from './components/EditPlantModal';

const CARE_TYPES = [
    { id: 'water', label: 'Rega', icon: Droplets, color: '#3b82f6' },
    { id: 'fertilize', label: 'Adubo', icon: Sprout, color: '#eab308' },
    { id: 'prune', label: 'Poda', icon: Scissors, color: '#ef4444' },
    { id: 'mist', label: 'Umidade', icon: Wind, color: '#a855f7' },
    { id: 'repot', label: 'Vaso', icon: Box, color: '#f97316' },
];

export default function PlantDetails() {
  const route = useRoute<any>();
  const { plant: initialPlant } = route.params;
  const [plant, setPlant] = useState(initialPlant);
  const { getPlantTasks, addTaskToPlant, removePlant, snoozeTask, anticipateTask, addPlantPhoto, getPlantPhotos, getPlantHistory, updatePlant, plants } = usePlants();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('water');
  const [newFrequency, setNewFrequency] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
      loadData();
  }, []);

  // Sync local plant state with global state when it changes
  useEffect(() => {
    const updatedPlant = plants.find(p => p.id === plant.id);
    if (updatedPlant) setPlant(updatedPlant);
  }, [plants]);

  const loadData = async () => {
    if (getPlantTasks) setTasks(await getPlantTasks(plant.id));
    if (getPlantHistory) setHistory(await getPlantHistory(plant.id));
    if (getPlantPhotos) setPhotos(await getPlantPhotos(plant.id));
  };

  const handleAddTask = async () => {
    if (!newFrequency) return;
    await addTaskToPlant({
        plant_id: plant.id, type: selectedType as any, frequency_days: parseInt(newFrequency), next_due: new Date().toISOString()
    });
    setModalVisible(false); setNewFrequency(''); loadData();
  };

  const handleAction = (task: any) => {
      Alert.alert("Ação Rápida", `O que fazer com ${task.type}?`, [
          { text: "Adiar", onPress: () => { snoozeTask(task.id, 2, plant.name); loadData(); } },
          { text: "Marcar Feito", onPress: () => { anticipateTask(task.id, task.frequency_days, plant.name); loadData(); } },
          { text: "Cancelar", style: "cancel" }
      ]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await addPlantPhoto(plant.id, result.assets[0].uri);
      loadData();
    }
  };

  const handleUpdatePlant = async (updatedPlant: any, frequency?: number) => {
      await updatePlant(updatedPlant, frequency);
  };

  // Seleciona a melhor foto (capa) ou a mais recente
  const coverImage = plant.photo_uri;
  const filteredHistory = filterType ? history.filter(h => h.type === filterType) : history;

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Imagem de Capa Imersiva (Estilo Referência 4) */}
      <View style={tw`h-[45%] w-full relative`}>
          <Image 
            source={coverImage ? { uri: coverImage } : require('../../../assets/icon.png')} // Fallback image
            style={tw`w-full h-full`} 
            resizeMode="cover" 
          />
          <View style={tw`absolute inset-0 bg-black/20`} /> {/* Overlay escuro sutil */}
          
          {/* Header Buttons */}
          <View style={tw`absolute top-12 left-6 right-6 flex-row justify-between z-10`}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={tw`w-10 h-10 bg-white/30 backdrop-blur-md rounded-full items-center justify-center`}>
                <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => Alert.alert("Opções", "Escolha uma ação", [
                    {text: 'Editar Planta', onPress: () => setEditModalVisible(true)},
                    {text: 'Deletar', style: 'destructive', onPress: () => { removePlant(plant.id); navigation.goBack(); }},
                    {text: 'Cancelar'}
                ])}
                style={tw`w-10 h-10 bg-white/30 backdrop-blur-md rounded-full items-center justify-center`}
            >
                <MoreHorizontal size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Title Overlay na Imagem */}
          <View style={tw`absolute bottom-10 left-6`}>
              <Text style={tw`text-white font-bold text-3xl shadow-sm`}>{plant.name}</Text>
              <Text style={tw`text-white/90 text-lg italic`}>{plant.species}</Text>
          </View>
      </View>

      {/* Floating Bottom Sheet */}
      <View style={tw`flex-1 bg-white -mt-6 rounded-t-[32px] px-6 pt-8 shadow-2xl`}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            {/* Informações Rápidas */}
            <View style={tw`flex-row justify-between mb-8`}>
                <View style={tw`bg-green-50 px-4 py-3 rounded-2xl items-center flex-1 mr-3`}>
                    <Clock size={20} color="#166534" style={tw`mb-1`} />
                    <Text style={tw`text-xs text-green-800 font-bold uppercase`}>Idade</Text>
                    <Text style={tw`text-gray-600 text-xs`}>Recente</Text>
                </View>
                <View style={tw`bg-blue-50 px-4 py-3 rounded-2xl items-center flex-1 mr-3`}>
                    <ThermometerSun size={20} color="#1e40af" style={tw`mb-1`} />
                    <Text style={tw`text-xs text-blue-800 font-bold uppercase`}>Local</Text>
                    <Text style={tw`text-gray-600 text-xs`}>{plant.room}</Text>
                </View>
                <View style={tw`bg-orange-50 px-4 py-3 rounded-2xl items-center flex-1`}>
                    <Box size={20} color="#ea580c" style={tw`mb-1`} />
                    <Text style={tw`text-xs text-orange-800 font-bold uppercase`}>Vaso</Text>
                    <Text style={tw`text-gray-600 text-xs`}>{plant.pot_size}</Text>
                </View>
            </View>

            {/* Seção Cuidado (Lista Clean como referência 4) */}
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Cuidados</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}><Plus size={24} color="#4ade80" /></TouchableOpacity>
            </View>

            {tasks.map((task) => {
                const config = CARE_TYPES.find(c => c.id === task.type) || CARE_TYPES[0];
                const Icon = config.icon;
                return (
                    <TouchableOpacity key={task.id} onPress={() => handleAction(task)} style={tw`flex-row items-center py-4 border-b border-gray-100`}>
                        <View style={[tw`w-10 h-10 rounded-full items-center justify-center mr-4`, { backgroundColor: `${config.color}20` }]}>
                            <Icon size={20} color={config.color} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-gray-800 font-bold text-base capitalize`}>{config.label}</Text>
                            <Text style={tw`text-gray-400 text-xs`}>A cada {task.frequency_days} dias</Text>
                        </View>
                        <View style={tw`flex-row items-center`}>
                            <Clock size={14} color="#9ca3af" />
                            <Text style={tw`ml-1 text-gray-400 text-xs`}>
                                {new Date(task.next_due).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}

            {/* Fotos (Timeline Visual) */}
            <View style={tw`flex-row justify-between items-center mt-8 mb-4`}>
                 <Text style={tw`text-xl font-bold text-gray-800`}>Diário Visual</Text>
                 <TouchableOpacity onPress={pickImage}><Camera size={24} color="#4ade80" /></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                {photos.map((p, i) => (
                    <Image key={i} source={{ uri: p.photo_uri }} style={tw`w-24 h-24 rounded-xl mr-3 bg-gray-100`} />
                ))}
                {photos.length === 0 && <Text style={tw`text-gray-400 italic`}>Nenhuma foto registrada ainda.</Text>}
            </ScrollView>

            {/* Histórico com Filtros */}
            <View style={tw`flex-row justify-between items-center mt-4 mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Histórico</Text>
                <TouchableOpacity onPress={() => {
                    Alert.alert("Filtrar por", "Escolha o tipo de ação", [
                        { text: "Todos", onPress: () => setFilterType(null) },
                        ...CARE_TYPES.map(c => ({ text: c.label, onPress: () => setFilterType(c.id) })),
                        { text: "Cancelar", style: "cancel" }
                    ])
                }}>
                    <Filter size={20} color={filterType ? "#166534" : "#9ca3af"} />
                </TouchableOpacity>
            </View>

            {filteredHistory.map((h, i) => (
                <View key={i} style={tw`flex-row items-center mb-3`}>
                    <CheckCircle2 size={16} color="#4ade80" />
                    <Text style={tw`ml-2 text-gray-500`}>
                        {h.type} realizado em {new Date(h.date_performed).toLocaleDateString()}
                    </Text>
                </View>
            ))}
            {filteredHistory.length === 0 && <Text style={tw`text-gray-400 italic`}>Nenhum histórico encontrado.</Text>}

        </ScrollView>
      </View>

      <EditPlantModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        plant={plant}
        onSave={handleUpdatePlant}
      />

      {/* Modal igual ao anterior, mas com estilo clean */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/50`}>
            <View style={tw`bg-white rounded-t-3xl p-6`}>
                <View style={tw`flex-row justify-between mb-6`}>
                    <Text style={tw`text-xl font-bold`}>Novo Cuidado</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={tw`text-blue-600`}>Cancelar</Text></TouchableOpacity>
                </View>
                <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
                    {CARE_TYPES.map(t => (
                        <TouchableOpacity key={t.id} onPress={() => setSelectedType(t.id)} 
                            style={tw`px-4 py-2 rounded-full border ${selectedType === t.id ? 'bg-green-500 border-green-500' : 'border-gray-200'}`}>
                            <Text style={tw`${selectedType === t.id ? 'text-white' : 'text-gray-600'} font-bold`}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput placeholder="Frequência (dias)" keyboardType="numeric" style={tw`bg-gray-50 p-4 rounded-xl mb-4`} value={newFrequency} onChangeText={setNewFrequency}/>
                <TouchableOpacity onPress={handleAddTask} style={tw`bg-green-600 p-4 rounded-xl items-center`}>
                    <Text style={tw`text-white font-bold`}>Salvar Rotina</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}