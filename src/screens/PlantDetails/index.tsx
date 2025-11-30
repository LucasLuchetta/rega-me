import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePlants } from '../../contexts/PlantContext';
import { Trash2, Plus, Sprout, Droplets, Scissors } from 'lucide-react-native';
import tw from '../../utils/tw';

export default function PlantDetails() {
  const route = useRoute<any>();
  const { plant } = route.params; 
  const { getPlantTasks, addTaskToPlant, removePlant } = usePlants();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskType, setNewTaskType] = useState('fertilize');
  const [newFrequency, setNewFrequency] = useState('');

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    if (getPlantTasks) {
        const data = await getPlantTasks(plant.id);
        setTasks(data);
    }
  };

  const handleDeletePlant = () => {
    Alert.alert("Excluir Planta", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await removePlant(plant.id); navigation.goBack(); } }
    ]);
  };

  const handleAddTask = async () => {
    if (!newFrequency) return;
    if (addTaskToPlant) {
        await addTaskToPlant({
        plant_id: plant.id, type: newTaskType as any, frequency_days: parseInt(newFrequency), next_due: new Date().toISOString()
        });
    }
    setModalVisible(false); setNewFrequency(''); loadTasks();
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
    <View style={tw`flex-1 bg-gray-50`}>
      <ScrollView style={tw`p-5`}>
        <View style={tw`bg-white p-6 rounded-2xl shadow-sm mb-6`}>
          <Text style={tw`text-3xl font-bold text-gray-800 mb-1`}>{plant.name}</Text>
          <Text style={tw`text-green-600 font-medium mb-4`}>{plant.species || 'Espécie desconhecida'}</Text>
          
          <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
            <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}><Text style={tw`text-gray-600 text-xs`}>{plant.room}</Text></View>
            <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}><Text style={tw`text-gray-600 text-xs`}>Vaso: {plant.pot_size || 'N/A'}</Text></View>
          </View>

          <TouchableOpacity onPress={handleDeletePlant} style={tw`flex-row items-center`}>
            <Trash2 size={18} color="#ef4444" />
            <Text style={tw`text-red-500 ml-2`}>Excluir Planta</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`text-xl font-bold text-gray-800`}>Ciclos de Cuidado</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={tw`bg-green-light p-2 rounded-full`}>
            <Plus size={20} color="#166534" />
          </TouchableOpacity>
        </View>

        {tasks.map((task) => (
          <View key={task.id} style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm`}>
            <View style={tw`bg-gray-50 p-3 rounded-full mr-4`}>
              {getIcon(task.type)}
            </View>
            <View>
              <Text style={tw`font-bold text-gray-800 capitalize`}>{translateType(task.type)}</Text>
              <Text style={tw`text-gray-500 text-sm`}>A cada {task.frequency_days} dias</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`bg-white p-6 rounded-t-3xl`}>
            <Text style={tw`text-xl font-bold text-gray-800 mb-4`}>Novo Ciclo</Text>
            
            <Text style={tw`text-gray-600 mb-2`}>Tipo de Cuidado</Text>
            <View style={tw`flex-row gap-2 mb-4`}>
              {['fertilize', 'prune', 'mist'].map(type => (
                <TouchableOpacity key={type} onPress={() => setNewTaskType(type)}
                  style={tw`px-4 py-2 rounded-full border ${newTaskType === type ? 'bg-green-light border-green-500' : 'bg-white border-gray-200'}`}
                >
                  <Text style={tw`${newTaskType === type ? 'text-green-800' : 'text-gray-600'}`}>{translateType(type)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={tw`text-gray-600 mb-2`}>Repetir a cada (dias)</Text>
            <TextInput value={newFrequency} onChangeText={setNewFrequency} keyboardType="numeric"
              style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6`} placeholder="Ex: 15"
            />

            <TouchableOpacity onPress={handleAddTask} style={tw`bg-green-600 p-4 rounded-xl items-center mb-2`}>
              <Text style={tw`text-white font-bold`}>Adicionar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`p-4 items-center`}>
              <Text style={tw`text-gray-500`}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}