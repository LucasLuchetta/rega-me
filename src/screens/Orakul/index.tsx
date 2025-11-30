import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskDAO } from '../../database/TaskDAO';
import { CalendarDays, Droplets, Sprout, Scissors, ShieldAlert, Box } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../../utils/tw';

export default function Orakul() {
  const [futureTasks, setFutureTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFuture = async () => {
    setLoading(true);
    try {
      const result: any = await TaskDAO.getFutureTasks(7);
      setFutureTasks(result.rows?._array || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { loadFuture(); }, []));

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

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

  const renderItem = ({ item }: { item: any }) => (
    <View style={tw`bg-white p-4 rounded-xl mb-3 flex-row items-center border-l-4 border-green-500 shadow-sm`}>
      <View style={tw`mr-4 items-center justify-center bg-gray-100 w-12 h-12 rounded-lg`}>
         {getIcon(item.type)}
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`font-bold text-gray-800 text-lg`}>{item.plant_name}</Text>
        <Text style={tw`text-gray-500 uppercase text-xs font-semibold tracking-wider`}>
          {item.type === 'water' ? 'Rega' : item.type === 'fertilize' ? 'Adubo' : item.type}
        </Text>
      </View>
      <View style={tw`bg-green-light px-3 py-1 rounded-full`}>
        <Text style={tw`text-green-800 font-bold text-xs`}>{formatDate(item.next_due)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1 px-5 pt-5`}>
        <View style={tw`mb-6 flex-row items-center`}>
          <CalendarDays color="#166534" size={28} />
          <Text style={tw`text-2xl font-bold text-gray-800 ml-3`}>Calendário</Text>
        </View>
        <Text style={tw`text-gray-500 mb-4`}>Previsão para os próximos 7 dias</Text>
        {futureTasks.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center opacity-50`}>
            <Text style={tw`text-lg text-gray-400`}>Nada previsto. O futuro é incerto...</Text>
          </View>
        ) : (
          <FlatList
            data={futureTasks} keyExtractor={(item) => item.id.toString()} renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFuture} colors={['#4ade80']} />}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}