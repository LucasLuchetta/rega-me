import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, Droplets, MapPin, ChevronRight, Check, Clock, FastForward } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../../utils/tw';

export default function Dashboard() {
  const { plants, dueTasks, completeAllInRoom, completeTask, snoozeTask, anticipateTask, getPlantTasks, loadData } = usePlants();
  const navigation = useNavigation<any>();
  const [greeting, setGreeting] = useState('');

  useFocusEffect(useCallback(() => {
    loadData();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia, Jardineiro(a) ☀️');
    else if (hour < 18) setGreeting('Boa tarde 🍃');
    else setGreeting('Boa noite 🌙');
  }, []));

  const rooms = Array.from(new Set(plants.map(p => p.room))).sort();

  const getPendingCount = (room: string) => {
    return dueTasks.filter(t => t.room === room).length;
  };

  const handleQuickWater = (task: any) => {
      completeTask(task.id, task.frequency_days, task.plant_name);
  };

  const handleQuickSnooze = (task: any) => {
      snoozeTask(task.id, 2, task.plant_name);
      Alert.alert("Adiado", "Lembramos você em 2 dias.");
  };

  const handleQuickAnticipate = async (plant: any) => {
      const tasks = await getPlantTasks(plant.id);
      const waterTask = tasks.find((t: any) => t.type === 'water');
      
      if (waterTask) {
          Alert.alert("Adiantar Rega?", `Confirmar rega de hoje para ${plant.name}?`, [
              { text: "Cancelar", style: "cancel" },
              { 
                  text: "Sim, reguei!", 
                  onPress: async () => {
                      await anticipateTask(waterTask.id, waterTask.frequency_days, plant.name);
                      loadData();
                  } 
              }
          ]);
      } else {
          Alert.alert("Ops", "Esta planta não tem uma tarefa de rega configurada.");
      }
  };

  const handleWaterRoom = (room: string) => {
    Alert.alert(
        "Ritual de Cuidado 🚿", 
        `Vamos cuidar de todas as plantas da ${room} agora?`, 
        [
            { text: "Agora não", style: "cancel" },
            { 
                text: "Sim, cuidar de tudo!", 
                onPress: () => completeAllInRoom(room),
                style: "default"
            }
        ]
    );
  };

  const ListHeader = () => (
    <View style={tw`mb-8 mt-2`}>
        <Text style={tw`text-gray-400 text-xs font-bold uppercase tracking-widest mb-1`}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={tw`text-3xl font-extrabold text-gray-900`}>{greeting}</Text>
        
        {/* Substituído Gradiente por Cor Sólida */}
        <View style={tw`mt-6 bg-green-700 rounded-3xl p-6 shadow-lg relative overflow-hidden`}>
            <View style={tw`absolute -right-4 -top-4 w-32 h-32 bg-green-500 rounded-full opacity-20`} />
            <Text style={tw`text-green-100 font-medium text-sm mb-1`}>Status do Jardim</Text>
            <View style={tw`flex-row items-end`}>
                <Text style={tw`text-white text-4xl font-bold mr-2`}>{dueTasks.length}</Text>
                <Text style={tw`text-green-100 text-lg mb-1`}>ações pendentes</Text>
            </View>
            <Text style={tw`text-green-200 mt-2 text-sm`}>
                {dueTasks.length === 0 ? "Seu oásis está em perfeita harmonia. 🧘‍♀️" : "Algumas amigas precisam de sua atenção hoje."}
            </Text>
        </View>
    </View>
  );

  const renderRoom = ({ item: room }: { item: string }) => {
    const pendingCount = getPendingCount(room);
    const roomPlants = plants.filter(p => p.room === room);

    return (
      <View style={tw`bg-white rounded-3xl mb-5 shadow-sm border border-gray-100`}>
        <View style={tw`p-5 border-b border-gray-50 flex-row justify-between items-center`}>
            <View style={tw`flex-row items-center`}>
                <View style={tw`bg-gray-50 p-2.5 rounded-full mr-3`}>
                    <MapPin size={18} color="#4b5563" />
                </View>
                <View>
                    <Text style={tw`text-lg font-bold text-gray-800 leading-tight`}>{room}</Text>
                    <Text style={tw`text-xs text-gray-400 font-medium`}>{roomPlants.length} planta(s)</Text>
                </View>
            </View>
            {pendingCount > 0 && (
                <TouchableOpacity 
                    onPress={() => handleWaterRoom(room)}
                    style={tw`bg-blue-50 px-4 py-2 rounded-full flex-row items-center border border-blue-100`}
                >
                    <Droplets size={14} color="#2563eb" />
                    <Text style={tw`text-blue-700 text-xs font-bold ml-2`}>Cuidar ({pendingCount})</Text>
                </TouchableOpacity>
            )}
        </View>

        <View style={tw`py-1`}>
            {roomPlants.map((plant, index) => {
                const pendingTask = dueTasks.find(t => t.plant_id === plant.id);
                const isDue = !!pendingTask;

                return (
                    <View key={plant.id} style={tw`mx-4 py-4 ${index !== roomPlants.length -1 ? 'border-b border-gray-50' : ''}`}>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('PlantDetails', { plant })}
                            style={tw`flex-row justify-between items-center`}
                        >
                            <View style={tw`flex-row items-center flex-1`}>
                                <View style={tw`w-10 h-10 rounded-full ${isDue ? 'bg-orange-50 border border-orange-100' : 'bg-green-50 border border-green-100'} items-center justify-center mr-3 overflow-hidden`}>
                                    {plant.photo_uri ? (
                                        <ImageBackground source={{ uri: plant.photo_uri }} style={tw`w-full h-full`} />
                                    ) : (
                                        <Text style={tw`text-lg`}>{isDue ? '🥀' : '🌿'}</Text>
                                    )}
                                </View>
                                <View>
                                    <Text style={tw`text-gray-700 font-semibold`}>{plant.name}</Text>
                                    <Text style={tw`text-gray-400 text-xs italic`}>{plant.species || 'Espécie desconhecida'}</Text>
                                </View>
                            </View>
                            <ChevronRight size={18} color="#e5e7eb" />
                        </TouchableOpacity>

                        <View style={tw`flex-row mt-3 justify-end gap-2`}>
                            {isDue ? (
                                <>
                                    <TouchableOpacity 
                                        onPress={() => handleQuickSnooze(pendingTask)}
                                        style={tw`bg-orange-50 px-3 py-1.5 rounded-lg flex-row items-center border border-orange-100`}
                                    >
                                        <Clock size={12} color="#ea580c" />
                                        <Text style={tw`text-orange-700 text-xs font-bold ml-1`}>Adiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleQuickWater(pendingTask)}
                                        style={tw`bg-green-100 px-3 py-1.5 rounded-lg flex-row items-center border border-green-200`}
                                    >
                                        <Check size={12} color="#166534" />
                                        <Text style={tw`text-green-800 text-xs font-bold ml-1`}>Feito</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity 
                                    onPress={() => handleQuickAnticipate(plant)}
                                    style={tw`bg-blue-50 px-3 py-1.5 rounded-lg flex-row items-center border border-blue-100`}
                                >
                                    <FastForward size={12} color="#2563eb" />
                                    <Text style={tw`text-blue-700 text-xs font-bold ml-1`}>Adiantar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F3F4F6]`}>
      <FlatList 
          data={rooms}
          renderItem={renderRoom}
          keyExtractor={item => item}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
              <View style={tw`items-center mt-10 p-10 bg-white rounded-3xl border-2 border-dashed border-gray-200`}>
                  <Text style={tw`text-4xl mb-4 text-gray-300`}>🪴</Text> 
                  <Text style={tw`text-gray-800 font-bold text-lg`}>Comece seu Oásis</Text>
                  <Text style={tw`text-gray-400 text-center mt-2 leading-relaxed`}>
                      Seu jardim digital começa com a primeira planta. Toque no botão verde para dar vida ao app.
                  </Text>
              </View>
          }
      />

      <TouchableOpacity 
        onPress={() => navigation.navigate('AddPlant')}
        style={tw`absolute bottom-6 right-6 bg-green-600 w-16 h-16 rounded-full justify-center items-center shadow-2xl border-4 border-white`}
        activeOpacity={0.9}
      >
        <Plus color="white" size={32} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}