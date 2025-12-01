import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlants } from '../../contexts/PlantContext';
import { Plus, MapPin, CloudSun, Wind, Droplets } from 'lucide-react-native'; // Importei ícones de clima
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CircularProgress from '../../components/CircularProgress'; // Importe o novo componente
import tw from '../../utils/tw';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function Dashboard() {
  const { plants, dueTasks, completeTask, snoozeTask, loadData } = usePlants();
  const navigation = useNavigation<any>();

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const rooms = Array.from(new Set(plants.map(p => p.room))).sort();

  const handleQuickWater = (task: any) => {
      completeTask(task.id, task.frequency_days, task.plant_name);
  };

  // Função para calcular a % de água restante
  const getWaterLevel = (nextDue: string, frequency: number) => {
      const today = new Date();
      const due = new Date(nextDue);
      
      // Diferença em dias
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Se já passou da data (negativo), nível é 0%
      if (diffDays <= 0) return 0;
      
      // Se falta mais dias que a frequência (ex: adiantado), 100%
      if (diffDays > frequency) return 100;

      // Cálculo da porcentagem
      return Math.round((diffDays / frequency) * 100);
  };

  // Widget de Tempo Simples (Mock Visual)
  const WeatherWidget = () => (
    <View style={tw`flex-row items-center bg-white px-3 py-2 rounded-full border border-gray-100 shadow-sm`}>
        <View style={tw`bg-blue-50 p-1.5 rounded-full mr-2`}>
            <CloudSun size={16} color="#3b82f6" />
        </View>
        <View>
            <Text style={tw`text-gray-800 font-bold text-xs`}>24°C</Text>
            <Text style={tw`text-gray-400 text-[10px] font-medium`}>Ensolarado</Text>
        </View>
    </View>
  );

  const RenderHeader = () => (
    <View style={tw`px-6 pt-2 pb-6`}>
        {/* Top Bar com Clima */}
        <View style={tw`flex-row justify-between items-start mb-8`}>
            <View style={tw`flex-1`}>
                <Text style={tw`text-gray-400 text-xs font-bold uppercase tracking-widest mb-1`}>
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={tw`text-3xl font-extrabold text-gray-800`}>Meu Jardim 🌱</Text>
            </View>
            
            {/* Novo Widget de Tempo no Canto Superior Direito */}
            <WeatherWidget />
        </View>

        {/* Section: Lembretes de Hoje (Cards com Círculo de Água) */}
        <View style={tw`mb-4`}>
            <View style={tw`flex-row justify-between items-end mb-4`}>
                <Text style={tw`text-xl font-bold text-gray-800`}>Precisam de Água</Text>
            </View>

            {dueTasks.length === 0 ? (
                <View style={tw`bg-green-50 p-6 rounded-3xl border border-green-100 items-center flex-row`}>
                    <View style={tw`bg-green-100 p-3 rounded-full mr-4`}>
                        <Droplets size={24} color="#166534" />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-green-800 font-bold text-lg`}>Tudo hidratado!</Text>
                        <Text style={tw`text-green-600 text-sm`}>Suas plantas estão felizes por hoje.</Text>
                    </View>
                </View>
            ) : (
                <FlatList 
                    data={dueTasks}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingRight: 24 }}
                    renderItem={({ item }) => {
                        // Calcula o nível de água baseado na data
                        const waterLevel = getWaterLevel(item.next_due, item.frequency_days);
                        
                        // Define cor baseada na urgência
                        let levelColor = '#22c55e'; // Verde
                        if (waterLevel < 30) levelColor = '#f59e0b'; // Amarelo
                        if (waterLevel < 10) levelColor = '#ef4444'; // Vermelho

                        return (
                            <View style={tw`bg-white w-72 p-5 rounded-[28px] mr-4 shadow-sm border border-gray-100`}>
                                <View style={tw`flex-row justify-between items-start mb-4`}>
                                    <View style={tw`flex-row items-center flex-1`}>
                                        <Image 
                                            source={item.photo_uri ? { uri: item.photo_uri } : require('../../../assets/icon.png')} 
                                            style={tw`w-14 h-14 rounded-2xl bg-gray-100`} 
                                        />
                                        <View style={tw`ml-3 flex-1`}>
                                            <Text style={tw`font-bold text-gray-800 text-lg`} numberOfLines={1}>{item.plant_name}</Text>
                                            <Text style={tw`text-gray-400 text-xs uppercase font-bold tracking-wide`}>{item.room}</Text>
                                        </View>
                                    </View>
                                    
                                    {/* Círculo de Porcentagem de Água */}
                                    <View style={tw`ml-2`}>
                                        <CircularProgress 
                                            size={48} 
                                            percentage={waterLevel} 
                                            color={levelColor} 
                                            strokeWidth={4}
                                        />
                                    </View>
                                </View>

                                <View style={tw`flex-row gap-3 mt-2`}>
                                    <TouchableOpacity 
                                        onPress={() => snoozeTask(item.id, 1, item.plant_name)}
                                        style={tw`flex-1 py-3 rounded-xl bg-gray-50 border border-gray-200 items-center`}
                                    >
                                        <Text style={tw`text-gray-500 font-bold text-sm`}>Adiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => handleQuickWater(item)}
                                        style={tw`flex-1 py-3 bg-blue-500 rounded-xl items-center shadow-lg shadow-blue-500/30 flex-row justify-center`}
                                    >
                                        <Droplets size={16} color="white" style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-sm`}>Regar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
        
        {/* Título da seção de salas */}
        <Text style={tw`text-xl font-bold text-gray-800 mt-4 mb-2`}>Minhas Salas</Text>
    </View>
  );

  const renderRoomItem = ({ item: room }: { item: string }) => {
    const roomPlants = plants.filter(p => p.room === room);
    
    // Verifica se alguma planta nesta sala precisa de água
    const pendingTasksInRoom = dueTasks.filter(t => t.room === room).length;

    return (
        <TouchableOpacity 
            style={[tw`bg-white p-5 rounded-[28px] mb-4 shadow-sm border border-gray-100 justify-between relative overflow-hidden`, { width: CARD_WIDTH, height: CARD_WIDTH * 1.2 }]}
            onPress={() => {/* Navegar para lista da sala */}}
        >
            {/* Indicador de Alerta na Sala */}
            {pendingTasksInRoom > 0 && (
                <View style={tw`absolute top-0 right-0 bg-red-500 px-3 py-1 rounded-bl-2xl z-10`}>
                    <Text style={tw`text-white text-[10px] font-bold`}>{pendingTasksInRoom}</Text>
                </View>
            )}

            <View>
                <View style={tw`bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mb-3`}>
                    <MapPin size={20} color="#166534" />
                </View>
                <Text style={tw`font-bold text-gray-800 text-lg leading-tight`} numberOfLines={1}>{room}</Text>
                <Text style={tw`text-gray-400 text-xs mt-1`}>{roomPlants.length} plantas</Text>
            </View>

            {/* Miniaturas das plantas na sala */}
            <View style={tw`flex-row mt-4 pl-2`}>
                {roomPlants.slice(0, 3).map((p, i) => (
                    <View key={p.id} style={tw`w-8 h-8 rounded-full border-2 border-white -ml-2 bg-gray-200 overflow-hidden shadow-sm`}>
                         {p.photo_uri ? (
                            <Image source={{ uri: p.photo_uri }} style={tw`w-full h-full`} />
                         ) : <View style={tw`w-full h-full bg-green-200 items-center justify-center`}><Text style={tw`text-[8px]`}>🌿</Text></View>}
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#FAFAFA]`}>
      <FlatList
        ListHeaderComponent={RenderHeader}
        data={rooms}
        keyExtractor={item => item}
        renderItem={renderRoomItem}
        numColumns={2}
        columnWrapperStyle={tw`justify-between px-6`}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Botão Flutuante */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('AddPlant')}
        style={tw`absolute bottom-8 right-6 bg-gray-900 w-16 h-16 rounded-full justify-center items-center shadow-2xl shadow-gray-900/50`}
        activeOpacity={0.9}
      >
        <Plus color="white" size={32} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}