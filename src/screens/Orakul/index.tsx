import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskDAO } from '../../database/TaskDAO';
import { usePlants } from '../../contexts/PlantContext';
import { Droplets, Sprout, Scissors, ShieldAlert, Box, Check } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import tw from '../../utils/tw';
import { teardrop } from '../../utils/shape';

export default function Orakul() {
  const [futureTasks, setFutureTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { completeTask, snoozeTask } = usePlants();

  const loadFuture = async () => {
    setLoading(true);
    try {
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

  const filteredTasks = futureTasks.filter(task => {
    const taskDate = new Date(task.next_due).toISOString().split('T')[0];
    const selDate = selectedDate.toISOString().split('T')[0];
    return taskDate === selDate;
  });

  const TASK_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
    water: { icon: Droplets, color: '#D98F5F', bg: '#FBEEE3' },
    fertilize: { icon: Sprout, color: '#7C9B72', bg: '#EAF1E4' },
    prune: { icon: Scissors, color: '#C2705A', bg: '#F6E4DF' },
    mist: { icon: Droplets, color: '#6FA5AE', bg: '#E4F1F3' },
    pesticide: { icon: ShieldAlert, color: '#9333ea', bg: '#F3E8FF' },
    repot: { icon: Box, color: '#B0834A', bg: '#F1E7D6' },
  };

  const translateType = (type: string) => {
    switch (type) {
      case 'water': return 'Rega';
      case 'fertilize': return 'Adubo';
      case 'prune': return 'Poda';
      case 'mist': return 'Borrifar';
      case 'pesticide': return 'Pesticida';
      case 'repot': return 'Troca de Vaso';
      default: return type;
    }
  };

  const handleTaskAction = (task: any) => {
    Alert.alert(
      task.plant_name,
      "O que deseja fazer?",
      [
        { text: "Adiar 1 dia", onPress: async () => {
          await snoozeTask(task.id, 1, task.plant_name, task.type);
          loadFuture();
        }},
        { text: "Concluir Hoje", onPress: async () => {
          await completeTask(task.id, task.frequency_days, task.plant_name, task.type);
          loadFuture();
        }},
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const config = TASK_STYLES[item.type] || TASK_STYLES.water;
    const Icon = config.icon;
    return (
      <View style={[tw`p-4 rounded-3xl mb-3 flex-row items-center justify-between`, { backgroundColor: config.bg }]}>
        <TouchableOpacity onPress={() => handleTaskAction(item)} style={tw`flex-1 flex-row items-center`}>
          <View style={[tw`items-center justify-center bg-white mr-3.5`, teardrop(44, 14)]}>
            <Icon size={18} color={config.color} />
          </View>
          <View style={tw`flex-1`}>
            <Text style={[tw`font-bold text-[15px]`, { color: '#3E2A1B' }]}>{item.plant_name}</Text>
            <Text style={[tw`text-xs mt-0.5`, { color: '#B08A63' }]}>{translateType(item.type)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await completeTask(item.id, item.frequency_days, item.plant_name, item.type);
            loadFuture();
          }}
          style={tw`w-10 h-10 bg-white rounded-full items-center justify-center ml-2`}
        >
          <Check size={18} color={config.color} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1 pt-6`}>
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-stone-400 text-[11px] font-label uppercase tracking-[2px] mb-2`}>Agenda</Text>
          <Text style={tw`text-3xl font-light text-stone-900`}>Calendário</Text>
        </View>

        {/* Day picker */}
        <View style={tw`mb-6 pl-6`}>
          <FlatList
            data={daysList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ paddingRight: 24 }}
            renderItem={({ item: date }) => {
              const isSelected = date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
              const dateStr = date.toISOString().split('T')[0];
              const hasTask = futureTasks.some(t => t.next_due.startsWith(dateStr));

              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                  style={tw`items-center justify-center w-14 py-2.5 rounded-2xl mr-2.5 ${isSelected ? 'bg-stone-900' : 'bg-stone-50'}`}
                >
                  <Text style={tw`text-[10px] mb-1 font-medium capitalize ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                  </Text>
                  <Text style={tw`text-base font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                    {date.getDate()}
                  </Text>
                  <View style={[tw`mt-1.5 h-1.5 w-1.5 rounded-full`, { backgroundColor: hasTask ? (isSelected ? '#fff' : '#7C9B72') : 'transparent' }]} />
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={tw`flex-1 px-6`}>
          <Text style={tw`text-stone-400 mb-4 text-xs uppercase tracking-[1px] font-label`}>
            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </Text>

          {filteredTasks.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center pb-24`}>
              <View style={[tw`bg-stone-50 items-center justify-center mb-4`, teardrop(64, 20)]}>
                <Text style={{ fontSize: 26 }}>🌿</Text>
              </View>
              <Text style={tw`text-[15px] text-stone-900 font-medium`}>Dia livre de regas</Text>
              <Text style={tw`text-sm text-stone-400 mt-1`}>Aproveite para admirar seu jardim.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredTasks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFuture} colors={['#7C9B72']} />}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
