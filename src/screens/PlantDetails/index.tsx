// src/screens/PlantDetails/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlants } from '../../contexts/PlantContext';
import { Trash2, Plus, Sprout, Droplets, Scissors } from 'lucide-react-native';

export default function PlantDetails() {
  const route = useRoute<any>();
  const { plant } = route.params; // Recebe o objeto da planta via navegação
  const { getPlantTasks, addTaskToPlant, removePlant } = usePlants();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form Nova Tarefa
  const [newTaskType, setNewTaskType] = useState('fertilize');
  const [newFrequency, setNewFrequency] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (getPlantTasks) {
        const data = await getPlantTasks(plant.id);
        setTasks(data);
    }
  };

  const handleDeletePlant = () => {
    Alert.alert("Excluir Planta", "Tem certeza? Isso apagará todo o histórico.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          await removePlant(plant.id);
          navigation.goBack();
        } 
      }
    ]);
  };

  const handleAddTask = async () => {
    if (!newFrequency) return;
    
    if (addTaskToPlant) {
        await addTaskToPlant({
        plant_id: plant.id,
        type: newTaskType as any,
        frequency_days: parseInt(newFrequency),
        next_due: new Date().toISOString()
        });
    }
    
    setModalVisible(false);
    setNewFrequency('');
    loadTasks();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'water': return <Droplets size={20} color="#3b82f6" />;
      case 'fertilize': return <Sprout size={20} color="#eab308" />;
      case 'prune': return <Scissors size={20} color="#ef4444" />;
      default: return <Sprout size={20} color="#22c55e" />;
    }
  };

  const translateType = (type: string) => {
    const map: any = { water: 'Rega', fertilize: 'Adubação', prune: 'Poda', mist: 'Borrifar' };
    return map[type] || type;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="p-5">
        <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <Text className="text-3xl font-bold text-gray-800 mb-1">{plant.name}</Text>
          <Text className="text-green-600 font-medium mb-4">{plant.species || 'Espécie desconhecida'}</Text>
          
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="bg-gray-100 px-3 py-1 rounded-full"><Text className="text-gray-600 text-xs">{plant.room}</Text></View>
            <View className="bg-gray-100 px-3 py-1 rounded-full"><Text className="text-gray-600 text-xs">Vaso: {plant.pot_size || 'N/A'}</Text></View>
          </View>

          <TouchableOpacity onPress={handleDeletePlant} className="flex-row items-center">
            <Trash2 size={18} color="#ef4444" />
            <Text className="text-red-500 ml-2">Excluir Planta</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-800">Ciclos de Cuidado</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-green-100 p-2 rounded-full">
            <Plus size={20} color="#166534" />
          </TouchableOpacity>
        </View>

        {tasks.map((task) => (
          <View key={task.id} className="bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm">
            <View className="bg-gray-50 p-3 rounded-full mr-4">
              {getIcon(task.type)}
            </View>
            <View>
              <Text className="font-bold text-gray-800 capitalize">{translateType(task.type)}</Text>
              <Text className="text-gray-500 text-sm">A cada {task.frequency_days} dias</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal Adicionar Tarefa */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white p-6 rounded-t-3xl">
            <Text className="text-xl font-bold text-gray-800 mb-4">Novo Ciclo</Text>
            
            <Text className="text-gray-600 mb-2">Tipo de Cuidado</Text>
            <View className="flex-row gap-2 mb-4">
              {['fertilize', 'prune', 'mist'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  onPress={() => setNewTaskType(type)}
                  className={`px-4 py-2 rounded-full border ${newTaskType === type ? 'bg-green-100 border-green-500' : 'bg-white border-gray-200'}`}
                >
                  <Text className={newTaskType === type ? 'text-green-800' : 'text-gray-600'}>
                    {translateType(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-600 mb-2">Repetir a cada (dias)</Text>
            <TextInput 
              value={newFrequency} 
              onChangeText={setNewFrequency}
              keyboardType="numeric"
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6"
              placeholder="Ex: 15"
            />

            <TouchableOpacity onPress={handleAddTask} className="bg-green-600 p-4 rounded-xl items-center mb-2">
              <Text className="text-white font-bold">Adicionar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="p-4 items-center">
              <Text className="text-gray-500">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}