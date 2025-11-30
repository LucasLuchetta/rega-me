import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlants } from '../../contexts/PlantContext';
import { Trash2, Plus, Camera, Droplets, Clock, CheckCircle2, Scissors, Sprout, ShieldAlert, Box, ChevronLeft, X, History } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../../utils/tw';

const CARE_TYPES = [
    { id: 'water', label: 'Rega', icon: Droplets, color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'fertilize', label: 'Adubo', icon: Sprout, color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { id: 'prune', label: 'Poda', icon: Scissors, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200' },
    { id: 'mist', label: 'Defensivo', icon: ShieldAlert, color: '#a855f7', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'repot', label: 'Troca Vaso', icon: Box, color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200' },
];

export default function PlantDetails() {
  const route = useRoute<any>();
  const { plant } = route.params; 
  // Importando getPlantHistory corretamente
  const { getPlantTasks, addTaskToPlant, removePlant, snoozeTask, anticipateTask, addPlantPhoto, removePlantPhoto, getPlantPhotos, getPlantHistory } = usePlants();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('water');
  const [newFrequency, setNewFrequency] = useState('');

  useEffect(() => { 
      loadTasks(); 
      loadPhotos();
      loadHistory();
  }, []);

  const loadTasks = async () => {
    if (getPlantTasks) {
        const data = await getPlantTasks(plant.id);
        setTasks(data);
    }
  };

  const loadPhotos = async () => {
      if (getPlantPhotos) {
          const data = await getPlantPhotos(plant.id);
          setPhotos(data);
      }
  };

  // Carrega histórico apenas desta planta
  const loadHistory = async () => {
      if (getPlantHistory) {
          const data = await getPlantHistory(plant.id);
          setHistory(data);
      }
  };

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão", "Precisamos de acesso à câmera.");
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaType.Images, // CORRIGIDO: Sintaxe atualizada
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.7,
    });

    if (!result.canceled) {
        await addPlantPhoto(plant.id, result.assets[0].uri);
        loadPhotos();
    }
  };

  const handleDeletePhoto = (photoId: number) => {
      Alert.alert("Apagar Foto", "Deseja remover esta memória?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Apagar", style: "destructive", onPress: async () => {
              await removePlantPhoto(photoId);
              loadPhotos();
          }}
      ]);
  };

  const handleSnooze = (taskId: number) => {
      Alert.alert("Adiar", "Para quando?", [
          { text: "Amanhã", onPress: () => { snoozeTask(taskId, 1, plant.name); loadTasks(); } },
          { text: "2 Dias", onPress: () => { snoozeTask(taskId, 2, plant.name); loadTasks(); } },
          { text: "Cancelar", style: "cancel" }
      ]);
  };

  const handleAnticipate = (task: any) => {
      Alert.alert("Feito?", `Confirmar ${CARE_TYPES.find(c => c.id === task.type)?.label || 'tarefa'}?`, [
          { text: "Sim", onPress: async () => { 
              await anticipateTask(task.id, task.frequency_days, plant.name); 
              loadTasks(); 
              loadHistory(); // Atualiza histórico imediatamente
            } 
          },
          { text: "Cancelar", style: "cancel" }
      ]);
  };

  const handleDeletePlant = () => {
    Alert.alert("Excluir Planta", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await removePlant(plant.id); navigation.goBack(); } }
    ]);
  };

  const handleAddTask = async () => {
    if (!newFrequency) return;
    const taskType = selectedType as any; 
    await addTaskToPlant({
        plant_id: plant.id, type: taskType, frequency_days: parseInt(newFrequency), next_due: new Date().toISOString()
    });
    setModalVisible(false); setNewFrequency(''); loadTasks();
  };

  const getTaskConfig = (type: string) => CARE_TYPES.find(c => c.id === type) || CARE_TYPES[0];

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`absolute top-12 left-5 z-10`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-white/90 p-2 rounded-full shadow-sm`}>
            <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Header Visual - Sem Gradientes */}
        <View style={tw`bg-gray-100 h-72 w-full relative`}>
            {photos.length > 0 ? (
                <Image source={{ uri: photos[0].photo_uri }} style={tw`w-full h-full`} resizeMode="cover" />
            ) : (
                <View style={tw`w-full h-full items-center justify-center bg-green-50`}>
                    <Sprout size={64} color="#86efac" />
                    <Text style={tw`text-green-800/50 mt-4 font-medium`}>Sem foto de capa</Text>
                </View>
            )}
            {/* Sombra suave com cor solida e opacidade em vez de gradiente */}
            <View style={tw`absolute bottom-0 w-full h-24 bg-white opacity-20`} /> 
        </View>

        <View style={tw`px-6 -mt-10 bg-white rounded-t-[32px] pt-8 pb-4 shadow-sm`}>
            <View style={tw`flex-row justify-between items-start`}>
                <View style={tw`flex-1 mr-4`}>
                    <Text style={tw`text-3xl font-extrabold text-gray-900 leading-tight`}>{plant.name}</Text>
                    <Text style={tw`text-green-600 font-medium text-lg mt-1 italic`}>{plant.species || 'Espécie desconhecida'}</Text>
                </View>
                <View style={tw`bg-gray-100 px-3 py-1.5 rounded-lg`}>
                    <Text style={tw`text-gray-600 text-xs font-bold uppercase`}>{plant.room}</Text>
                </View>
            </View>

            <View style={tw`flex-row mt-6 bg-gray-50 p-4 rounded-2xl justify-between`}>
                <View style={tw`items-center flex-1 border-r border-gray-200`}>
                    <Text style={tw`text-gray-400 text-xs uppercase font-bold mb-1`}>Vaso</Text>
                    <Text style={tw`text-gray-800 font-semibold`}>{plant.pot_size || '-'}</Text>
                </View>
                <View style={tw`items-center flex-1 border-r border-gray-200`}>
                    <Text style={tw`text-gray-400 text-xs uppercase font-bold mb-1`}>Material</Text>
                    <Text style={tw`text-gray-800 font-semibold`}>{plant.pot_material || '-'}</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-gray-400 text-xs uppercase font-bold mb-1`}>Drenagem</Text>
                    <Text style={tw`text-gray-800 font-semibold`}>{plant.drainage ? 'Sim' : 'Não'}</Text>
                </View>
            </View>
        </View>

        {/* Tarefas */}
        <View style={tw`px-6 mt-6`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Rotina</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={tw`flex-row items-center bg-green-600 px-3 py-1.5 rounded-full shadow-sm`}>
                    <Plus size={16} color="white" />
                    <Text style={tw`text-white font-bold ml-1.5 text-xs`}>Adicionar</Text>
                </TouchableOpacity>
            </View>

            {tasks.map((task) => {
                const nextDate = new Date(task.next_due).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                const config = getTaskConfig(task.type);
                const Icon = config.icon;
                return (
                    <View key={task.id} style={tw`bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 flex-row items-center`}>
                        <View style={tw`${config.bg} w-12 h-12 rounded-full items-center justify-center mr-4 border ${config.border}`}>
                            <Icon size={20} color={config.color} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`font-bold text-gray-800 text-base`}>{config.label}</Text>
                            <Text style={tw`text-gray-400 text-xs`}>A cada {task.frequency_days} dias</Text>
                        </View>
                        <View style={tw`items-end`}>
                            <Text style={tw`text-gray-900 font-bold mb-2 text-sm`}>{nextDate}</Text>
                            <View style={tw`flex-row gap-2`}>
                                <TouchableOpacity onPress={() => handleSnooze(task.id)} style={tw`p-2 bg-gray-100 rounded-full`}>
                                    <Clock size={16} color="#6b7280" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleAnticipate(task)} style={tw`p-2 bg-green-100 rounded-full`}>
                                    <CheckCircle2 size={16} color="#166534" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>

        {/* Histórico da Planta - CORRIGIDO */}
        <View style={tw`px-6 mt-8`}>
            <View style={tw`flex-row items-center mb-4`}>
                <History size={20} color="#374151" />
                <Text style={tw`text-xl font-bold text-gray-800 ml-2`}>Histórico</Text>
            </View>
            
            <View style={tw`bg-gray-50 rounded-2xl p-2`}>
                {history.slice(0, 5).map((item) => {
                    const config = getTaskConfig(item.type);
                    return (
                        <View key={item.id} style={tw`p-3 border-b border-gray-200 flex-row items-center justify-between last:border-0`}>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`mr-3`}>
                                    <config.icon size={16} color={config.color} />
                                </View>
                                <Text style={tw`text-gray-700 font-medium`}>{config.label}</Text>
                            </View>
                            <Text style={tw`text-gray-400 text-xs`}>
                                {new Date(item.date_performed).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                            </Text>
                        </View>
                    );
                })}
                {history.length === 0 && (
                    <Text style={tw`p-4 text-center text-gray-400 text-xs`}>Nenhuma atividade registrada para esta planta.</Text>
                )}
            </View>
        </View>

        {/* Galeria */}
        <View style={tw`pl-6 mt-8 mb-20`}>
            <View style={tw`flex-row justify-between items-center mb-4 pr-6`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Galeria</Text>
                <TouchableOpacity onPress={handleAddPhoto} style={tw`flex-row items-center`}>
                    <Camera size={18} color="#166534" />
                    <Text style={tw`text-green-700 font-bold ml-1.5 text-sm`}>+ Foto</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList 
                horizontal
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
                renderItem={({item}) => (
                    <View style={tw`mr-3 relative`}>
                        <Image source={{ uri: item.photo_uri }} style={tw`w-28 h-36 rounded-xl bg-gray-100 border border-gray-200`} />
                        <View style={tw`absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded`}>
                            <Text style={tw`text-[10px] text-white font-bold`}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => handleDeletePhoto(item.id)}
                            style={tw`absolute top-1 right-1 bg-white/80 p-1.5 rounded-full shadow-sm`}
                        >
                            <X size={12} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>

        <View style={tw`px-6 pb-10`}>
            <TouchableOpacity onPress={handleDeletePlant} style={tw`p-4 rounded-xl flex-row justify-center items-center bg-red-50 border border-red-100`}>
                <Trash2 size={18} color="#ef4444" />
                <Text style={tw`text-red-600 ml-2 font-medium`}>Remover Planta</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={tw`flex-1 justify-end bg-black/60`}>
            <TouchableOpacity style={tw`flex-1`} onPress={() => setModalVisible(false)} />
            <View style={tw`bg-white rounded-t-[32px] p-6 pb-10 shadow-2xl`}>
                <Text style={tw`font-bold text-2xl text-gray-800 mb-6`}>Adicionar Cuidado ✨</Text>
                <View style={tw`flex-row flex-wrap justify-between mb-8`}>
                    {CARE_TYPES.map((type) => {
                        const isSelected = selectedType === type.id;
                        const Icon = type.icon;
                        return (
                            <TouchableOpacity 
                                key={type.id} onPress={() => setSelectedType(type.id)}
                                style={tw`w-[30%] items-center mb-4 p-4 rounded-2xl border-2 ${isSelected ? `border-green-500 bg-green-50` : 'border-gray-100 bg-gray-50'}`}
                            >
                                <View style={tw`mb-2`}><Icon size={28} color={isSelected ? '#166534' : '#9ca3af'} /></View>
                                <Text style={tw`text-xs font-bold ${isSelected ? 'text-green-800' : 'text-gray-400'}`}>{type.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
                <Text style={tw`font-bold text-gray-700 mb-3 text-base`}>Repetir a cada (dias)</Text>
                <TextInput 
                    placeholder="Ex: 7" keyboardType="numeric" value={newFrequency} onChangeText={setNewFrequency}
                    style={tw`bg-gray-50 border border-gray-200 p-4 rounded-xl text-lg mb-8 font-medium text-gray-800`}
                />
                <TouchableOpacity onPress={handleAddTask} style={tw`bg-green-600 p-4 rounded-xl items-center shadow-lg`}>
                    <Text style={tw`text-white font-bold text-lg`}>Salvar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}