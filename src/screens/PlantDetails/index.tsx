// src/screens/PlantDetails/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Image, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlants } from '../../contexts/PlantContext';
import { Trash2, Plus, Camera, Droplets, Clock, FastForward } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker'; // Instalar: npx expo install expo-image-picker
import tw from '../../utils/tw';

export default function PlantDetails() {
  const route = useRoute<any>();
  const { plant } = route.params; 
  const { getPlantTasks, addTaskToPlant, removePlant, snoozeTask, anticipateTask, addPlantPhoto, getPlantPhotos } = usePlants();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newFrequency, setNewFrequency] = useState('');

  useEffect(() => { 
      loadTasks(); 
      loadPhotos();
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

  const handleAddPhoto = async () => {
    // Solicita permissão e abre câmera
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
        Alert.alert("Permissão", "Precisamos de acesso à câmera.");
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
    });

    if (!result.canceled) {
        await addPlantPhoto(plant.id, result.assets[0].uri);
        loadPhotos();
    }
  };

  const handleSnooze = (taskId: number) => {
      Alert.alert("Adiar (Snooze)", "Adiar por quanto tempo?", [
          { text: "1 Dia", onPress: () => { snoozeTask(taskId, 1, plant.name); loadTasks(); } },
          { text: "2 Dias", onPress: () => { snoozeTask(taskId, 2, plant.name); loadTasks(); } },
          { text: "Cancelar", style: "cancel" }
      ]);
  };

  const handleAnticipate = (task: any) => {
      Alert.alert("Antecipar", `Marcar ${task.type} como feito hoje?`, [
          { text: "Sim", onPress: async () => { 
              await anticipateTask(task.id, task.frequency_days, plant.name); 
              loadTasks(); 
              Alert.alert("Atualizado!", "O ciclo foi reiniciado a partir de hoje.");
            } 
          },
          { text: "Não", style: "cancel" }
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
    await addTaskToPlant({
        plant_id: plant.id, type: 'fertilize', frequency_days: parseInt(newFrequency), next_due: new Date().toISOString()
    });
    setModalVisible(false); setNewFrequency(''); loadTasks();
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView style={tw`flex-1`}>
        {/* Cabeçalho */}
        <View style={tw`bg-white p-6 pb-4 border-b border-gray-200`}>
          <Text style={tw`text-3xl font-bold text-gray-800 mb-1`}>{plant.name}</Text>
          <Text style={tw`text-green-600 font-medium italic mb-4`}>{plant.species || 'Espécie desconhecida'}</Text>
          <View style={tw`flex-row gap-2 mb-4`}>
            <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}><Text style={tw`text-gray-600 text-xs`}>{plant.room}</Text></View>
          </View>
          <TouchableOpacity onPress={handleDeletePlant} style={tw`flex-row items-center`}>
            <Trash2 size={16} color="#ef4444" />
            <Text style={tw`text-red-500 ml-2 text-sm`}>Excluir Planta</Text>
          </TouchableOpacity>
        </View>

        {/* Tarefas e Ações */}
        <View style={tw`p-5`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Cuidados</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}><Plus size={20} color="#166534" /></TouchableOpacity>
            </View>

            {tasks.map((task) => {
                const nextDate = new Date(task.next_due).toLocaleDateString('pt-BR');
                return (
                    <View key={task.id} style={tw`bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100`}>
                        <View style={tw`flex-row justify-between mb-3`}>
                            <View style={tw`flex-row items-center`}>
                                <Droplets size={18} color="#3b82f6" style={tw`mr-2`} />
                                <Text style={tw`font-bold text-gray-700 capitalize`}>{task.type === 'water' ? 'Rega' : task.type}</Text>
                            </View>
                            <Text style={tw`text-gray-500 text-xs`}>Próx: {nextDate}</Text>
                        </View>
                        
                        <View style={tw`flex-row gap-2`}>
                            <TouchableOpacity onPress={() => handleAnticipate(task)} style={tw`flex-1 bg-blue-50 py-2 rounded-lg items-center flex-row justify-center`}>
                                <FastForward size={14} color="#2563eb" />
                                <Text style={tw`text-blue-600 font-bold text-xs ml-1`}>Antecipar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSnooze(task.id)} style={tw`flex-1 bg-orange-50 py-2 rounded-lg items-center flex-row justify-center`}>
                                <Clock size={14} color="#ea580c" />
                                <Text style={tw`text-orange-600 font-bold text-xs ml-1`}>Adiar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </View>

        {/* Galeria de Fotos */}
        <View style={tw`p-5 pt-0`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Diário</Text>
                <TouchableOpacity onPress={handleAddPhoto} style={tw`flex-row items-center`}>
                    <Camera size={18} color="#166534" />
                    <Text style={tw`text-green-800 font-bold ml-1`}>Nova Foto</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList 
                horizontal
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({item}) => (
                    <View style={tw`mr-3`}>
                        <Image source={{ uri: item.photo_uri }} style={tw`w-28 h-28 rounded-lg bg-gray-200`} />
                        <Text style={tw`text-xs text-gray-400 mt-1`}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={tw`text-gray-400 italic`}>Nenhuma foto registrada.</Text>}
            />
        </View>
      </ScrollView>

      {/* Modal Adicionar Tarefa (Simplificado) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/50 p-5`}>
            <View style={tw`bg-white p-6 rounded-2xl w-full`}>
                <Text style={tw`font-bold text-lg mb-4`}>Nova Rega/Adubação</Text>
                <TextInput 
                    placeholder="Frequência em dias (ex: 7)" 
                    keyboardType="numeric"
                    value={newFrequency}
                    onChangeText={setNewFrequency}
                    style={tw`bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4`}
                />
                <TouchableOpacity onPress={handleAddTask} style={tw`bg-green-600 p-3 rounded-lg items-center`}>
                    <Text style={tw`text-white font-bold`}>Salvar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`p-3 items-center mt-2`}>
                    <Text style={tw`text-gray-500`}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}