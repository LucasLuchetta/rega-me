import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // CORREÇÃO AQUI
import { usePlants } from '../../contexts/PlantContext';
import { Plus, Droplets, Home, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../utils/tw';

export default function Dashboard() {
  const { plants, dueTasks, completeAllInRoom } = usePlants();
  const navigation = useNavigation<any>();

  // Agrupa plantas por cômodo
  const rooms = Array.from(new Set(plants.map(p => p.room))).sort();

  // Conta tarefas pendentes no cômodo
  const getPendingCount = (room: string) => {
    return dueTasks.filter(t => t.room === room).length;
  };

  const handleWaterRoom = (room: string) => {
    Alert.alert("Regar Cômodo", `Marcar todas as plantas da ${room} como cuidadas?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Regar Tudo", onPress: () => completeAllInRoom(room) }
    ]);
  };

  const renderRoom = ({ item: room }: { item: string }) => {
    const pendingCount = getPendingCount(room);
    const roomPlants = plants.filter(p => p.room === room);

    return (
      <View style={tw`bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden`}>
        {/* Cabeçalho do Cômodo */}
        <View style={tw`p-4 bg-gray-50 flex-row justify-between items-center border-b border-gray-100`}>
            <View style={tw`flex-row items-center`}>
                <Home size={20} color="#4b5563" style={tw`mr-2`} />
                <Text style={tw`text-lg font-bold text-gray-800`}>{room}</Text>
            </View>
            
            {/* Botão de Regar Tudo (só aparece se houver pendências) */}
            {pendingCount > 0 && (
                <TouchableOpacity 
                    onPress={() => handleWaterRoom(room)}
                    style={tw`bg-blue-100 px-3 py-1 rounded-full flex-row items-center`}
                >
                    <Droplets size={14} color="#1d4ed8" />
                    <Text style={tw`text-blue-800 text-xs font-bold ml-1`}>Regar Tudo ({pendingCount})</Text>
                </TouchableOpacity>
            )}
        </View>

        {/* Lista de Plantas do Cômodo */}
        <View style={tw`px-4`}>
            {roomPlants.map(plant => {
                // Verifica se essa planta tem tarefa pendente
                const isDue = dueTasks.some(t => t.plant_id === plant.id);
                return (
                    <TouchableOpacity 
                        key={plant.id}
                        onPress={() => navigation.navigate('PlantDetails', { plant })}
                        style={tw`py-4 border-b border-gray-100 flex-row justify-between items-center last:border-0`}
                    >
                        <View style={tw`flex-row items-center`}>
                            {isDue && <View style={tw`w-2 h-2 bg-red-500 rounded-full mr-2`} />}
                            <Text style={tw`text-gray-700 font-medium`}>{plant.name}</Text>
                        </View>
                        <ChevronRight size={16} color="#d1d5db" />
                    </TouchableOpacity>
                );
            })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1 px-5 pt-5`}>
        <Text style={tw`text-3xl font-bold text-gray-800 mb-6 mt-4`}>Meus Ambientes 🏡</Text>
        
        <FlatList 
            data={rooms}
            renderItem={renderRoom}
            keyExtractor={item => item}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
                <View style={tw`items-center mt-20`}>
                    <Text style={tw`text-gray-400 text-lg`}>Nenhum ambiente ainda.</Text>
                    <Text style={tw`text-gray-400 text-sm`}>Adicione sua primeira planta!</Text>
                </View>
            }
        />

        <TouchableOpacity 
          onPress={() => navigation.navigate('AddPlant')}
          style={tw`absolute bottom-6 right-6 bg-green-600 w-14 h-14 rounded-full justify-center items-center shadow-lg`}
        >
          <Plus color="white" size={30} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}