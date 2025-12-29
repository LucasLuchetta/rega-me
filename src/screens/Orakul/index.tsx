import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskDAO } from '../../database/TaskDAO';
import { usePlants } from '../../contexts/PlantContext';
import { CalendarDays, Droplets, Sprout, Scissors, ShieldAlert, Box, Check, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import tw from '../../utils/tw';

export default function Orakul() {
  const [futureTasks, setFutureTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { completeTask, snoozeTask } = usePlants();

  const loadFuture = async () => {
    setLoading(true);
    try {
      // Carrega 14 dias para garantir
      const result: any = await TaskDAO.getFutureTasks(14);
      setFutureTasks(result.rows?._array || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadFuture(); }, []));

  const getNextDays = (days: number) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
  };

  const daysList = getNextDays(7);

  // Filtrar tarefas para o dia selecionado
  const filteredTasks = futureTasks.filter(task => {
      const taskDate = new Date(task.next_due).toISOString().split('T')[0];
      const selDate = selectedDate.toISOString().split('T')[0];
      return taskDate === selDate;
  });

  const getIcon = (type: string) => {
      switch(type) {
          case 'water': return <Droplets size={20} color="#4ade80" />;
          case 'fertilize': return <Sprout size={20} color="#eab308" />;
          case 'prune': return <Scissors size={20} color="#ef4444" />;
          case 'mist': return <ShieldAlert size={20} color="#a855f7" />;
          case 'repot': return <Box size={20} color="#f97316" />;
          default: return <Droplets size={20} color="#4ade80" />;
      }
  };

  const handleTaskAction = (task: any) => {
    Alert.alert(
      task.plant_name,
      "O que deseja fazer?",
      [
        { text: "Adiar 1 dia", onPress: async () => {
          await snoozeTask(task.id, 1, task.plant_name);
          loadFuture();
        }},
        { text: "Concluir Hoje", onPress: async () => {
          await completeTask(task.id, task.frequency_days, task.plant_name);
          loadFuture();
        }},
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleTaskAction(item)}
      style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center border-l-4 border-green-500 shadow-sm`}
    >
      <View style={tw`mr-4 items-center justify-center bg-gray-100 w-12 h-12 rounded-lg`}>
         {getIcon(item.type)}
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`font-bold text-gray-800 text-lg`}>{item.plant_name}</Text>
        <Text style={tw`text-gray-500 uppercase text-xs font-semibold tracking-wider`}>
          {item.type === 'water' ? 'Rega' : item.type === 'fertilize' ? 'Adubo' : item.type}
        </Text>
      </View>
      <View style={tw`flex-row items-center`}>
         <Clock size={14} color="#166534" style={tw`mr-1`} />
         <Text style={tw`text-green-800 font-bold text-xs`}>
            {new Date(item.next_due).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
         </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1 pt-5`}>
        <View style={tw`px-5 mb-6 flex-row items-center`}>
          <CalendarDays color="#166534" size={28} />
          <Text style={tw`text-2xl font-bold text-gray-800 ml-3`}>Previsão</Text>
        </View>

        {/* Timeline Horizontal */}
        <View style={tw`mb-6 pl-5`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {daysList.map((date, index) => {
                    const isSelected = date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
                    const dateStr = date.toISOString().split('T')[0];
                    const hasTask = futureTasks.some(t => t.next_due.startsWith(dateStr));

                    return (
                        <TouchableOpacity 
                            key={index}
                            onPress={() => setSelectedDate(date)}
                            activeOpacity={0.7}
                            style={tw`items-center justify-center w-16 h-22 rounded-2xl mr-3 ${isSelected ? 'bg-green-600 shadow-md' : 'bg-white border border-gray-100'}`}
                        >
                            <Text style={tw`text-xs mb-1 font-medium capitalize ${isSelected ? 'text-green-100' : 'text-gray-400'}`}>
                                {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                            </Text>
                            <Text style={tw`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                {date.getDate()}
                            </Text>
                            <View style={tw`mt-2 h-1.5 w-1.5 rounded-full ${hasTask ? (isSelected ? 'bg-white' : 'bg-green-500') : 'bg-transparent'}`} />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>

        <View style={tw`flex-1 px-5`}>
            <Text style={tw`text-gray-500 mb-4 font-medium`}>
                Tarefas para {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </Text>
            
            {filteredTasks.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center opacity-50 pb-20`}>
                <View style={tw`bg-gray-200 p-4 rounded-full mb-4`}>
                    <Sprout size={32} color="#9ca3af" />
                </View>
                <Text style={tw`text-lg text-gray-400 font-medium`}>Dia livre de regas! 🎉</Text>
                <Text style={tw`text-sm text-gray-400 mt-1`}>Aproveite para admirar seu jardim.</Text>
            </View>
            ) : (
            <FlatList
                data={filteredTasks} 
                keyExtractor={(item) => item.id.toString()} 
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFuture} colors={['#4ade80']} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            />
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}